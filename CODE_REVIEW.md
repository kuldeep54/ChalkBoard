# Code Review — ChalkBoard

Reviewed commit: `6a5f991` (TypeScript + NativeWind v4 migration, backend checkout API, sale-price consistency, e2e smoke tests and docs)
Reviewer: gstack `/review` methodology (manual execution)
Branch: `master` (no `origin` remote configured — repo-state review)

```
Scope Check: CLEAN (single migration commit, consistent for the stated intent)
Intent: Migrate JS → TS, NativeWind v4, add checkout API
Delivered: TS migration + new checkout/order-confirmation screens + cart API
```

---

## Critical findings

### [P1] (confidence: 9/10) `backend/src/controllers/orderController.js:19-26,57-61` — Non-atomic stock decrement (race condition + no rollback)

Stock is checked, then independently `$inc`-decremented per item. Two parallel checkouts can both pass the check and oversell stock into negatives. Each `findByIdAndUpdate` runs in a separate write with no transaction — a mid-loop failure leaves the order created but stock partially decremented.

**Fix:** `Product.updateOne({ _id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })` and verify `modifiedCount === 1`, or wrap order + stock updates in a Mongo session transaction.

### [P1] (confidence: 8/10) `backend/src/controllers/cartController.js:22,67,82` — `quantity` never coerced to `Number`

`req.body.quantity` is trusted as-is. `stock < quantity` in JS coerces strings: sending `quantity: "999999"` passes the stock check, and `"5" < 1` is `false`, so the `>= 1` guard in `updateCartItem` is bypassed. `existingItem.quantity += quantity` with `"1"` + `1` also string-concatenates to `"11"` before Mongoose casts.

**Fix:** `const quantity = Number(req.body.quantity);` then validate `Number.isInteger(quantity) && quantity >= 1`.

### [P2] (confidence: 8/10) `backend/src/controllers/authController.js:15-19,93-98` — User enumeration

Forgot-password returns `404 "No account found with that email"`, register returns `400 "User already exists"`. Attackers can harvest valid emails.

**Fix:** return a generic `"If that email exists, a reset link was sent"` with 200/202 for forgot-password.

### [P2] (confidence: 7/10) `backend/src/server.js` — No auth rate limiting

No `express-rate-limit` on `/auth/login` or `/forgot-password` — brute-force/email-bombing possible. One middleware covers both.

---

## Medium findings

### [P2] (confidence: 8/10) `backend/src/controllers/productController.js:35-37` — Unbounded regex on user input

`search` is passed straight into `$regex`; a crafted pattern (e.g. `(a+)+$`) risks ReDoS, and `limit`/`page` are `parseInt`'d with no cap.

**Fix:** use `escapeRegex(search)` and clamp `limit` to 1–100.

### [P2] (confidence: 7/10) `src/services/api.ts:4` — Hardcoded `http://10.0.2.2:5000`

Android emulator only; breaks on real devices and iOS simulator.

**Fix:** move to an `EXPO_PUBLIC_API_URL` env var and add a request timeout.

### [P2] (confidence: 8/10) `src/context/AuthContext.tsx:63-67` — JWT in plaintext AsyncStorage

Use `expo-secure-store` for the token. Also, on app load the stored token is trusted without a `/auth/me` revalidation.

### [P2] (confidence: 6/10) `backend/src/server.js:13` — `cors()` allows all origins, no `helmet()`

Fine for dev, must tighten before any real deployment.

### [P2] (confidence: 6/10) `backend/src/controllers/orderController.js` — `shippingAddress` never validated server-side

Empty address can be submitted via API. Client-only validation; schema is the only guard.

---

## Enum / type consistency

- `Order.status` model enum (`backend/src/models/Order.js:30`) includes `"pending"` but the `Order` TS type in `src/services/api.ts:73` omits it. Runtime OK (`orders.tsx` has a default gray case), but the type is unsound.
- `Product.category` backend enum (8 values) vs client `string` — fine, but unknown categories render without labels.
- Cart/order lists render `key={idx}` (`src/app/checkout.tsx:116`, `src/app/(tabs)/orders.tsx:87`) — reorder-sensitive; prefer product ids.

---

## What's good

- Server-authoritative pricing — order totals come from DB prices, not the client
- bcrypt password hashing + JWT flow, `select: false` on password
- express-validator on register/login
- `findOne({ _id, user })` ownership scoping on order reads

**Verified, NOT findings:** the `await cart.save()` indentation in `cartController.js:54` is correctly outside the if/else — no double-save bug.