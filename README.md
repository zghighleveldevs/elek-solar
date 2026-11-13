# Elek Solar — website

Static rebuild of [eleksolar.com](https://eleksolar.com), styled to match the original WordPress site (same layout, fonts, colors, photos and copy), without the WordPress overhead.

## Structure

```
index.html                     Home
about-us.html                  About Us
solar-faqs.html                Solar FAQs
solar-panel-cost-calculator.html
blog.html                      Blog (cards link to existing posts on eleksolar.com)
services.html                  Services
solar-energy-for-homes.html    Residential Solar
solar-power-for-businesses.html Commercial Solar
roofing-services.html          Roofing
our-solar-locations.html       Locations
solar-installation-company-in-{florida,georgia,south-carolina}.html
contact.html
determine-your-savings.html    Free estimate form
privacy-policy.html
assets/css/ds.css               Design system: tokens + every component
assets/js/main.js              Menu, forms, FAQ search, blog filter, calculator
assets/img/                    Logo, badges and photos from the original site
```

No build step: deploy the repo root as a static site (Vercel framework preset: **Other**).

`vercel.json` serves clean URLs with a trailing slash (`/about-us/`), matching the old WordPress URLs so existing Google rankings and backlinks keep working when the domain is pointed here. `sitemap.xml`, `robots.txt`, a custom `404.html`, canonical tags and LocalBusiness / FAQ structured data are included.

## Before launch

- **Forms** validate and show a thank-you state but don't send anywhere yet. Add `data-endpoint="https://…"` to each `<form data-form>` (e.g. Formspree, a CRM webhook) and `main.js` will POST the form data there.
- **Blog** cards link to the full posts on the current WordPress site; migrate the posts before switching DNS.

## Design system

All pages share `assets/css/ds.css`. Edit the tokens at the top (`--accent`, `--ink`, `--surface`, fonts, radius, spacing) and every page updates. Reusable patterns: page header, section header, feature cards, bento tiles, stats, numbered list, split media, lead form, FAQ, blog cards, CTA panel, footer.
