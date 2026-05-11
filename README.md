# LifeOS v2

Your personal operating system for success. A complete rebuild with all values starting at 0/empty, designed to be built up from scratch with fully functional input forms across all sections.

## Features

### 🏠 Main Page
- Day ring showing time progression through the day
- Goals tracker with add/toggle functionality
- Overseer AI chat for accountability
- Streak tracking

### 💰 Finances
- Net worth tracking with assets/liabilities
- Business management with revenue/expenses/orders
- Subscription tracking with monthly burn calculation
- Incoming orders management

### 📱 Brand
- Personal brand profile with handle and tagline
- Social platform tracking (followers, growth)
- Daily reflection journal
- Short-form content posting tracker

### ❤️ Health
- Sleep tracking with two modes:
  - Direct hours input
  - Time-based (bedtime/wake time) with auto-calculation
- WHOOP data input (recovery, sleep, strain, HRV, RHR)
- Peak window visualization based on sleep data
- Personalized advice based on recovery score

### 💪 Gym
- Weekly split configuration (7 days)
- Exercise tracking per workout type
- Progressive overload coaching with AI targets
- Last weight/reps tracking for each exercise

### ⚙️ Settings
- Light/dark theme toggle (system-aware)
- Profile management
- Reset all data option

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Framer Motion** - Smooth animations
- **LocalStorage** - Data persistence

## Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation

```bash
cd LifeOS
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Mobile-First Design

LifeOS is designed primarily for mobile use with:
- Touch-friendly 44px minimum tap targets
- Bottom navigation for easy thumb access
- Responsive layouts that work on all screen sizes
- Native mobile input types (number, time, date)
- Viewport meta tag to prevent zoom on input focus

## Theme System

LifeOS supports both light and dark themes:
- Dark mode is default
- System preference detection
- Theme preference saved to localStorage
- CSS custom properties for easy theming

## Data Persistence

All data is automatically saved to localStorage:
- Goals, streak, and daily progress
- Financial data (net worth, businesses, subscriptions)
- Brand profile and platform stats
- Health metrics and sleep data
- Gym split and exercise history
- Theme preference

## Reset

To start fresh, go to Settings → Reset All Data. This will:
- Clear all localStorage data
- Reset all values to 0/empty
- Keep your theme preference

## License

MIT
