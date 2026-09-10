# ChalkBoard - Testing Instructions

## Prerequisites

Ensure both servers are running and the app is installed:

```bash
# Terminal 1: Start backend (port 5000) — MongoDB must be running first
cd backend
npm run dev

# Terminal 2: Start Expo dev server (port 8081)
npx expo start

# Install the app on the emulator (native build, uses dev client)
npx expo run:android
```

Sanity checks:

- Backend: `Invoke-RestMethod http://localhost:5000/api/health`
- Android emulator → host: run `adb reverse tcp:8081 tcp:8081`
- TypeScript: `npx tsc --noEmit` (must pass clean)
- Lint: `npx expo lint` (must pass clean)

---

## Step 1: Splash → Register

1. Launch the app. **Verify:** branded splash screen (indigo) for ~1.5s, then redirects to **Login**
2. Tap **"Sign Up"** at the bottom
3. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Tap **"Register"**
5. **Verify:** Redirected to **Home**; a success toast appears; the tab bar (Home/Cart/Orders/Profile) is visible

## Step 2: Forgot Password

1. On the Login screen tap **"Forgot Password?"**
2. Enter `test@example.com`, tap **"Send Reset Link"**
3. **Verify:** Info toast confirms a reset link was sent (mock; the backend logs the reset link)

## Step 3: Home (Sliders, Categories, Search)

1. **Verify:** Hero banner, search bar, and a horizontal category row render
2. **Verify:** Featured, Trending, and Special Offers sliders each show up to 10 products with images, names, prices, and `-%` badges on sale items
3. Tap **"See all"** on any slider → **Verify:** Catalog opens with matching tag/title (Featured/Trending/Special Offers)
4. Tap a category tile → **Verify:** Catalog opens filtered to that category
5. Type a search query, submit → **Verify:** Catalog opens with the search applied (products filter as you type after the debounce)
6. Pull down → **Verify:** refresh spinner and updated data

## Step 4: Catalog (Search, Sort, View toggle, Pagination)

1. Open Catalog from Home ("See all" or category tile)
2. **Test sort:** switch between Featured / Newest / Price: Low-High / Price: High-Low / Top Rated → **Verify:** order changes
3. **Test view toggle:** grid ↔ list with product cards
4. **Test pagination:** scroll to bottom → **Verify:** more products load (infinite scroll), "no more" stops
5. **Test search debounce:** type in the search box; results refresh ~500ms after you stop typing
6. **Test no-results:** search `xyznonexistent` → **Verify:** empty state

## Step 5: Product Detail

1. Open any product from Home/Catalog
2. **Verify:** image carousel with swipe + dot indicators, category badge, rating stars with value, name, price, sale savings, description, stock line
3. Tap on the image and swipe → **Verify:** dots update
4. If the product has a discount: price shows sale price + strikethrough original + "Save $X"
5. Tap **`+`/`-`** to change quantity (capped at stock; `+` disabled at stock)
6. Tap **"Add to Cart"** → **Verify:** success toast with "Tap to view cart" → tapping navigates to Cart; cart badge increments

## Step 6: Related Products

1. On a product detail (e.g., "Wireless Bluetooth Headphones"), scroll to **"You might also like"**
2. **Verify:** a horizontal slider of same-category products renders; tapping one opens that product; detail reloads (no stack buildup issues)

## Step 7: Cart

1. Open the Cart tab
2. **Verify:** thumbnails, names, prices, quantity steppers, and a running total render
3. Tap **`+`** (capped at stock) and **`-`** → **Verify:** quantity and total update; at quantity 1, `-` removes the item (with info toast)
4. Tap the trash icon → **Verify:** item removed, info toast, badge updates
5. Empty the cart → **Verify:** empty state renders; the checkout bar is hidden

## Step 8: Checkout

1. Add items to the cart, tap **"Proceed to Checkout"**
2. Fill in shipping address fields (Street / City / State / Zip / Country)
3. **Verify:** order summary lists items and total
4. Tap **"Place Order"** → **Verify:** success toast, cart cleared (badge gone), navigation to Order Confirmation
5. From confirmation: tap **"View Orders"** → **Verify:** Orders tab shows the order with placed status, line items, and total

## Step 9: Orders Tab

1. Open the Orders tab
2. **Verify:** orders render with date, status badge (placed = blue), line items (name × qty, price), and total
3. Multiple orders stack newest-first

## Step 10: Profile Tab

1. Open Profile
2. **Verify:** avatar (initial), name, email; stat cards for Orders / Total Spent / Cart Items
3. Tap **"My Orders"** → Orders tab; **"My Cart"** → Cart tab
4. Tap **"Help & Support"** → **Verify:** info toast with support email
5. Tap **"Logout"** → confirm → **Verify:** toast + redirect to Login
6. **Verify:** after logout the app redirects to Login (protected tabs redirect unauthenticated users)

## Step 11: Login with Existing User

1. Email: `test@example.com`, password: `password123` → **Login**
2. **Verify:** redirected to Home; cart items persisted from the API (badge restored)

## Step 12: Edge Cases

1. **Out-of-stock product:** open one (e.g., any `stock: 0` seed — search "sold out"); card shows overlay; Add-to-Cart bar hidden
2. **Cart item capped at stock:** quantity `+` stops at stock; messages/totals consistent
3. **Empty search / no results:** catalog empty state shown
4. **Double-register same email:** error toast shows server message
5. **Kill backend → pull-to-refresh Home:** error toast "Couldn't load home", app doesn't crash
6. **Reset token expiry:** forgot-password token is valid 10 min (mock — check server log for the link)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App shows "Could not connect to development server" | `adb reverse tcp:8081 tcp:8081`, restart Metro |
| Backend not responding | `netstat -ano | findstr :5000`; ensure MongoDB is running (see AGENTS.md for manual start) |
| Products not loading | Ensure MongoDB is up and `npm run seed` was executed |
| Bundle/transform errors | Verify Metro log; run `npx expo start --clear` |
| Type errors after refactors | `npx tsc --noEmit`; resolver note: screens in `src/app/` use `../`, subfolders use `../../` |
| Dev-client vs Expo Go | The project uses native deps (NativeWind Babel is fine in Expo Go, but a native build is the supported path) |