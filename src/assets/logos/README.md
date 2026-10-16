# Company logos (Brands rail and résumé timeline)

One file per company, named by its `id` in `src/content/brands.json` (Experiences reuse the same ids); `CompanyLogo.astro` picks them up by that name. To change a logo, replace the file (any of png/jpg/webp/svg, square).

| file | source |
|---|---|
| `wesend.png` | supplied by the site owner |
| `mrbilit.svg` | [Persian Labs icons](https://icons.persian-labs.ir/) (`@persianlabs/icons` 1.0.4, MIT) |
| `snapp.png` | Snapp's square «!» mark from its passenger app CDN (`passenger-pwa-cdn.snapp.ir/logos/square-minimal-512.png`) |
| `didar-crm.png` | didar.me site icon (not in Persian Labs), padded |
| `entekhab.png` | Entekhab's «انتخاب» mark, cropped from the company's profile logo on iranestekhdam.ir (not in Persian Labs; no official site reachable). Low-res (122px) — replace with an official file when available. |

Logos are the trademarks of their owners.
