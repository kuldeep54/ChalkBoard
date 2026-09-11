# Assignment Feature Test Checklist

One-by-one test flow for the 24-Hour E-Commerce assignment, mapped to the mandatory modules. All testing happens on the phone via Expo Go.

## Runtime Status

| Component | Status |
|---|---|
| Metro (app server) | `:8081` |
| Backend API | `:5000` (connected to MongoDB) |
| Database | 20 products + 5 reviews seeded |
| Phone | Expo Go connected via USB |

Start everything:
```bash
# Terminal 1: Backend (MongoDB must be running first)
cd backend
npm run dev

# Terminal 2: Expo dev server
npx expo start
```

## 1. Splash → Register

1. Watch splash animation (~1.5s indigo) → lands on **Login**
2. Tap **Sign Up** → fill `Test User` / `test@example.com` / `password123` → **Register**
3. Verify: success toast + redirect to Home + tab bar visible

## 2. Forgot Password

1. Login screen → **Forgot Password?** → enter email → verify toast
   (Reset link is logged in `backend/server.log`, valid 10 min)

## 3. Home Screen

1. Verify: hero banner, search bar, category row
2. Sliders (Featured / Trending / Special Offers) scroll horizontally; sale items show `-%` badges
3. **See all** on a slider → Catalog opens with that tag
4. Tap a category tile → Catalog opens filtered
5. Type + submit search → Catalog opens with filter applied
6. Pull down → refresh spinner + updated data

## 4. Catalog

1. Sort toggle: Featured / Newest / Price low-high / high-low / Top Rated → order changes
2. Grid ↔ list view toggle
3. Scroll to bottom → infinite scroll loads more; "no more" stops
4. Type in search box → results refresh after ~500ms debounce
5. Search `xyznonexistent` → empty state

## 5. Product Detail

1. Swipe image carousel → dots update; rating stars; category badge; name, price, stock line
2. Sale item: sale price + strikethrough original + "Save $X"
3. `+`/`-` quantity (capped at stock; `+` disabled at stock)
4. **Add to Cart** → toast → tap to go to Cart; badge increments

## 6. Related Products

1. Scroll to "You might also like" → horizontal same-category slider
2. Tap one → opens that product (detail reloads, no stack buildup)

## 7. Cart

1. Thumbnails, names, prices, quantity steppers, running total render
2. `+` capped at stock; at qty 1, `-` removes item (info toast)
3. Trash icon removes item; badge updates
4. Empty cart → empty state; checkout bar hidden

## 8. Checkout

1. **Proceed to Checkout** → fill shipping address form (Street / City / State / Zip / Country)
2. Verify: order summary lists items and total
3. **Place Order** → success toast, cart cleared, navigate to Order Confirmation
4. From confirmation → **View Orders** → order shows with placed status, items, total

## 9. Orders / Profile

1. Orders tab: date, status badge (placed = blue), line items, total, newest-first
2. Profile: avatar initial, name, email, stat cards (Orders / Total Spent / Cart Items)
3. **My Orders** → Orders tab; **My Cart** → Cart tab
4. **Help & Support** → info toast with support email
5. **Logout** → confirm → toast + redirect to Login

## 10. Login (existing user)

1. `test@example.com` / `password123` → **Login**
2. Verify: redirected to Home; cart persisted from API (badge restored)

## 11. Edge Cases

1. Out-of-stock product (search "sold out") → card overlay; Add-to-Cart bar hidden
2. Cart quantity `+` caps at stock; messages/totals consistent
3. Empty search / no results → catalog empty state
4. Double-register same email → server error toast
5. Kill backend → pull-to-refresh Home → error toast, app doesn't crash
6. Reset token expiry: valid 10 min (mock — check server log for the link)