# ChalkBoard — APK Build & Cloud Deployment Guide
*(single file — everything you need, updated as we go)*

> **Last updated:** 2026-09-11 — Atlas done ✅, GitHub done ✅, Render blueprint pushed ✅

---

## 0. TL;DR — what's left

| # | Step | Who | Status |
|---|---|---|---|
| 1 | MongoDB Atlas cluster | You + me | ✅ DONE |
| 2 | Products seeded into Atlas | me | ✅ DONE |
| 3 | GitHub repo `kuldeep54/ChalkBoard` | me | ✅ DONE |
| 4 | Render web service (free) | You (needs login) | 🔲 NEXT |
| 5 | Point app `.env` at Render URL | me | 🔲 after 4 |
| 6 | Build the APK with EAS | me (needs your login) | 🔲 after 4 |

---

## 1. Prices — no surprises

| Thing | Cost | Notes |
|---|---|---|
| MongoDB Atlas M0 | **Free** | 512 MB |
| Render web service | **Free** | Sleeps after ~15 min idle; first request after sleep takes 15–60 s |
| EAS Build (preview APK) | **Free** | Needs Expo account, you wait in queue, no credit card |
| Gmail app password | **Free** | Already working |

---

## 2. ✅ DONE — MongoDB Atlas

- Cluster: `Cluster0` (M0 free, region ap-south-1)
- Database user: `malviyakuldeep54_db_user` / `DB_PASS_REDACTED`
- Connection string (with `/chalkboard` DB name — do NOT remove it):

```
MONGODB_URI_REDACTED
```

- **IP allow-list:** `203.115.73.5` currently added. If your IP changes and you can't connect, add the new IP in Atlas → Network Access. (For max convenience: set "Allow access from anywhere" `0.0.0.0/0`.)
- If you forget the DB password: Atlas → Database Access → Edit user → Edit Password.

---

## 3. ✅ DONE — Products seeded

20 products + 5 reviews are already in Atlas (run from your PC against the cloud DB).

---

## 4. ✅ DONE — GitHub repo

- Repo: **https://github.com/kuldeep54/ChalkBoard** (private)
- All code pushed: guest mode, OTP verify/reset, delivery address picker, address API, `eas.json`, `render.yaml`
- `backend/.env` (with secrets) and root `.env` are NOT committed.

---

## 5. 🔲 NEXT — Deploy backend to Render (free, ~10 min)

### 5a. Blueprint is already in the repo
`D:\ChalkBoard\render.yaml` auto-configures Render:
- Runtime: Node, Root dir: `backend`
- Build: `npm install` | Start: `npm start` | Health: `/api/health`
- Env vars pre-filled: SMTP (Gmail working), `AUTH_BASE_URL=chalkboard://`, `JWT_EXPIRE`, `ACCESS_TOKEN_EXPIRE`, `MAIL_FROM`

### 5b. Steps (needs YOUR Render login)
1. Go to **https://render.com** → Sign up (easiest: "Sign up with GitHub").
2. **New** → **Blueprint** → connect the `ChalkBoard` repo.
3. Render reads `render.yaml` → create the service named `chalkboard-api`.
4. Three secrets are marked `sync: false` — fill them in the service's **Environment** tab before deploy:
   - `MONGODB_URI` = `MONGODB_URI_REDACTED`
   - `JWT_SECRET` = any long random string (30+ chars)
   - `SMTP_PASS` = `GMAIL_APP_PASS_REDACTED`
5. Click **Apply / Deploy** → wait for **Live** (first build ~5 min).
6. Verify: open `https://chalkboard-api.onrender.com/api/health`
   → expect `{"success":true,"message":"ChalkBoard API is running"}`

> If you couldn't use the Blueprint and had to click **New → Web Service** manually instead:
> Root Directory = `backend`, Build = `npm install`, Start = `npm start`,
> then set the SAME env vars above.

### 5c. Mark done
- [ ] Service Live
- [ ] `/api/health` returns "running"

**Then tell me the URL** (e.g. `https://chalkboard-api.onrender.com`) and I'll do the rest.

---

## 6. 🔲 AFTER Render is live — point app at cloud backend

`D:\ChalkBoard\.env`:
```
EXPO_PUBLIC_API_URL=https://chalkboard-api.onrender.com/api
```
> Keep a copy of the LAN URL (`http://192.168.1.11:5000/api`) for Expo Go dev when the PC backend is running.

---

## 7. ✅ DONE — App config for production build

- `app.json` android package changed: `com.kuldeep.chalkboard`
  (important: it CANNOT change again after Play Store publish, fine for a direct APK install)
- Icon / splash / adaptive icons: present
- `eas.json` created with a `preview` profile → builds a plain `.apk`

---

## 8. 🔲 Build the APK (free)

From `D:\ChalkBoard`:

```powershell
npm install -g eas-cli
eas login            # free Expo account; needs your login
eas build -p android --profile preview
```

- Prints an EAS dashboard link with progress. APK ready in ~15–30 min (incl. queue).
- Hit **Download .apk** → install on your phone (`adb install file.apk` or share the link), allow "Install unknown apps".

---

## 9. Verify on the real phone

1. Open **ChalkBoard** (the app, not Expo Go).
2. Register with your real email → **real 6-digit verification email**.
3. Enter code → sign in → browse → add to cart → checkout → **place order**.
4. Order appears in **Orders** and is stored in **Atlas**.

### Quirks to expect
- **First load after idle**: Render free tier sleeps after ~15 min; the first request wakes it (15–60 s). Fast after that.
- **Emails**: sent from your own Gmail account (`KULDEEP_EMAIL_REDACTED`).
- **Location / address**: works anywhere — no reconfiguration needed.

---

## Final checklist before the APK build

- [ ] Render service **Live** + `/api/health` OK
- [ ] `.env` has `EXPO_PUBLIC_API_URL=https://chalkboard-api.onrender.com/api`
- [ ] `app.json` package = `com.kuldeep.chalkboard`
- [ ] `eas.json` present (done)
- [ ] `render.yaml` present (done)
- [ ] `eas login` done
- [ ] `eas build -p android --profile preview` run

---

## Cheat sheet — key commands

```powershell
# Restart backend locally
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*src/server.js*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-Process cmd.exe "/c node src/server.js >> server.log 2>> server.err.log" -WorkingDirectory D:\ChalkBoard\backend -WindowStyle Hidden

# Seed products
cd backend; node src/seed.js

# Typecheck app
npx tsc --noEmit

# Open app on phone (Expo Go, LAN)
adb -s adb-4afabc86-wON8qz._adb-tls-connect._tcp shell am start -a android.intent.action.VIEW -d "exp://192.168.1.11:8081"
```