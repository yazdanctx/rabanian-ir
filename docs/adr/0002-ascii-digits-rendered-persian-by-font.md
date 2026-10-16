# Store ASCII digits; let the FaNum font draw them Persian

All Farsi text on the site — prices, stats, years — is stored and rendered with ASCII digits (`15`, `2000`). The IRANYekanXFaNum face maps `0`–`9` to Persian numeral outlines, so they read as Persian on screen while staying ordinary ASCII for `Intl`, sorting, form values and copy-paste into calculators. We chose this over converting to U+06F0–U+06F9 in content or in a helper because a conversion layer is a permanent source of bugs (mixed digits, double conversion, broken `Intl.NumberFormat`) and the font already solves it. Same approach as the wesend repos.

## Consequences

- Never add a digit-conversion utility; if a digit looks Latin, the wrong font family is applied, not the wrong data.
- Any future English page must use the plain `IRANYekanX` family (Latin digit outlines), already in `src/assets/fonts/en/`, switched on `lang`.
- Copied text yields ASCII digits. This is accepted.
