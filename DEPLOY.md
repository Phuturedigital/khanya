# Deploy

Static site, no build step. Vercel serves the repo root as-is.

## Vercel

- **Project:** `khanya`
- **Framework preset:** Other / none — there is nothing to build
- **Build command:** none · **Output directory:** repo root
- **Git:** connected to `Phuturedigital/khanya`, branch **`main`**. Pushing to `main`
  deploys automatically.

`vercel.json` sets `cleanUrls` (so `/services` serves `services.html`), `trailingSlash:false`,
and the response headers — including `X-Robots-Tag: noindex, nofollow` on **every** path.

> Do not remove the noindex header. It is the machine-readable half of the concept
> labelling, and it is what stops a fictional dental practice appearing in local search
> results for somebody genuinely looking for care.

## Domain

Live at **https://khanya-concept.phuturedigital.co.za**

Concept-site convention is `<brand>-concept.phuturedigital.co.za`, matching
`africrest-concept` and `thatha-concept`.

⚠️ **`phuturedigital.co.za` sits in the Vercel account, but its nameservers are third-party**
(`ns*.tld-ns.com`). Vercel therefore cannot create the record itself — each subdomain needs a
CNAME added **manually at the registrar**:

```
CNAME  khanya-concept  →  <target reported by `vercel domains inspect`>
```

Verify afterwards with:

```bash
vercel domains inspect khanya-concept.phuturedigital.co.za
node tools/shoot.mjs --url https://khanya-concept.phuturedigital.co.za
```

## Sharing

⚠️ **Never share a raw `khanya-<hash>.vercel.app` deployment URL.** Deployment Protection is
on for per-deployment URLs, so recipients hit a "Login – Vercel" wall. Share only the custom
domain.
