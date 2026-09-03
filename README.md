# David Castellanos — website rebrand

A ground-up replacement for `davidcastellanos.ca`, currently a stock
**Web4Realty** agent template.

- **Stack:** static HTML + CSS + vanilla JS. No build step, no dependencies, no
  npm install. Double-click `index.html` and it runs.
- **Deploy:** drag the folder onto Vercel / Netlify, or push to GitHub and
  connect. Zero config.
- **Fonts:** Fraunces + Inter, from Google Fonts.

---

## Run it

```
start index.html
```

Or, for a proper local server (needed once video files are in place):

```
npx serve .
# or
python -m http.server 8080
```

---

## What was wrong with the old site

| Problem | Consequence |
|---|---|
| Stock Web4Realty template — identical to hundreds of other agent sites | Nothing about it says *David*. A client can't tell him apart from the next agent. |
| Placeholder stock photography throughout | Zero local proof. No Brandon, no real listings, no face. |
| No video anywhere | The format that does most of the work in real estate now is absent entirely. |
| "Live Who You Are" tagline, then no follow-through | A good line with nothing built on it. |
| Six tool-shaped nav items (Mortgage Calculator, Area Alert, Listing Alerts…) | Navigation built around *features*, not around what a visitor came to do. |
| Web4Realty branding in the footer | Reads as rented, not owned. |

---

## What this rebrand does

**1. Keeps the tagline, builds a brand on it.**
"Live who you are" survives as the hero headline — it's genuinely good and
David already has equity in it. Everything else is new.

**2. Reorganises around intent, not features.**
Buy / Sell / Invest are the three doors. The calculator, alerts and MLS search
become *tools inside* those paths instead of competing top-level nav items.

**3. Puts video first.**
A silent full-bleed hero loop, a featured property tour, and two vertical films
that double as Instagram Reels. Shoot once, use in three places.

**4. Sells Brandon, not just houses.**
A neighbourhood section — Riverheights, Linden Lanes, Green Acres, Downtown,
Rural Westman. This is the strongest SEO play available to a local agent, and
the old site had nothing like it.

**5. Monochrome, on purpose.**
There is no brand accent colour. Paper, ink, two greys, one rule colour. Every
bit of colour on the page comes from David's photography, which is the point:
nothing competes with the houses. Source Serif 4 for headlines, Archivo for
everything else — both plain workhorse families rather than the trendy serif +
Inter pairing that every site generator reaches for.

**6. Written in first person.**
The old site talked about David in the third person, the way templates do.
This one is written as him: "I have been selling houses in Brandon since 2014."
Short fragment headlines and rule-of-three lists were removed throughout —
they are the loudest tell that copy was generated rather than written.

**7. Interactivity, kept deliberately small.**
- Hero quick-search with a Buy/Sell/Invest toggle
- Filterable listings grid (All / Active / Pending / Sold)
- **A working mortgage calculator** using Canadian semi-annual compounding and
  real CMHC premium tiers, not the usual wrong monthly-compounding version
- Review slider, sticky nav, full-screen mobile menu
- Media fades in on scroll. Text does not move at all.

Removed on purpose: the scroll progress bar, the count-up stat animation, and
the staggered fade-up on every element. Motion on everything reads as generated;
motion on the few things that need it reads as built.

---

## Structure

```
davidcastellanos-rebrand/
├── index.html          one page, ten sections
├── css/style.css       design tokens at the top — change 6 values, reskin the site
├── js/main.js          ~250 lines, no dependencies, commented by section
├── site.webmanifest
├── assets/
│   ├── video/          hero-reel, feature-tour, meet-david, brandon-life
│   └── img/
│       ├── brand/      face-derived logo mark + favicons
│       ├── agent/
│       ├── listings/
│       └── neighbourhoods/
├── ASSETS.md           ← every photo/video slot, exact filename + dimensions
└── README.md
```

### Re-skinning

The top of `css/style.css`:

```css
--paper:   #FAFAF9;   /* page              */
--paper-2: #F1F0ED;   /* recessed panel    */
--ink:     #131313;   /* type, dark surfaces */
--ink-2:   #1E1E1E;   /* raised dark surface */
--grey:    #706F6C;   /* secondary text    */
--line:    #E3E2DE;   /* rules, borders    */
```

If David later wants a brand colour after all, adding one back is a single new
token plus a handful of swaps (buttons, the active filter pill, form focus,
link underlines). Everything else stays as is.

---

## Media placeholders

Every future photo and video sits in a dashed box labelled with its exact
filename and dimensions. **See `ASSETS.md`** — it lists all 20 slots (19 still empty) and the
copy-paste replacement markup for each.

Slots are addressable via `data-slot`, e.g.:

```js
document.querySelector('[data-slot="hero-reel"]')
```

---

## Still to do

**Content (needs David)**
- [ ] Real bio — 2–3 paragraphs in his own voice
- [ ] Real stats (the four counters are placeholder numbers, flagged on-page)
- [x] Real reviews - three of David's Google reviews are now live in the
      slider (Fredy Sierra Caicedo, Javier Gutierrez, and one attributed to
      "Google review, Brandon"). Two things still open:
      - The first reviewer's Google display name is **"Duck puncher"**, which
        cannot be published. Ask them for a first name, or leave the generic
        attribution.
      - A fourth review from **Kailen Harte** is held back in a comment in the
        reviews section. The screenshot was cut off at Google's "More" link and
        the text we have stops on the negative, before the turnaround. Needs the
        rest of the sentence.
- [ ] Link "All reviews on Google" to David's actual Google Business profile
- [ ] Real listings: address, price, beds, baths, sqft
- [ ] Confirm phone/email — old site shows two numbers, `(204) 922-0455` and
      `(204) 571-5900`. Which is primary?
- [ ] Social URLs — the old site's Twitter link points at `@web4realty`, the
      template vendor, not at David

**Build**
- [ ] All media (`ASSETS.md`). One slot is already filled: David's headshot,
      pulled from the live site at 300×300. It renders sharp but it is a
      stand-in — a proper 1600×2000 portrait is still needed.
- [ ] Wire the two forms to a real endpoint. Options, cheapest first:
      Formspree · an OpnForm form on the TEG instance · an n8n webhook →
      email + CRM. The n8n route is the same pattern already running for the
      TEG sites.
- [ ] MLS search — decide between keeping the Sutton/Web4Realty widget in an
      iframe, or linking out. The `#mlsBtn` block is where it goes.
- [x] Favicon / app-icon set — generated from David's face (see `ASSETS.md`,
      Brand marks). Regenerate from a high-res portrait when one exists.
- [ ] `og-cover.jpg` (1200×630 social share card) — still missing
- [ ] Individual listing pages (currently cards only, no detail view)
- [ ] Neighbourhood landing pages — this is where the SEO actually pays off
- [ ] Analytics (Vercel Web Analytics is one script tag)
- [ ] Point `davidcastellanos.ca` at the new host, and confirm what breaks when
      the Web4Realty subscription lapses (listing alerts and area alerts likely
      live on their platform, not ours)

**Legal**
- [ ] Correct REALTOR®/MLS® trademark attribution and brokerage disclosure —
      the footer has a first pass, but Sutton-Harrison will have required wording
- [ ] Privacy policy, if forms collect anything

---

## Open questions for David

1. Does he own `davidcastellanos.ca` directly, or is it registered through
   Web4Realty? This decides how painful the cutover is.
2. Are listing alerts / area alerts worth rebuilding, or was that just template
   furniture nobody used?
3. Does he want a blog? It's the other half of the local-SEO play, but it only
   works if someone actually writes it.
4. Is there existing footage or does everything need to be shot?
