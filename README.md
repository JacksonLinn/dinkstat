# DinkStat — Pickleball Match Tracker & LP Rankings

A pickleball tracking app with a League-style LP ranking system.
Built with **Next.js**, **Firebase**, **Recharts**, and **Tailwind CSS**.

## Features

- **LP Ranking System** — League-style LP that scales by margin of victory with upset bonuses
- **Tier System** — Bronze → Silver → Gold → Platinum → Diamond → MAYBE HIGHER IN THE FUTURE
- **Registered Players Only** — Opponents must have an account to log matches
- **Doubles Support** — Log 2v2 matches with partner and opponent team names
- **Stats Dashboard** — LP trend, win rate, score charts, W/L split
- **Leaderboard** — Global player rankings by LP
- **Auth System** — Firebase Auth with email/password registration and login
- **Score Validation** — Enforces pickleball rules (game to 11, win by 2)

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Framework | Next.js 14 (App Router) |
| Database  | Firebase Firestore      |
| Auth      | Firebase Authentication |
| Styling   | Tailwind CSS            |
| Charts    | Recharts                |

---

## Quick Start (Run Locally)

### Prerequisites

You need **Node.js** installed. If you don't have it:

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (green button)
3. Install it (just click Next through the installer)
4. Open your terminal and verify: `node --version` (should show v18 or higher)

### Steps
```bash
# 1. Open terminal and navigate to the project folder
cd dinkstat

# 2. Install dependencies (this downloads all the libraries)
npm install

# 3. Start the development server
npm run dev
```

4. Open your browser and go to **http://localhost:3000**
5. Click **Register** to create a new account
6. Have a friend register too, then log matches against each other

### What you'll see

- **Login page** → Sign in or register
- **Dashboard** → Your LP, win rate, charts, recent matches
- **Log Match** → Type opponent name (must be registered), enter scores
- **Leaderboard** → See where you rank against all players

---

## Project Structure
```
dinkstat/
├── app/
│   ├── globals.css          # Global styles + Tailwind + animations
│   ├── layout.js            # Root layout with metadata
│   └── page.js              # Main app (dashboard, matches, leaderboard)
├── components/
│   ├── AuthScreen.js        # Login / Register screen
│   ├── Charts.js            # LP, win rate, score, pie charts
│   ├── LpBadge.js           # Tier badge component
│   ├── MatchForm.js         # Match logging with player validation
│   └── StatCard.js          # Stats card component
├── lib/
│   ├── firebase.js          # Firebase config + Auth + Firestore CRUD
│   ├── lp.js                # LP calculation algorithm + tier system
│   └── seed.js              # Demo data for testing
├── .env.local.example       # Firebase config template
├── .gitignore
├── jsconfig.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

---

## How LP Works

Everyone starts at **0 LP**. Points gained depend on margin of victory:

| Win Margin | LP Gained | LP Lost by Loser |
|------------|-----------|------------------|
| Win by 1-2 | +12       | -12              |
| Win by 3-5 | +18       | -16              |
| Win by 6-8 | +24       | -20              |
| Win by 9+  | +30       | -24              |

**Upset bonus**: Beat someone with more LP than you → up to +15 extra LP.
**LP floor**: Can't go below 0.

### Tiers

| Tier     | LP Required |
|----------|-------------|
| Diamond  | 500+        |
| Platinum | 350-499     |
| Gold     | 200-349     |
| Silver   | 100-199     |
| Bronze   | 0-99        |

---

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Create a project** → Name it `dinkstat`
3. Disable Google Analytics → Create

### 2. Enable Authentication

1. In Firebase sidebar → **Authentication**
2. Click **Get started**
3. Enable **Email/Password** provider

### 3. Create Firestore Database

1. Sidebar → **Firestore Database**
2. Click **Create database** → **Standard edition** → **Start in test mode**
3. Select nearest region → Enable

### 4. Get Config Values

1. Click gear icon → **Project settings**
2. Scroll down to **Your apps** → Click web icon (`</>`)
3. Name it `dinkstat-web` → Register
4. Copy the config values

### 5. Add to Project
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase values:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
