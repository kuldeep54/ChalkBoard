# ChalkBoard Design Log

**Date:** 2026-09-11
**Status:** Variant A is the app's main design (ported to the Expo client)

## Decision

Variant A ("Density", the Amazon-leaning design) from the gstack design process is the
main design for the ChalkBoard mobile app. It replaces the prior light/indigo theme.
The authoritative design sources live in the companion html project at
`Desktop/chalkboard/designs/{shared.css, variant-a.css}` (see that project's `DESIGN.md`).

This design was ported into the React Native + NativeWind codebase by remapping the
existing Tailwind `chalk-*` palette to Variant A tokens, so existing classes carried
over with no class churn across ~20 screens/components.

## Token Map

| Tailwind token    | Hex       | Role                                  |
|-------------------|-----------|---------------------------------------|
| `chalk.ink`       | `#0F1111` | Primary text                          |
| `chalk.slate`     | `#565959` | Secondary text                        |
| `chalk.tertiary`  | `#767676` | Muted text (original price, delivery, rating counts) |
| `chalk.mist`      | `#EAEDED` | Page background / tiles               |
| `chalk.line`      | `#D5D9D9` | Borders (card, inputs, tab bar)       |
| `chalk.navline`   | `#3A4553` | Category sub-bar divider              |
| `chalk.indigo`    | `#232F3E` | Header chrome, empty states           |
| `chalk.navy`      | `#131921` | Tab bar / darkest chrome + category strip |
| `chalk.navy2`     | `#37475A` | Hero + section banners                |
| `chalk.accent`    | `#F0C14B` | Primary CTA (bottom of gradient)      |
| `chalk.gold`      | `#F0C14B` | Active nav highlight, badges          |
| `chalk.goldtop`   | `#F7DFA5` | CTA gradient top                      |
| `chalk.golddark`  | `#E7A33E` | CTA pressed state                     |
| `chalk.goldedge`  | `#A88734` | CTA border                            |
| `chalk.star`      | `#FFA41C` | Rating stars                          |
| `chalk.price`     | `#B12704` | Product price (maroon)                |
| `chalk.orange`    | `#FF9900` | Deliver-to location pin               |
| `chalk.green`     | `#16A34A` | Success / in-stock                    |
| `chalk.red`       | `#CC0C39` | Discount/sale badges, errors          |
| `chalk.blue`      | `#2563eb` | Links                                 |

## Screen Coverage

- Tab bar + headers (navy `#131921`, gold active) — `src/app/(tabs)/_layout.tsx`
- Home hero / delivery strip / search — `src/app/(tabs)/home.tsx`
- Category sub-bar (navy `#131921`, `#3A4553` divider, white pills) — `home.tsx`
- Deliver-to pin (orange `#FF9900`) in the Home header — `(tabs)/_layout.tsx`
- Product cards (grid + list): bullet meta, FREE Delivery line, star color, gradient
  Add-to-Cart, red `-X%` badge, out-of-stock overlay — `src/components/product-card.tsx`
- Gradient gold CTAs everywhere — `src/components/gold-button.tsx` (expo-linear-gradient
  `#F7DFA5 → #F0C14B`, border `#A88734`): cards, product detail bar, cart, checkout,
  auth screens, review submit
- Catalog search/sort/empty states — `src/app/catalog.tsx`
- Product detail price, savings, delivery/COD block, gradient add-to-cart bar — `src/app/product/[id].tsx`
- Cart items + checkout CTAs — `cart.tsx`, `checkout.tsx`
- Auth screens (gradient primary buttons) — `(auth)/*`
- Reviews submit + stars — `product-reviews.tsx`, `rating-stars.tsx`
- Profile stats/icons — `profile.tsx`

## Companion Artifacts

- `Desktop/chalkboard/designs/{shared.css, variant-a.css}` remain the authoritative
  design sources; `compare.html` and variants B/C were removed once the app port was
  confirmed against the final Variant A.