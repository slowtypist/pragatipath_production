# 🏥 PragatiPath — Rural Health & Development Platform

PragatiPath ("Path of Progress") is a full-stack, offline-first digital 
health platform built for rural India — designed to work in low-connectivity 
villages where internet is unreliable or unavailable.

## 🎯 Who is it for?
- **Patients & Villagers** — Access health services, request ASHA home visits, 
  order medicines, track maternal care & vaccinations
- **ASHA Workers** — Manage patient requests, record voice complaints, 
  request medicine delivery, escalate emergencies — all offline
- **Pharmacy Owners** — Swiggy-style dashboard to manage orders, live stock, 
  invoices, delivery partners and ratings
- **Delivery Partners** — GPS-guided deliveries, OTP proof, earnings tracker
- **District Health Officers / Admin** — Command center with live maps, 
  outbreak detection, analytics, broadcast advisories and NHM-compatible 
  report exports

## ✨ Key Features
- 📵 **Offline-first** — Works without internet using IndexedDB + Service Worker
- 🔵 **Mesh Sync** — P2P data sync via Web Bluetooth between ASHA worker devices
- 🔄 **Eventual consistency** — Data syncs to Firestore automatically when connectivity returns
- 🎤 **Voice complaints** — ASHA workers record patient complaints via Web Speech API
- 🗺️ **Live maps** — Nearby hospitals, pharmacies, schools via OpenStreetMap
- 💊 **Medicine delivery** — Full order → assign → deliver → OTP confirm pipeline
- 🤱 **Maternal care** — Pregnancy tracking, vaccination scheduler, AI health prediction
- 📊 **Admin analytics** — Disease burden by village, referral success rates, ASHA performance
- 📢 **Broadcast advisories** — Admin sends health alerts to all ASHA workers or patients
- 📄 **NHM-compatible exports** — CSV reports for government submission

## 🛠️ Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Database:** Firebase Firestore + IndexedDB (offline)
- **Auth:** Firebase Authentication (Google + Email/Password + Phone OTP)
- **AI:** Google Gemini 2.0 Flash (health predictions, OCR prescription scanner)
- **Maps:** Leaflet + OpenStreetMap + Overpass API
- **Realtime:** Socket.io
- **Offline:** Service Worker + Web Bluetooth mesh sync
- **Hosting:** Firebase Hosting

## 🚀 Getting Started
```bash
git clone https://github.com/yourname/pragatipath.git
cd pragatipath
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm run dev
```

## 🔑 Environment Variables
See `.env.example` for all required variables including Firebase config and Gemini API key.

## 📱 PWA
PragatiPath is a Progressive Web App — installable on Android phones for 
full offline use in the field.

---
Built with ❤️ for rural India 🇮🇳
```

---

**Topics/Tags:**
```
react typescript firebase gemini-ai offline-first pwa rural-health india asha-worker mesh-networking web-bluetooth healthcare
