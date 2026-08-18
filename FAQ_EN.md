# Xingmian AI FAQ (English)

> Sleep-Health WeChat Mini-Program + privately deployable Node backend

---

## Table of Contents

- [Basics](#basics)
- [Installation & Deployment](#installation--deployment)
- [Data & Compliance](#data--compliance)
- [Backend & Sync](#backend--sync)
- [Product Matrix](#product-matrix)
- [Troubleshooting](#troubleshooting)
- [License & Contact](#license--contact)

---

## Basics

### Q: What is Xingmian AI?

Xingmian AI (星眠AI) is a personal sleep-health companion built as a WeChat mini-program, targeting insomniacs and the overworked. It covers sleep logging, routine check-in, a sleep dashboard, and a sleep-aid timer, forming a closed loop of "log → rhythm → insight → relax". It is paired with an enterprise "Burnout Radar" and a personal "Energy Station" data-asset module.

### Q: Is it free / open source?

The code is published here, but it is a **commercial project**. For code licensing or commercial cooperation, please contact the author (see [License & Contact](#license--contact)).

### Q: Which platforms are supported?

The frontend runs as a **WeChat mini-program** (iOS / Android via WeChat). The optional backend is a Node + Express service deployable on Tencent Cloud CVM / CloudBase.

### Q: What is the "Energy Station"?

The Energy Station quantifies your sleep logs and check-ins into "data energy" and "data assets", giving users a sense of accumulating valuable health data — the starting point of the data flywheel — even when running in local mode without a backend.

---

## Installation & Deployment

### Q: How do I run the mini-program?

1. Open the repository root with **WeChat DevTools**.
2. Fill in your own mini-program AppID in `project.config.json` (e.g. a string starting with `wx`; the repo does not store a real AppID).
3. Compile and preview. It defaults to **local mode** (data stored on device, no network needed).

### Q: How do I run the backend locally?

```bash
cd server
cp .env.example .env        # keep DEV_MODE=true for local dev (allows devPhone bypass login)
npm install
npm start                  # http://localhost:3000
curl http://localhost:3000/   # health check
```

### Q: How do I deploy to Tencent Cloud?

See [`server/DEPLOY-CVM.md`](./server/DEPLOY-CVM.md):
1. Purchase a CVM / Lighthouse instance
2. Upload the `server/` directory
3. Run `bash deploy-cvm.sh`
4. Run `DOMAIN=your-domain bash setup-https.sh`
5. Flip the frontend switch (`config/compliance.js`) back to the real backend

### Q: Do I need a backend to use the app?

No. In **local mode** the mini-program stores everything on the device and never connects to a server, so you can use the core features immediately. The backend is only needed for phone-number login and cloud sync.

---

## Data & Compliance

### Q: Is the app compliant without medical qualifications?

Yes, for the parts already implemented: a privacy guidance page, a separate-consent pop-up, content-moderation interception (no medical claims), and full user agreement / privacy policy. Features that require qualifications — e.g. the generative-AI sleep assistant (algorithm filing) and the enterprise Burnout Radar (security rating + DPA) — are phased in after the corresponding filing/approval.

### Q: Where is my data stored?

In **local mode**, on the device via `wx.setStorageSync`. With the real backend enabled, data is stored in the Express service's JSON file storage (or your own database), isolated per phone number, with the AppSecret supplied only through environment variables.

### Q: Does the app make medical / treatment claims?

No. Per compliance rules, the app avoids treatment claims. "Anxinmian" follows the licensed route and will not claim "treatment" before SaMD Class-II filing.

---

## Backend & Sync

### Q: How do I switch from local mode to the real backend?

Edit `config/compliance.js`:

```js
BACKEND_SYNC: { enabled: true, apiBase: 'https://your-domain' }
```

Then add your domain under WeChat console → "Server Domains → request legal domains". Business code does not need to change.

### Q: What does the backend use for storage?

A zero-native-dependency Express service using JSON file storage, designed for simple private deployment. Phone numbers isolate data; the WeChat AppSecret is read only from environment variables.

---

## Product Matrix

### Q: What are ① Anxinmian, ② Burnout Radar, and ③ Energy Station?

| Product | Positioning | Status |
| ---------- | ----------------------------------------- | ---------------- |
| ① **Anxinmian** | Personal sleep-health management (log / check-in / dashboard / timer) | ✅ MVP-1 released |
| ② **Burnout Radar** | Enterprise employee burnout-risk early warning | 🔜 After security rating + DPA |
| ③ **Energy Station** | Personal data-asset visualization (energy / level / ledger) | ✅ Live (local mode) |

The closed loop is: personal data cultivation → anonymous aggregation → enterprise revenue → feeds back to individuals.

---

## Troubleshooting

### Q: The mini-program won't preview / compile?

- Confirm you replaced the AppID in `project.config.json` with your own.
- Check WeChat DevTools is on the latest stable version.
- Ensure the project root (not a subfolder) is opened.

### Q: The backend won't start?

- Check Node.js is installed (`node -v`, 18+ recommended).
- Ensure `.env` exists (copy from `.env.example`).
- Check port 3000 is free.

### Q: Sync to the real backend fails?

- Verify `apiBase` in `config/compliance.js` points to your domain.
- Confirm the domain is added to WeChat "request legal domains".
- Check the backend is reachable (health check `GET /`).

---

## License & Contact

- **Developer**: Jinjiang Feihongzhi Technology Enterprise Management Co., Ltd. · Feiyang Qiyuan R&D Center
- **Lead**: Wu Cihong
- **Commercial licensing**: contact the author for code authorization.

> Originally named "AI Sleep Assistant"; renamed to **Xingmian AI**. "Energy Bank" was renamed to **Energy Station**.
