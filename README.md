# Khanya Dental Studio — concept demo

A concept build for an **invented** South African dental brand: **6 static pages, no
framework, no build step.** Same infrastructure pattern as the Africrest pitch demo and the
THATHA demo — flat HTML, one stylesheet, one small progressive-enhancement script, deployed
to Vercel.

> **Khanya Dental Studio does not exist.** There is no practice, no practitioners, no HPCSA
> registration and no appointment diary. Everything on the site — brand, people, prices,
> statistics, reviews, address — is invented for demonstration. See
> [Concept labelling](#concept-labelling) for how that is enforced.

```
index.html          Home — hero, signature services, about split, illustrative stats
services.html       General + cosmetic dentistry, indicative fees
about.html          The name, the design system, honest status, photo credits
testimonials.html   Sample review layout (all quotes invented, monograms not faces)
blog.html           Sample article cards (headlines only — nothing written)
contact.html        Booking form, location, hours, FAQ
styles.css          The whole design system (~22KB, hand-rolled)
site.js             Mobile nav + form handling (~3KB, no dependencies)
assets/             Photography, logo mark, favicon (~200KB total)
tools/              Image sourcing + screenshot harness — NOT deployed
```

Open `index.html` directly in a browser, or serve it:

```bash
python -m http.server 8765
# http://127.0.0.1:8765/
```

---

## The brand

**Khanya** is a verb in isiXhosa and isiZulu: *to shine, to give light, to become bright*.
It is also a common given name across South Africa.

It was chosen over the two obvious alternatives for reasons worth recording:

- **Not a surname.** Most SA dental practices are named for the principal dentist, which
  stops working the moment that dentist retires or sells.
- **Pronounceable across language groups.** `Mamatheka` (isiZulu, "to smile") is more
  literal and more distinctly SA, but five syllables is a real cost for a brand people must
  say aloud to refer a friend.

Positioning line: **"Modern dentistry, gentle hands."**

---

## Design system

| Colour | Hex | Used for |
|---|---|---|
| Deep sea navy | `#0C2A33` | Text, nav, dark bands |
| Coastal mist | `#DCE8EC` | Page background |
| Khanya gold | `#E8A33D` | CTAs, eyebrows, the concept banner |
| Aloe | `#2E9E8F` | Secondary accent |

All tokens live in `:root` at the top of `styles.css`. Breakpoints: **1080 / 980 / 640**.

**Type** — `Archivo` (headings, tight uppercase) and `Inter` (body, light). Both are
open-licensed and served from Google Fonts, so there is no font licence to buy before this
could go to production. That is deliberate: the THATHA build inherited a brand pack
specifying Benton Sans, which is licensed and cannot legally be web-embedded.

**Layout** — the page sits on mist; the hero is an inset rounded card floating on it, and
everything below lives on a white sheet sharing the same radius. That inset-card structure
is the load-bearing idea of the reference design.

---

## Concept labelling

This is a demo, and it is labelled in **five** independent places so no single edit can
quietly turn it into something mistakable for a live practice:

1. **`.demo-banner`** — gold bar above the nav on every page.
2. **`robots.txt`** — `Disallow: /`.
3. **`vercel.json`** — `X-Robots-Tag: noindex, nofollow` on every response.
4. **`.concept-note`** — full disclosure block in the footer of every page.
5. **Inline `.placeholder-tag`s** — beside every invented figure, practitioner and location.

The header matters more than the banner. The banner stops a *person* mistaking this for a
real practice; the header stops Google indexing a fictional dental clinic and surfacing it
to somebody actually searching for care. On a healthcare concept that second risk is the
serious one.

### Rules applied to the copy

- **No invented practitioner names or credentials.** The reference design shows
  "Dr Jonas Suherman, Pediatric Dentistry, 7 year Experience, 4.5 Rating". Attaching an
  invented clinical credential to a real stock-photo person is a different and worse fiction
  than an obviously fake statistic, so every practitioner card reads *"Dental practitioner /
  Placeholder profile"*.
- **No stock faces on testimonials.** Invented quotes get a monogram, never a photograph —
  putting words in a real photographed person's mouth is the thing to avoid.
- **Every number captioned.** The `98% / 50K / 4.9` stat row carries an explicit
  "illustrative figures, not audited" note directly beneath it.
- **The form says so.** Submitting the booking form states plainly that no appointment was
  booked, rather than silently swallowing it — which on a dental site would mean somebody
  believing they have an appointment that does not exist.

---

## Tools (not deployed)

`tools/` is in `.vercelignore` and never ships.

```bash
node tools/find-images.mjs --all      # search Pexels, download preview candidates
node tools/fetch-assets.mjs           # fetch the CHOSEN photos as webp into assets/
node tools/dims.mjs                   # print intrinsic dimensions for width/height attrs
node tools/shoot.mjs                  # screenshot every page @ 1440 + 390, flag overflow
node tools/shoot.mjs --url https://…  # same, against a live deploy
node tools/overflow.mjs about.html 390 # name the elements past the viewport edge
```

`shoot.mjs` and `overflow.mjs` borrow Playwright from the sibling `thatha` checkout rather
than adding `node_modules` here — the site itself stays zero-dependency, which is the point
of the pattern. If that repo moves, one `createRequire` line in each needs updating.

---

## One CSS trap worth knowing

An `<img>`'s `width`/`height` **attributes** become CSS presentational hints, and
`aspect-ratio` only resolves a **missing** dimension. So a definite attribute height
alongside `width:100%` makes `aspect-ratio` a silent no-op and lets `object-fit:cover` crop
the frame. `styles.css` guards this globally with `img[width][height] { height: auto }`.

That guard scores **(0,2,1)** — two attribute selectors beat a lone class. Images that must
*fill* their box therefore have to out-specify it, which is why you will see
`.about-figure img[width][height]` rather than `.about-figure img`. Dropping the attributes
from those selectors will not error; it will just silently stop working.

---

Built by [Phuture Digital](https://www.phuturedigital.co.za).
