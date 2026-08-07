# Deploy

Static site, no build step. Vercel serves the repo root as-is.

## Vercel

| | |
|---|---|
| Project | `khanya` |
| Project ID | `prj_mWXMGZTSBgRoJmHmFVIMqJmZspLc` |
| Scope | `tlotlisos-projects-5b82e36b` |
| Vercel account | `hello-4505` |
| GitHub repo | `Phuturedigital/khanya` (connected) |
| Branch | `main` — pushes auto-deploy to production |
| Framework preset | Other / none — there is nothing to build |

Zero-build: no `package.json`, so Vercel serves the repo root as static files.

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
(`ns1.tld-ns.net`, `ns2.tld-ns.com`, `ns3.tld-ns.net`, `ns4.tld-ns.com`). Vercel therefore
**cannot** create the record itself — it has to be added by hand at the registrar.

**Add this record:**

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `khanya-concept` | `3c17e37ad118f96d.vercel-dns-016.com.` | default |

> Vercel's CLI text output also offers `A khanya-concept 76.76.21.21` as an alternative.
> Prefer the CNAME — Vercel can move the underlying IP and the CNAME follows it. This
> matches how `thatha-concept`, `hamba-concept` and `africrest-concept` are wired.

Verify once propagated:

```bash
vercel domains inspect khanya-concept.phuturedigital.co.za
nslookup khanya-concept.phuturedigital.co.za
curl -sSI https://khanya-concept.phuturedigital.co.za | head -12
node tools/shoot.mjs --url https://khanya-concept.phuturedigital.co.za
```

Expect `X-Robots-Tag: noindex, nofollow` on every path, and a Let's Encrypt certificate
issued for the exact hostname.

## Sharing

⚠️ **Never share a raw `khanya-<hash>.vercel.app` deployment URL.** Deployment Protection is
on for per-deployment URLs, so recipients hit a "Login – Vercel" wall. Share only the custom
domain.
