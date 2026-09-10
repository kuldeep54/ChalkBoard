# ChalkBoard E-Commerce Mobile App

A full-stack e-commerce mobile application built with React Native (Expo), Node.js/Express, and MongoDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 57) with Expo Router (TypeScript) |
| Styling | NativeWind v4 (TailwindCSS), react-native-toast-message |
| UI Icons | @expo/vector-icons (Ionicons) |
| Backend | Node.js + Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) |
| State | React Context + useReducer pattern |

## Features (MVP)

- **Splash**: Branded launch screen, auto-redirects to Home or Login
- **Auth**: Register / Login / Forgot Password with JWT + mock reset link
- **Home**: Hero banner, search bar, category tiles, Featured / Trending / Special Offers sliders with pull-to-refresh
- **Catalog**: Search (debounced), category chips, 5 sort options, grid/list toggle, infinite scroll pagination, dynamic title
- **Product Detail**: Paging image carousel with dots, ratings, sale/discount badges, stock line, quantity selector, related-products slider, add-to-cart with toast → cart
- **Cart**: Add/remove/update quantity (capped at stock), running total, thumbnail images, cart badge
- **Checkout**: Shipping address form + order summary, mock order placement
- **Order History**: Past orders with status badges and line items
- **Profile**: Stats cards (orders/total spent/cart), recent-orders preview, menu with help/logout
- **Toasts**: Typed helpers for success/error/info across all actions

## Project Structure

```
ChalkBoard/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Auth, Product, Cart, Order logic
│   │   ├── middleware/      # Auth guard, error handler
│   │   ├── models/         # User, Product, Cart, Order schemas
│   │   ├── routes/         # API route definitions
│   │   ├── seed.js         # 20-product seeding script (images verified)
│   │   └── server.js       # Express entry point
│   ├── .env.example
│   └── package.json
├── src/                    # Mobile app (Expo Router, TypeScript)
│   ├── app/
│   │   ├── (auth)/         # login, register, forgot-password
│   │   ├── (tabs)/         # home, cart, orders, profile
│   │   ├── product/[id]    # Product detail screen
│   │   ├── catalog.tsx     # Searchable/sortable product listing
│   │   ├── checkout.tsx    # Checkout screen
│   │   ├── index.tsx       # Splash screen
│   │   └── _layout.tsx     # Root layout (providers + toast + global.css)
│   ├── components/         # product-card, rating-stars
│   ├── context/            # AuthContext, CartContext (typed, useReducer)
│   ├── services/           # api.ts (typed axios clients)
│   ├── utils/              # helpers.ts (formatting, toasts, errors)
│   ├── global.css          # Tailwind input for NativeWind
│   └── nativewind-env.d.ts
├── tailwind.config.js      # ChalkBoard palette + nativewind preset
├── babel.config.js         # babel-preset-expo + nativewind/babel
└── metro.config.js         # withNativeWind
```

## Setup Instructions

### Prerequisites
- Node.js 18+, MongoDB (local or Atlas)
- Android SDK / emulator (see `android/local.properties`)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # Edit with your MongoDB URI and JWT secret
npm run seed            # Seed 20 products into database
npm run dev             # Start backend on port 5000
```

### Mobile Setup

```bash
npm install
npx expo start          # Start Expo dev server (Metro on 8081)
npx expo run:android    # Build + install on emulator (native, recommended)
```

Verification commands:

```bash
npx tsc --noEmit    # TypeScript check (strict)
npx expo lint       # ESLint (expo config)
```

### API Base URL
The mobile app connects to `http://10.0.2.2:5000/api` (Android emulator) by default in `src/services/api.ts`. For a physical device, change it to your machine's LAN IP.

## API Endpoints

```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/forgot-password - Request reset link (mock: returns reset token link)
GET    /api/auth/me              - Get current user (auth)
GET    /api/products             - List products (?search ?category ?featured ?trending ?discount ?minPrice ?maxPrice ?sort ?page ?limit)
GET    /api/products/:id         - Get single product
GET    /api/products/:id/related - Get related products (same category, auth not required)
GET    /api/products/categories  - Get all categories
GET    /api/cart                 - Get user cart (auth)
POST   /api/cart/add             - Add item to cart (auth)
PUT    /api/cart/update          - Update cart item quantity (auth)
DELETE /api/cart/remove/:id      - Remove item from cart (auth)
POST   /api/orders               - Create order from cart (auth)
GET    /api/orders               - Get user order history (auth)
GET    /api/orders/:id           - Get single order (auth)
```

## Out of Scope (deliberate cuts for 24h MVP)

- Real payment gateway integration (mock checkout only)
- Admin panel / seller dashboard
- Reviews & ratings
- Push notifications
- Wishlist functionality
- Password reset email delivery (mock link only)

## Design Decisions

- **Expo over bare React Native**: No native build setup needed, instant preview
- **Expo Router over React Navigation**: File-based routing reduces boilerplate
- **NativeWind v4 (stable) over v5 preview**: SDK 57 bundles `@expo/log-box` CSS that crashes the react-native-css Metro transformer required by NativeWind v5; v4 uses a Babel transform and is stable
- **MongoDB over MySQL**: Schema-less fits JSON-native product/cart documents, no migrations
- **JWT with AsyncStorage**: Stateless auth with secure token storage on device
- **React Context over Redux**: Sufficient for auth and cart state, less boilerplate
- **TypeScript core modules**: Typed contexts/api/helpers eliminate strict-mode `never` cascades and give safer refactors