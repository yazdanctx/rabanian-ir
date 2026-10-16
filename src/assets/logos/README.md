# Company and university logos (Brands rail, résumé timeline, education cards)

One file per company, named by its `id` in `src/content/brands.json` (Experiences reuse the same ids), and one per university, named by the `logo` of its entries in `src/content/education.json`; `CompanyLogo.astro` picks them up by that name. To change a logo, replace the file (any of png/jpg/webp/svg, square).

| file | source |
|---|---|
| `wesend.png` | supplied by the site owner |
| `mrbilit.svg` | [Persian Labs icons](https://icons.persian-labs.ir/) (`@persianlabs/icons` 1.0.4, MIT) |
| `snapp.png` | Snapp's square «!» mark from its passenger app CDN (`passenger-pwa-cdn.snapp.ir/logos/square-minimal-512.png`) |
| `didar-crm.png` | didar.me site icon (not in Persian Labs), padded |
| `entekhab.png` | Entekhab's «انتخاب» mark, cropped from the company's profile logo on iranestekhdam.ir (not in Persian Labs; no official site reachable). Low-res (122px) — replace with an official file when available. |
| `university-of-tehran.png` | University of Tehran emblem, rasterised (256px, 8% padding) from [`University_of_Tehran_logo.svg`](https://en.wikipedia.org/wiki/File:University_of_Tehran_logo.svg) on English Wikipedia (non-free logo) |
| `iut.png` | Isfahan University of Technology seal, rasterised (256px, 8% padding) from [`Isfahan University of Technology (seal).svg`](https://commons.wikimedia.org/wiki/File:Isfahan_University_of_Technology_(seal).svg) on Wikimedia Commons (public domain) |

Logos are the trademarks of their owners.
