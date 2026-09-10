# Assignment Compliance Report

Status of the ChalkBoard project against the 24-Hour E-Commerce Mobile App assignment.

Legend: ✅ Fully met · ⚠️ Partial / minor gap · ❌ Not implemented

---

## Tech Stack

| Requirement | Status | Notes |
|---|---|---|
| React Native | ✅ | Expo SDK 57 (Expo Router) |
| Expo OR React Native CLI | ✅ | Expo |
| React Navigation | ✅ | via Expo Router (file-based Stack + Tabs) |
| Axios | ✅ | `src/services/api.ts` |
| AsyncStorage / SecureStore | ✅ | Auth + cart persistence (expo-secure-store native, AsyncStorage fallback) |
| NativeWind / Styled Components | ✅ | NativeWind v4 (Tailwind) |
| Backend: Node.js + Express + MongoDB | ✅ | `backend/` with Mongoose |
| API hardening | ✅ | helmet, express-rate-limit, express-validator, JWT auth guard |

## Mandatory Screens

| Screen | Status | Notes |
|---|---|---|
| Splash (logo, animation, brand intro) | ✅ | `src/app/index.tsx`, `Animated` logo + subtitle, auto-redirect |
| Login | ✅ | JWT, validation, error toasts |
| Signup | ✅ | field validation, duplicate-email handling |
| Forgot Password | ✅ | email → reset-link flow |
| Home (hero, featured, categories, trending, offers) | ✅ | horizontal sliders, sale badges |
| Product Listing (grid, search, filters, category sort) | ✅ | `catalog.tsx` — debounced search, category + sort chips |
| Product Details (carousel, desc, price, ratings, add-to-cart, related) | ⚠️ | carousel implemented; seed products have 1 image so it pages once |
| Cart (update qty, remove, total, checkout) | ✅ | +/- steppers (stock-clamped), remove, sale-price total |
| Checkout (shipping form, address, payment summary, place order) | ✅ | `checkout.tsx` → `order-confirmation.tsx` |
| Profile (user details, order history, logout) | ✅ | stats cards, order history link, logout |

## Backend APIs

| Requirement | Status | Notes |
|---|---|---|
| POST /register | ✅ | `POST /api/auth/register` |
| POST /login | ✅ | `POST /api/auth/login` |
| GET /products | ✅ | `GET /api/products` (+ category/search/pagination/sort) |
| GET /products/:id | ✅ | `GET /api/products/:id` (+ `/related`, `/categories`) |
| POST /cart | ⚠️ | implemented as `POST /api/cart/add` (spec named it `/cart`); also has get/update/remove |
| GET /cart | ✅ | `GET /api/cart` |
| POST /order | ⚠️ | implemented as `POST /api/orders` (spec named it `/order`); also list/detail |

## Required Frontend Features

| Feature | Status | Notes |
|---|---|---|
| Bottom Tab Navigation | ✅ | Home / Catalog / Cart / Orders / Profile |
| Stack Navigation | ✅ | auth stack, root stack, checkout/order-confirmation, product detail |
| Authentication persistence | ✅ | AsyncStorage token + user, rehydrated on boot |
| Loading states | ✅ | skeleton loaders (home/catalog/detail) + ActivityIndicator elsewhere |
| Error handling | ✅ | typed error messages, axios interceptors, toasts |
| Responsive layouts | ✅ | NativeWind responsive classes, scroll views |
| API integration | ✅ | axios client, interceptor-injected JWT |
| Toast messages | ✅ | success/error/info toasts (CartContext + screens) |

## Animations (optional bonus)

| Feature | Status |
|---|---|
| Splash screen animation | ✅ |
| Screen transitions | ✅ (native) |
| Button/tap effects | ⚠️ part of NativeWind press states |
| Skeleton loaders | ✅ `src/components/skeletons.tsx` (home, catalog, product detail) |
| Product hover/tap effects | ⚠️ partial |

## Recommended Folder Structure

| Requirement | Status | Notes |
|---|---|---|
| /src + components/services/context/hooks/utils/assets | ✅ | present under `src/` |
| /src/screens + /src/navigation | ⚠️ | replaced by Expo Router `src/app/` file-based routing (equivalent) |
| Backend controllers/routes/models/middleware/config | ✅ | under `backend/src/` |

## Bonus Features (optional)

| Feature | Status |
|---|---|
| Wishlist | ❌ |
| Dark Mode | ❌ (light theme only, theme tokens prepared) |
| Payment Gateway | ❌ (payment mock: "Cash on Delivery") |
| Push Notifications | ❌ |
| Admin Dashboard | ❌ |
| Product Reviews | ✅ Review model + API + write/list UI, rating auto-recalc |

---

## Gaps Summary

The project meets **all mandatory requirements**. It does **not** follow the assignment in the following specific ways:

1. **API route naming differs from the spec** — cart and order mutations are under `/api/cart/add` and `/api/orders` rather than the spec's literal `POST /cart` and `POST /order`. Functionally equivalent and more RESTful, but not exact.
2. **Folder structure** — uses Expo Router (`src/app/`) instead of the literal `src/screens` + `src/navigation` layout; all other folders match.
3. **Product image carousel is dormant** — code exists but seeded products carry a single image, so no swiping is visible.
4. **Bonus features are mostly unimplemented** — of the six listed, product reviews ✅ and skeleton loaders ✅ are done; wishlist, dark mode, payment gateway, and push notifications remain optional.
6. **No automated test suite** — verification done via typecheck, lint, and manual E2E smoke tests on the Android emulator (see TESTING.md).