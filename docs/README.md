# VFactorSolutions

Marketing site for vFactor Solutions — recruitment, RPO and lead generation.
Static site, no build step, served from GitHub Pages on a custom domain.

## Structure

```
index.html            single-page site
privacy.html          privacy notice (linked from both forms)
404.html              GitHub Pages error page
robots.txt            crawl rules + sitemap pointer
sitemap.xml           two URLs
site.webmanifest      PWA / homescreen metadata
CNAME                 custom domain (unchanged)
assets/
  css/style.css
  js/main.js
  founder.jpg
  img/og.png              1200x630 social preview
  img/favicon.svg
  img/apple-touch-icon.png
```

## Content to supply before this is finished

Ordered by how much each one costs you while it's missing.

1. **Mailbox on the domain.** Every contact point now reads
   `vijay@vfactorsolutions.com`. Create it (Zoho Mail has a free tier for a
   custom domain), or revert with:
   `grep -rl 'vijay@vfactorsolutions.com' . | xargs sed -i 's/vijay@vfactorsolutions.com/cpvijay25@gmail.com/g'`
2. **Two more reviews**, at least two of them clients rather than colleagues,
   with company and role. See the TODO in the reviews section.
3. **Delivery metrics** for the hero stat strip — roles closed, median
   time-to-fill, offer-to-join ratio, repeat-client share. Years of
   experience are the weakest available proof.
4. **SLAs in the process section** — a real time commitment per stage.
5. **Commercials in the engagement cards** — fee percentage, retainer split,
   monthly RPO rate, replacement guarantee window.
6. **Two case studies.** The section is written and commented out in
   `index.html`; uncomment and fill it.
7. **Registered entity name, address and GSTIN** in the footer and in
   `privacy.html`. Procurement teams look for these.
8. **A second Formspree form** so candidate submissions don't share an inbox
   thread with reviews.

## Removed deliberately

- The `hits.sh` visit counter, which was padded with `extraCount=1293`.
  Inflated numbers are visible in page source.
- The first-visit popup, which fired at 600ms and emailed on every dismissal.
  Replaced by the intent chips in the hero.
- The Tabler icon font from cdnjs (a whole webfont for two glyphs) — now
  inline SVG.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000
