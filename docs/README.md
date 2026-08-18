# VFactorSolutions

Marketing site for vFactor Solutions — recruitment, RPO and lead generation.
Static site, no build step, served from GitHub Pages on a custom domain.

## Layout

```
docs/
  index.html            one-page site
  privacy.html          privacy notice
  terms.html            terms of use
  thank-you.html        post-submission confirmation (noindex)
  404.html              not-found page (noindex)
  robots.txt            crawl policy, points at the sitemap
  sitemap.xml           indexable pages only
  site.webmanifest      installable-app metadata
  favicon.ico           root copy, for browsers that request /favicon.ico directly
  assets/css/style.css  all styles, shared by every page
  assets/js/main.js     all behaviour, shared by every page
  assets/img/           favicons, social preview, founder photo derivatives
  assets/founder.png    master founder photo (source only, never served)
```

`index.html` used to carry byte-identical copies of the CSS and JS inline. Both
now load from `assets/`, so a change is made in one place and every page picks
it up.

## Things worth knowing before editing

**Analytics are consent-gated.** The GoatCounter endpoint lives in the
`data-analytics` attribute on `<html>`. Nothing is requested until a visitor
accepts in the banner; the answer is stored in `localStorage` under
`vfactor-consent`. The privacy page has a button (`data-consent="reset"`) that
clears the answer so the banner asks again.

**Forms.** Both forms post to Formspree over `fetch`, validate inline before
sending, show a spinner while in flight, and then redirect to
`thank-you.html?from=…`. The hidden `_next` field is the no-JavaScript path to
the same page. Validation lives in `main.js`; `required` stays in the markup so
browsers without JavaScript still validate natively.

**Images.** The founder photo is served as WebP with a JPEG fallback at 216px
and 432px (`<picture>` in `index.html`), regenerated from `assets/founder.png`.
Add a new photo the same way — do not link a multi-megabyte PNG directly.

**Sticky mobile CTA.** Below 860px a bar appears once the hero scrolls away and
retreats again over the contact section, the footer, an open menu or the cookie
banner. It is `#sticky-cta` in `index.html`.

## Content to supply

Search the HTML for `TODO` — each one marks a placeholder that needs real
information before or shortly after launch:

- registered entity name, address and GSTIN, in the footer and both legal pages
- delivery outcomes to replace the experience-years stat strip
- at least two more reviews, ideally from clients rather than colleagues
- a data-retention period you will actually honour, in the privacy notice
- a second Formspree form so candidate submissions do not share an inbox thread
  with reviews
- a lawyer's read of `terms.html` before you rely on it

The contact address used across the site is `vijay@vfactorsolutions.com`. That
mailbox must exist on the domain before launch.
