#!/usr/bin/env node
/**
 * Pull David Castellanos' active listings from the CREA DDF® feed
 * (RESO Web API) and write them to data/listings.json — the file the
 * site renders from. Run by the "sync-listings" GitHub Action on a
 * schedule; can also be run locally.
 *
 * Requires two secrets in the environment:
 *   CREA_CLIENT_ID       OAuth client id  from REALTOR Link / CREA
 *   CREA_CLIENT_SECRET   OAuth client secret
 *
 * Optional:
 *   CREA_AGENT_FILTER    extra OData $filter fragment, ANDed onto the
 *                        status filter — use it if the DDF feed is
 *                        scoped wider than "my listings", e.g.
 *                        contains(ListAgentFullName,'Castellanos')
 *
 * If the two secrets are missing the script exits 0 without touching
 * anything, so scheduled runs stay green until CREA access is set up.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'listings.json');

const TOKEN_URL = 'https://identity.crea.ca/connect/token';
const API_BASE = 'https://ddfapi.realtor.ca/odata/v1';

const { CREA_CLIENT_ID, CREA_CLIENT_SECRET, CREA_AGENT_FILTER } = process.env;

if (!CREA_CLIENT_ID || !CREA_CLIENT_SECRET) {
  console.log('[sync-listings] CREA_CLIENT_ID / CREA_CLIENT_SECRET not set — nothing to do.');
  console.log('[sync-listings] See DDF-SETUP.md to enable the feed.');
  process.exit(0);
}

/* ----------------------------------------------------------------- */

const money = new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
});

const AREA_OPTIONS = [
  'Riverheights', 'Linden Lanes', 'Green Acres', 'Waverly Park',
  'Woodlands', 'South End', 'Downtown and East End', 'Rural Westman',
];

async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'DDFApi_Read',
    client_id: CREA_CLIENT_ID,
    client_secret: CREA_CLIENT_SECRET,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (!json.access_token) throw new Error('no access_token in token response');
  return json.access_token;
}

async function fetchAllProperties(token) {
  const statusFilter = "StandardStatus eq 'Active'";
  const filter = CREA_AGENT_FILTER
    ? `(${statusFilter}) and (${CREA_AGENT_FILTER})`
    : statusFilter;

  let url =
    `${API_BASE}/Property?$expand=Media&$filter=${encodeURIComponent(filter)}` +
    `&$top=100&$orderby=ModificationTimestamp desc`;

  const all = [];
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`property ${res.status}: ${await res.text()}`);
    const json = await res.json();
    all.push(...(json.value || []));
    url = json['@odata.nextLink'] || null;
  }
  return all;
}

/* --- mapping helpers --- */

function kindOf(p) {
  const t = `${p.PropertyType || ''} ${p.PropertySubType || ''}`.toLowerCase();
  if (t.includes('vacant land') || t.includes('land')) return 'Land';
  if (t.includes('residential') || t.includes('single family') ||
      t.includes('condo') || t.includes('town') || t.includes('duplex')) return 'House';
  return 'Commercial';
}

function cleanRemarks(s) {
  if (!s) return '';
  // strip MLS board prefixes like "CSE//Brandon/" or "D21//Brandon/"
  return String(s).replace(/^[A-Z0-9]{1,6}\s*\/\/[^/]*\//, '').trim();
}

function shortAddress(p) {
  if (p.UnparsedAddress) return String(p.UnparsedAddress).split(',')[0].trim();
  return [p.StreetNumber, p.StreetName, p.StreetSuffix].filter(Boolean).join(' ').trim();
}

function areaFor(p) {
  const raw = (p.SubdivisionName || p.CityRegion || p.MLSAreaMajor || '').trim();
  const hit = AREA_OPTIONS.find((o) => o.toLowerCase() === raw.toLowerCase());
  return hit || '';
}

function areaLabel(p) {
  const city = p.City || 'Brandon';
  const hood = (p.SubdivisionName || p.CityRegion || '').trim();
  return hood ? `${city} · ${hood}` : city;
}

function specLine(p, kind) {
  const bits = [];
  if (kind === 'House') {
    if (p.BedroomsTotal) bits.push(`${p.BedroomsTotal} bed`);
    if (p.BathroomsTotalInteger) bits.push(`${p.BathroomsTotalInteger} bath`);
    if (p.LivingArea) bits.push(`${Number(p.LivingArea).toLocaleString('en-CA')} sq ft`);
    if (p.YearBuilt) bits.push(`built ${p.YearBuilt}`);
  } else {
    if (p.PropertySubType) bits.push(p.PropertySubType);
    if (p.LotSizeArea && p.LotSizeUnits) bits.push(`${p.LotSizeArea} ${p.LotSizeUnits}`);
    else if (p.LotSizeDimensions) bits.push(p.LotSizeDimensions);
    if (p.YearBuilt) bits.push(`built ${p.YearBuilt}`);
  }
  return bits.join(' · ');
}

function factsFor(p, kind) {
  const f = [];
  const push = (k, v) => { if (v !== undefined && v !== null && `${v}`.trim() !== '') f.push([k, `${v}`]); };
  push('Type', [p.PropertyType, p.PropertySubType].filter(Boolean).join(' — '));
  if (kind === 'House') {
    push('Bedrooms', p.BedroomsTotal);
    push('Bathrooms', p.BathroomsTotalInteger);
    if (p.LivingArea) push('Size', `${Number(p.LivingArea).toLocaleString('en-CA')} sq ft${p.YearBuilt ? ` · built ${p.YearBuilt}` : ''}`);
    push('Parking', (p.ParkingFeatures || []).join(', ') || p.ParkingTotal);
  } else {
    push('Land size', (p.LotSizeArea && p.LotSizeUnits) ? `${p.LotSizeArea} ${p.LotSizeUnits}` : p.LotSizeDimensions);
    push('Frontage', p.FrontageLength || p.LotSizeDimensions);
    push('Year built', p.YearBuilt);
  }
  if (Array.isArray(p.Heating) && p.Heating.length) push('Heating', p.Heating.join(', '));
  if (p.TaxAnnualAmount) push('Property taxes', `${money.format(p.TaxAnnualAmount)} / year`);
  push('MLS®', p.ListingId);
  return f;
}

function photosFor(p) {
  const media = (p.Media || [])
    .filter((m) => !m.MediaCategory || /photo|image/i.test(m.MediaCategory) || /image/i.test(m.MediaType || ''))
    .filter((m) => m.MediaURL)
    .sort((a, b) => (a.Order ?? 0) - (b.Order ?? 0));
  const addr = shortAddress(p);
  return media.map((m, i) => ({
    src: m.MediaURL,
    alt: m.ShortDescription || m.LongDescription || `${addr} — photo ${i + 1}`,
  }));
}

function mapListing(p) {
  const kind = kindOf(p);
  const addr = shortAddress(p);
  const sub = [
    [p.City || 'Brandon', p.StateOrProvince || 'Manitoba'].join(', '),
    p.PostalCode,
    (p.SubdivisionName || p.CityRegion || '').trim(),
    `MLS® ${p.ListingId}`,
  ].filter(Boolean).join(' · ');

  return {
    mls: p.ListingId,
    status: p.StandardStatus || 'Active',
    kind,
    price: Math.round(p.ListPrice || 0),
    priceLabel: p.ListPrice ? money.format(p.ListPrice) : 'Contact for price',
    address: addr,
    areaLabel: areaLabel(p),
    area: areaFor(p),
    intent: 'buy invest',
    spec: specLine(p, kind),
    sub,
    description: cleanRemarks(p.PublicRemarks),
    office: p.ListOfficeName || '',
    facts: factsFor(p, kind),
    photos: photosFor(p),
  };
}

/* ----------------------------------------------------------------- */

async function main() {
  console.log('[sync-listings] requesting token…');
  const token = await getToken();

  console.log('[sync-listings] fetching properties…');
  const props = await fetchAllProperties(token);
  console.log(`[sync-listings] ${props.length} active listing(s) from the feed`);

  const listings = props
    .map(mapListing)
    .filter((l) => l.mls)
    .sort((a, b) => b.price - a.price);

  const doc = {
    generated: new Date().toISOString(),
    source: 'crea-ddf',
    note: 'Auto-generated from the CREA DDF® feed by scripts/sync-listings.mjs. Do not edit by hand.',
    listings,
  };
  const next = JSON.stringify(doc, null, 2) + '\n';

  let prev = '';
  try { prev = readFileSync(OUT, 'utf8'); } catch { /* first run */ }

  // compare ignoring the `generated` timestamp so unchanged data is a no-op
  const strip = (s) => s.replace(/"generated":\s*"[^"]*",?\s*/, '');
  if (strip(prev) === strip(next)) {
    console.log('[sync-listings] no changes.');
    return;
  }

  writeFileSync(OUT, next);
  console.log(`[sync-listings] wrote ${listings.length} listing(s) to data/listings.json`);
  for (const l of listings) console.log(`  ${l.mls}  ${l.address}  ${l.priceLabel}  (${l.photos.length} photos)`);
}

main().catch((err) => {
  console.error('[sync-listings] failed:', err.message);
  process.exit(1);
});
