# ChalkBoard E-Commerce Mobile App

A full-stack e-commerce mobile application built with React Native (Expo), Node.js/Express, and MongoDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 57) with Expo Router |
| Backend | Node.js + Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) |
| State | React Context + useReducer pattern |

## Features (MVP)

- **Auth**: Register/Login with JWT authentication
- **Product Listing**: Grid view with search and category filtering
- **Product Detail**: Full product info with quantity selector and add-to-cart
- **Cart**: Add/remove/update quantity, view total
- **Checkout**: Place order with shipping address
- **Order History**: View past orders with status badges
- **Profile**: User info and logout

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
│   │   ├── seed.js         # Product seeding script
│   │   └── server.js       # Express entry point
│   ├── .env.example
│   └── package.json
├── src/                    # Mobile app (Expo Router)
│   ├── app/
│   │   ├── (auth)/         # Login, Register screens
│   │   ├── (tabs)/         # Home, Cart, Orders, Profile tabs
│   │   ├── product/        # Product detail screen
│   │   ├── checkout.tsx    # Checkout screen
│   │   ├── order-confirmation.tsx
│   │   └── _layout.tsx     # Root layout
│   ├── components/         # Shared components
│   ├── context/            # AuthContext, CartContext (useReducer)
│   ├── services/           # API service (axios)
│   └── hooks/              # Custom hooks (theme, color scheme)
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (or Android/iOS simulator)

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
cd ..                   # Back to root
npm install
npx expo start          # Start Expo dev server
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

### API Base URL
The mobile app connects to `http://10.0.2.2:5000/api` (Android emulator) by default. For physical device, update the URL in `src/services/api.js` to your machine's local IP.

## API Endpoints

```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/me           - Get current user (auth)
GET    /api/products          - List products (supports ?search, ?category)
GET    /api/products/:id      - Get single product
GET    /api/products/categories - Get all categories
GET    /api/cart              - Get user cart (auth)
POST   /api/cart/add          - Add item to cart (auth)
PUT    /api/cart/update       - Update cart item quantity (auth, productId in body)
DELETE /api/cart/remove/:id   - Remove item from cart (auth)
POST   /api/orders            - Create order from cart (auth)
GET    /api/orders            - Get user order history (auth)
GET    /api/orders/:id        - Get single order (auth)
```

## Out of Scope (deliberate cuts for 24h MVP)

- Real payment gateway integration (mock checkout only)
- Admin panel / seller dashboard
- Reviews & ratings
- Push notifications
- Wishlist functionality
- Advanced search/filter combos

## Design Decisions

- **Expo over bare React Native**: No native build setup needed, instant preview via Expo Go
- **Expo Router over React Navigation**: File-based routing reduces boilerplate, already configured
- **MongoDB over MySQL**: Schema-less fits JSON-native product/cart documents, no migrations needed
- **JWT with AsyncStorage**: Stateless auth with secure token storage on device
- **React Context over Redux**: Sufficient for auth and cart state, less boilerplate
