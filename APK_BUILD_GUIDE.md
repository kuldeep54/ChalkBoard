# ChalkBoard — APK Build & Cloud Deployment Guide

Everything you need to build an installable `.apk` for your real phone and make it
work from anywhere (not just your home WiFi).

---

## Pricing (no surprises)

| Thing | Cost | Notes |
|---|---|---|
| MongoDB Atlas (M0 cluster) | **Free** | 512 MB storage, fine for a school project |
| Render web service | **Free** | Sleeps after ~15 min idle; wakes on request (slightly slow first load) |
| EAS Build (preview APK) | **Free** | Needs free Expo account; you wait in a queue, no credit card |
| Gmail app password | **Free** | Already configured and working |

---

## Phase 1 — Cloud database (MongoDB Atlas, ~10 min)

1. Go to **https://www.mongodb.com/atlas** → Sign up / log in.
2. Build a Cluster → choose the **FREE M0** tier. Pick a region near you
   (e.g. **Mumbai / ap-south-1**).
3. **Database Access** → Add New Database User:
   - Username: e.g. `chalkboard`
   - Password: make a strong one, **store it now**
4. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`) → Confirm.
   (OK for a school project. You can tighten this later.)
5. **Databases** → your cluster → **Connect** → **Drivers**:
   - Copy the connection string, looks like:
     ```
     mongodb+srv://chalkboard:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with the real password.
   - **This is your `MONGODB_URI`.**

---

## Phase 2 — Deploy backend to Render (free, ~15 min)

### 2a. GitHub
1. Make a repo (e.g. `chalkboard`) and push this project.
   - `.gitignore` already excludes `.env` files, so secrets stay off GitHub.

### 2b. Render web service
1. Go to **https://render.com** → Sign up (GitHub login is easiest).
2. **New** → **Web Service** → connect your GitHub repo.
3. Settings:
   | Setting | Value |
   |---|---|
   | Root Directory | `backend` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Free |
4. **Environment variables** — add ALL of these:
   | Key | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string (from Phase 1) |
   | `JWT_SECRET` | a long random string (e.g. 30+ random chars) |
   | `ACCESS_TOKEN_EXPIRE` | `15m` |
   | `JWT_EXPIRE` | `7d` |
   | `AUTH_BASE_URL` | `chalkboard://` |
   | `MAIL_FROM` | `ChalkBoard <no-reply@chalkboard.app>` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_SECURE` | `false` |
   | `SMTP_USER` | `KULDEEP_EMAIL_REDACTED` |
   | `SMTP_PASS` | `GMAIL_APP_PASS_REDACTED` |
   | `CORS_ORIGIN` | (optional) add your backend URL |
5. **Deploy** → wait until status = **Live** (first deploy takes a few minutes).
6. Your app URL is `https://<app-name>.onrender.com`. Verify:
   ```
   https://<app-name>.onrender.com/api/health
   ```
   → Should return `{"success":true,"message":"ChalkBoard API is running"}`

### 2c. Seed products into Atlas
From your PC (against the cloud DB):
```
cd backend
set MONGODB_URI=mongodb+srv://chalkboard:<password>@cluster0.xxxxx.mongodb.net/chalkboard
node src/seed.js
```
> Tip: temporarily edit `backend/.env`'s `MONGODB_URI` to the Atlas string while seeding, then switch it back for local dev.

---

## Phase 3 — Point the app at the cloud backend

Edit `D:\ChalkBoard\.env`:
```
EXPO_PUBLIC_API_URL=https://<app-name>.onrender.com/api
```
(Replace `<app-name>.onrender.com` with your real Render URL.)

---

## Phase 4 — Production app config (DO THIS BEFORE THE FIRST BUILD)

In `D:\ChalkBoard\app.json`:
- Change the android package to something unique:
  ```json
  "android": {
    "package": "com.kuldeep.chalkboard"
  }
  ```
- Icon, splash, and adaptive icons are already set (assets exist).
- Everything else is ready (`expo-router`, `expo-secure-store`,
  `expo-build-properties` with cleartext traffic enabled).

---

## Phase 5 — Build the APK (free)

From `D:\ChalkBoard`:

```powershell
# 1. Install the EAS CLI (once)
npm install -g eas-cli

# 2. Log in with a free Expo account
eas login

# 3. Make sure eas.json exists (preview profile → plain .apk)
eas build:configure

# 4. Start the build
eas build -p android --profile preview
```

- The command prints a **link to the EAS dashboard** with build progress.
- APK builds take roughly **15–30 min** including queue time.
- When done, the dashboard shows a **Download .apk** button.
- Send that file to your phone (or `adb install <file>.apk` over USB) and
  allow **Install unknown apps**.

---

## Phase 6 — Verify on your real phone

1. Open **ChalkBoard** (real app, not Expo Go).
2. Register with your real email → you get a **real verification email** with a 6-digit code.
3. Enter the code → sign in.
4. Browse → search → add to cart → checkout → place an order.
5. Order should be visible in **Orders** and stored in **Atlas**.

### Known quirks after install
- **First load after the app sleeps**: Render's free tier puts your backend to
  sleep after ~15 min idle. The first request may take **15–60 s** to wake up.
  Subsequent requests are fast.
- **Emails**: verification/reset emails are sent from your own Gmail account.
- **Change IP / location**: nothing to reconfigure — the app talks to the cloud URL.

---

## Local dev is unaffected

Everything above doesn't break your daily dev loop:
- Keep `D:\ChalkBoard\.env` = `http://192.168.1.11:5000/api` when testing with
  Expo Go on your LAN, swap to the Render URL only when building the APK.
- Keep `backend/.env` with `mongodb://localhost:27017/chalkboard` for local API tests.

---

## Checklist before the APK build

- [ ] Atlas cluster created + connection string saved
- [ ] Render service deployed + `/api/health` returns "running"
- [ ] Products seeded into Atlas (`node src/seed.js`)
- [ ] `.env` has the Render URL
- [ ] `app.json` package changed to `com.kuldeep.chalkboard`
- [ ] `eas.json` has a `preview` profile (buildType: `apk`)
- [ ] `eas login` done