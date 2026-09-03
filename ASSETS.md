# Media drop list — David Castellanos rebrand

Every placeholder box in the page has a `data-slot="..."` attribute. Find that
slot in `index.html`, and **replace the whole `<div class="media-slot">…</div>`
block** with the real `<img>` or `<video>` tag shown below. Nothing else changes.

---

## How to swap a slot

**Photo slot → image**

```html
<!-- before -->
<div class="media-slot" data-slot="listing-01" style="--ar: 4 / 3"> … </div>

<!-- after -->
<img src="assets/img/listings/listing-01.jpg"
     alt="123 Example St, Brandon — front exterior"
     width="1600" height="1200" loading="lazy"
     style="aspect-ratio: 4 / 3; object-fit: cover; width: 100%; border-radius: 4px;">
```

**Video slot → video**

```html
<video src="assets/video/feature-tour.mp4"
       poster="assets/img/feature-tour-poster.jpg"
       controls playsinline preload="metadata"
       style="aspect-ratio: 16 / 9; object-fit: cover; width: 100%; border-radius: 4px;"></video>
```

**Full-bleed slot (`media-slot--fill`) → background video**

```html
<video class="hero__video" src="assets/video/hero-reel.mp4"
       autoplay muted loop playsinline
       poster="assets/img/hero-poster.jpg"></video>
```

…and add to `css/style.css`:

```css
.hero__video{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
```

---

## The full list

### Video (5 files)

| slot | file | spec | notes |
|---|---|---|---|
| `hero-reel` | `assets/video/hero-reel.mp4` | 1920×1080, 12–20s, **silent loop**, < 6 MB | Autoplays behind the headline. Keep it slow and wide — no fast cuts. Needs a matching poster frame `hero-poster.jpg`. **Currently filled** with a 5s AI clip (David in a modern home) — `1920×718`, audio stripped, bottom cropped to remove the Hailuo/MiniMax watermark. `object-position:50% 38%` in CSS keeps his face in frame. Replace with real footage when available. |
| `video-feature` | `assets/video/feature-tour.mp4` | 1920×1080, 60–90s, with audio | Featured property walkthrough. Rotate monthly. Needs `feature-tour-poster.jpg`. |
| `video-meet` | `assets/video/meet-david.mp4` | 1080×1920 vertical, 30–45s | "Meet David." Burn in subtitles — most views are muted. Doubles as a Reel. |
| `video-community` | `assets/video/brandon-life.mp4` | 1080×1920 vertical, 30–45s | Brandon life: Assiniboine trails, downtown, schools, winter + summer. |
| *(poster frames)* | `assets/img/*-poster.jpg` | same dimensions, JPG | One per video. Without these the videos show black until they load. |

### Photo (16 files)

| slot | file | spec | notes |
|---|---|---|---|
| `agent-portrait` | `assets/img/agent/david-portrait.jpg` | 1600×2000 (4:5) | **FILLED — temporarily.** Currently the 300×300 headshot lifted from the live davidcastellanos.ca. Too small to enlarge, so it renders at native size inside a dark panel with its black backdrop masked into it (see the `.portrait` rules in `style.css`). Replace with a real 1600×2000 vertical shot — natural light, real location, a kitchen or a porch or a street. Not a grey studio backdrop. When you do, drop the `max-width` and `mask-image` rules on `.portrait img`. |
| ~~`path-buy` / `path-sell` / `path-invest`~~ | — | — | **Dropped.** The "What I do" cards are now text-only (number / heading / paragraph / link) with a top accent rule. Generic mood shots there read as stock; the editorial cards look better and need no assets. Add `<img>` back inside each `.path` before `.path__body` if real photos ever exist. |
| ~~`listing-01` … `listing-06`~~ | `assets/img/listings/coulter-01…26.jpg` | ~1024px | **DONE.** Featured listing = 20 Coulter Way (MLS 202612563), 26-photo gallery. Photos are ~1024px — swap in the brokerage's full-res set when available. |
| listings — commercial | `assets/img/listings/{tenth-302,perry-industrial-lots,grandview-527}.jpg` | ~1024px | **DONE.** David's 4 other current listings (302 10th St retail, 624 + 529 Perry St and 527 Grandview St vacant land) pulled from realtor.ca and shown as compact `.listing-card`s under "Commercial & land". Perry lots share one plat-map image. All tagged `data-intent="invest"` so the search bar filters them. Prices/status scraped 2026-09-03 — **verify against MLS before launch**; drop a card if it's no longer active. |
| ~~`hood-*`~~ | — | — | **Section removed.** The "Neighbourhoods I know best" grid is gone (markup, CSS, nav links). Re-add a `<section class="hoods">` if it ever comes back. |
| `evaluation-bg` | `assets/img/evaluation-bg.jpg` | 2400×1200 | Wide exterior at dusk, interior lights on. Text sits over the left half — keep that side quiet. |
| — | `assets/img/og-cover.jpg` | 1200×630 | Social share card. Not a slot; referenced in `<head>`. |

---

## Before you drop files in

1. **Resize first.** Nothing above 2400px wide. A 6000px camera JPEG will make
   the page feel broken on Brandon-area connections.
2. **Export WebP too** if it's easy — roughly 30% smaller at the same quality:
   ```
   ffmpeg -i listing-01.jpg -q:v 80 listing-01.webp
   ```
3. **Compress video with H.264**, the format every browser plays:
   ```
   ffmpeg -i raw.mov -vcodec libx264 -crf 24 -preset slow -an -movflags +faststart hero-reel.mp4
   ```
   (`-an` strips audio — required for the autoplay hero. Drop it for the tours.)
4. **No `+` characters in filenames.** Static hosts decode `+` in a URL path as
   a space and the file 404s. Use hyphens.
5. **Write real `alt` text.** It is the address and what you're looking at:
   `"1204 Louise Ave, Brandon — front exterior"`, not `"house"`.

---

## Brand marks (his face as the logo)

There is no wordmark or monogram — the logo **is** David. All of these are
generated from the one headshot, so they refresh automatically once a better
portrait exists.

| file | size | where it is used |
|---|---|---|
| `assets/img/brand/mark-120.png` | 120×120 | The circular mark in the nav (42px) and footer (54px). Plain colour face crop; the black studio backdrop fills the circle and CSS adds a hairline ring that flips light-on-dark as the nav changes state. |
| `assets/img/brand/icon-16.png` | 16×16 | Browser tab |
| `assets/img/brand/icon-32.png` | 32×32 | Browser tab (retina), bookmarks |
| `assets/img/brand/icon-48.png` | 48×48 | Windows taskbar / shortcuts |
| `assets/img/brand/apple-touch-icon.png` | 180×180 | iOS home screen |
| `assets/img/brand/icon-512.png` | 512×512 | `site.webmanifest`, Android |

The icon versions are a **plain colour face crop masked to a full-bleed circle**,
transparent outside the circle — no light field, no border. A gentle
brightness/contrast/saturation lift keeps the face readable down to 16px. The
`apple-touch-icon` is the same crop left opaque and square (iOS masks its own
corners and turns transparency black, so it gets no alpha).

The in-page mark (`mark-120.png`) is the same plain colour crop, unmasked (the
nav/footer CSS rounds it). The site has no accent colour and takes all of its
colour from photography, and that mark is photography.

### Regenerating

Requires `ffmpeg` (already installed). From the project root, with a new
portrait at `assets/img/agent/david-portrait.jpg` — **re-check the crop values**,
they are tuned to the current 300×300 file:

```bash
SRC=assets/img/agent/david-portrait.jpg
OUT=assets/img/brand
CROP="crop=176:176:92:30"           # w/h/x/y of the face in the source, centred on the head
EQ="eq=brightness=0.03:contrast=1.08:saturation=1.04"

# in-page mark: plain face crop
ffmpeg -y -i "$SRC" -vf "$CROP,scale=120:120:flags=lanczos" "$OUT/mark-120.png"

# icon master: colour face, circular alpha, rendered 2x then downscaled for a clean edge
ffmpeg -y -i "$SRC" -vf "$CROP,scale=1024:1024:flags=lanczos,$EQ,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-511.5,Y-511.5),512),255,0)'" -frames:v 1 /tmp/icon-master.png

ffmpeg -y -i /tmp/icon-master.png -vf "scale=512:512:flags=lanczos" "$OUT/icon-512.png"
for s in 16 32 48; do
  ffmpeg -y -i /tmp/icon-master.png -vf "scale=$s:$s:flags=lanczos" "$OUT/icon-$s.png"
done

# apple-touch: opaque, square, no alpha
ffmpeg -y -i "$SRC" -vf "$CROP,scale=180:180:flags=lanczos,$EQ" "$OUT/apple-touch-icon.png"
```

### A caveat worth raising with David

A face works well as an *agent* mark — real estate is a personal-trust business
and this is a common, effective choice. But it is worth knowing what it cannot
do, because a monogram can:

- **It does not survive one colour.** No single-colour stamp, no embossing, no
  etched glass, no fax-quality print.
- **It has a floor size.** Below roughly 24px it is a smudge.
- **It ages.** A logo built on a 2020 headshot needs re-cutting every time he
  re-shoots, and every piece of print carrying the old one is instantly dated.

The usual answer is to run both: the face as the primary web/social mark, and a
simple `DC` monogram kept in reserve for signage, stamps and small print. The
monogram version is a ten-minute job if he wants it — say the word.
