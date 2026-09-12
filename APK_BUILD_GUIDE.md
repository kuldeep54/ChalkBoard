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

### 5d. If products return a 500 error through Render (Mongo buffering timeout)

Symptom:
```
Operation `products.countDocuments()` buffering timed out after 10000ms
```
(= the Render server is running but **cannot reach Atlas**.)

Step-by-step fix:
1. **MongoDB Atlas** → *Network Access* → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`) → Confirm. Render uses many different IPs, so a single IP never works.
2. **Render dashboard** → click **`chalkboard-api`** (the service) → **Environment** tab.
3. Find **`MONGODB_URI`**, expand it, and make sure it is EXACTLY (no quotes, no spaces, no `db_password` placeholder):
   ```
   MONGODB_URI_REDACTED
   ```
   If it's wrong → **Edit**, paste the above, **Save**.
4. **Manual Deploy** button → **Redeploy current commit** (or *Clear build cache & deploy*) → wait until status = **Live** (~3–5 min).
5. **Logs** tab → at the top of the latest batch you should see:
   ```
   MongoDB Connected: ac-jrtonwz-shard-...
   ```
   or an `Error: MongoNetworkError` line to tell us the real cause.
6. Retest: `https://chalkboard-api.onrender.com/api/products` → expect a JSON with products.

### 5e. Emails on Render — use Brevo HTTP API (NOT SMTP)

**Critical fact:** Render's free tier blocks **outbound SMTP connections** (any port:
587, 465, 2525). Trying either Gmail or Brevo via SMTP gives
`MAILER ERROR: Connection timeout`. **The only reliable way is Brevo's HTTP API**
(port 443), which is never blocked.

Step-by-step:
1. **https://www.brevo.com** → **Sign up** (FREE, no card) with any email.
2. Left menu **Transactional → SMTP & API**.
3. **SMTP tab → Sender Information → Edit sender** → enter
   `your-verified-sender@example.com` → confirm the 6-digit code email.
4. **Same page → SMTP Keys → Generate** → save as `SMTP_PASS` backup
   (starts `xsmtpsib-`). **NOTE:** SMTP never works on Render — ignore it.
5. **IMPORTANT — the API key is the one that matters:**
   click the **"API Keys"** tab (second tab on the SMTP & API page)
   → **Generate a new API key** → starts with **`xkeysib-`**.
6. Mailer logic (`backend/src/utils/mailer.js`): `BREVO_API_KEY` → HTTP API
   (production/Render) → else SMTP (local dev) → else console preview.
7. Render `render.yaml` env values that WORK:
   | Key | Value |
   |---|---|
   | `BREVO_API_KEY` | `xkeysib-...` (the API key!) |
   | `SMTP_HOST/SMTP_USER/SMTP_PASS` | left as Brevo (unused on Render) |
   | `MAIL_FROM` | `ChalkBoard <no-reply@chalkboard.app>` |
8. Redeploy + test register → expect `success: true` + real email in the inbox.

> 💡 If you ever paste the wrong key (`xsmtpsib-` instead of `xkeysib-`),
> Brevo's API returns **401 Key not found** — verify locally with:
> `node -e "fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',...})"`

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

### 8a. Pre-build: Expo login (token)
1. Open **https://expo.dev** → **Sign in** (Google/Apple/GitHub buttons at the bottom;
   you may already have an account from Expo Go).
2. **https://expo.dev/settings/access-tokens** → **Create token** → name it `chalkboard` → copy it.
3. Paste it where the assistant needs it (it is used as `EXPO_TOKEN` for the build).

### 8b. First-time EAS setup
```powershell
npm install -g eas-cli                 # once
set EXPO_TOKEN=<paste token>
eas whoami                             # should show your account
eas init --account <your-username>     # links app.json to EAS project (runs once)
```

### 8c. Build
```powershell
set EXPO_TOKEN=<paste token>
eas build -p android --profile preview
```
- First run auto-creates the Android keystore.
- Prints a dashboard link; APK ready in ~15–30 min.
- Track: `eas build:list --platform android --limit 1`

### 8d. Known build errors
- **`npm ci can only install packages when package.json and package-lock.json are in sync`**
  (Missing `@emnapi/core...` from lock file):
  your lockfile was written by npm 11; EAS uses npm 10 (strict).
  Fix:
  ```powershell
  npx -y npm@10.9.8 install --package-lock-only
  # verify:
  npx -y npm@10.9.8 ci --dry-run
  git add package-lock.json && git commit -m "chore: npm10 lock" && git push
  ```

- Prints an EAS dashboard link with progress. APK ready in ~15–30 min (incl. queue).
- Hit **Download .apk** → install on your phone (`adb install file.apk` or share the link), allow "Install unknown apps".

---

## 9. Verify on the real phone

1. Open **ChalkBoard** (the app, not Expo Go).
2. Register with your real email → **real 6-digit verification email** (via Brevo).
3. Enter code → sign in → browse → add to cart → checkout → **place order**.
4. Order appears in **Orders** and is stored in **Atlas**.

### Install the APK on the phone
- **From the phone:** open the `.apk` link from the EAS dashboard in the phone's
  browser → download → tap → allow "Install unknown apps" → **Install**.
- **From PC (USB):** connect phone with USB (File transfer mode) → copy
  `Downloads\ChalkBoard.apk` to the phone → open it in the file manager → Install.
- **From PC (wireless adb):**
  ```powershell
  adb connect <ip>:5550
  adb install "D:\ChalkBoard\ChalkBoard.apk"
  ```
- **Diagnostics:** `adb devices` (empty list = not connected);
  wireless debug link from earlier runs is reset when the phone reboots.

### Quirks to expect
- **First load after idle**: Render free tier sleeps after ~15 min; the first request wakes it (15–60 s). Fast after that.
- **Emails**: sent from your verified Brevo email.
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

## Current status (2026-09-11)

| Step | Status |
|---|---|
| Atlas cluster + user | ✅ done |
| Products seeded into Atlas | ✅ done |
| GitHub repo `kuldeep54/ChalkBoard` | ✅ done |
| `render.yaml` blueprint pushed | ✅ done |
| Render service `chalkboard-api` | ✅ live — Mongo OK, Brevo email OK |
| `.env` → Render URL | ✅ done (committed) |
| APK built (EAS) | ✅ **done** — `com.kuldeep.chalkboard` v1.0.0 (102 MB) |
| Install on phone + verify | 🔲 your turn — section 9 |
| `eas login` + APK build | ✅ **done** — build `12a86c2a`, APK downloaded |

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