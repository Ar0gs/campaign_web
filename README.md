# 🌟 Arogs Campaign Website — Rise With IMPACT
## Great Ife Students' Union · Obafemi Awolowo University

---

## What's Included

| File | Purpose |
|------|---------|
| `index.html` | Full campaign website (HTML/CSS/JS) |
| `app.js` | Frontend logic — modal, Supabase, push notifications |
| `sw.js` | Service Worker — background push reception |
| `manifest.json` | PWA manifest — makes site installable |
| `server.js` | Node.js backend — VAPID push + scheduled notifications |
| `package.json` | Backend dependencies |
| `.env.example` | Environment variables template |
| `supabase-schema.sql` | Database schema |

---

## Setup Guide (Step by Step)

### STEP 1 — Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon key** (Settings → API)
3. Also copy your **service_role key** (keep this secret — backend only)
4. Open **SQL Editor** → paste entire contents of `supabase-schema.sql` → Run

### STEP 2 — Deploy the Backend Server
**Option A: Railway (Recommended — free tier)**
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Upload the server files or connect your repo
3. Set environment variables (see Step 4)

**Option B: Render**
1. [render.com](https://render.com) → New Web Service
2. Set Build Command: `npm install`
3. Set Start Command: `npm start`

### STEP 3 — Generate VAPID Keys
Run this once on your server or locally:
```bash
npm install
npm run generate-vapid
```
Copy the two keys printed — you'll need them.

### STEP 4 — Set Environment Variables
On your server host, set these variables:
```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
CONTACT_EMAIL=your@email.com
FRONTEND_URL=https://your-site.com
ADMIN_SECRET=any_random_strong_string
PORT=3000
```

### STEP 5 — Update Frontend Config
In `app.js`, update the `CONFIG` object at the top:
```js
const CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY',       // anon key (public)
  vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY',
  serverUrl: 'https://your-backend-url.com'
};
```

### STEP 6 — Deploy the Frontend
The site must be served over **HTTPS** for Service Workers and push notifications to work.

**Options:**
- **Netlify** (free): Drag and drop the frontend files
- **Vercel** (free): `vercel deploy`  
- **GitHub Pages**: Push to a repo, enable Pages
- **Your own server**: Serve with nginx/Apache + SSL certificate

### STEP 7 — Add App Icons
Create PNG icons and place them in the frontend root:
- `icon-96.png` (96×96)
- `icon-192.png` (192×192)  
- `icon-512.png` (512×512)

Use Canva or any editor with the IMPACT/Arogs branding.

---

## How the Notifications Work

```
User visits site
     ↓
Modal appears: "Are you ready to Rise With IMPACT?"
     ↓
User enters email/phone → clicks YES
     ↓
Browser asks: "Allow notifications?" → User clicks Allow
     ↓
Push subscription created (unique token for this device)
     ↓
Subscription saved to Supabase + backend server
     ↓
EVERY DAY:
  8:00 AM WAT → Server sends "Good morning" push to ALL subscribers
  9:00 PM WAT → Server sends "Evening check-in" push to ALL subscribers
     ↓
Notification appears on phone even if browser is closed ✓
```

---

## Notification Messages

**8:00 AM daily:**
> Title: ☀️ Good Morning from Arogs!  
> Body: *"Arogs wishes you a good day today, remember to make IMPACT"*

**9:00 PM daily:**
> Title: 🌙 Evening Check-in — Arogs  
> Body: *"Hello, How much IMPACT did you make today? Arogs says Hi!"*

---

## Testing Notifications

Send a test push to all subscribers:
```bash
curl -X POST https://your-backend-url.com/send-test \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_ADMIN_SECRET","message":"Test message!"}'
```

---

## Important Notes

- **HTTPS required**: Push notifications only work on HTTPS sites
- **Android Chrome**: Works best. Notifications appear on lock screen.
- **iPhone Safari**: Push notifications require iOS 16.4+ with the site added to Home Screen as a PWA
- **Firefox/Edge**: Fully supported
- **The service worker stays active** in the background even when the tab/app is closed — this is what enables background push reception

---

*Rise With IMPACT · Arogs · Great Ife Students' Union · OAU*
