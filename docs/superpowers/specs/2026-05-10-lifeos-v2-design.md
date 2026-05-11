# LifeOS v2 Design Spec

**Date:** 2026-05-10
**Status:** Draft

## Overview

Complete rebuild of LifeOS with all values starting at 0/empty. The app is designed to be built up from scratch with fully functional input forms across all sections. Mobile-first design with touch-friendly interactions.

## Architecture

### State Structure

All state initializes to zero/empty:

```javascript
{
  user: "",
  workoutDay: "",
  whoop: { recovery: 0, sleep: 0, strain: 0, hrv: 0, rhr: 0, status: "gray", advice: "" },
  goals: [],
  streak: 0,
  finances: {
    netWorth: 0,
    assets: 0,
    liabilities: 0,
    subs: [],
    orders: [],
    budget: [],
  },
  businesses: [],
  brand: {
    handle: "",
    tagline: "",
    platforms: [],
    postedToday: 0,
    reflection: "",
  },
  overseerLog: [],
  overseerInput: "",
  gymSplit: {
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  },
  gymExercises: {}, // { "Legs": [{ name: "Squat", lastWeight: 0, lastReps: 0 }] }
  sleepInput: {
    mode: "direct", // "direct" | "time"
    hours: 0,
    bedtime: "",
    wakeTime: "",
  },
}
```

## Use Framer Motion for animations

- Use framer motion for all animations.

## Use 21st.dev for the frontend

- Use 21st.dev for the frontend. (https://21st.dev/)

### Data Persistence

- LocalStorage for all state
- Fresh start = clear localStorage
- Auto-save on state changes

## Section-by-Section Design

### 1. Main Page

**Features:**
- Day ring shows 0% at midnight, progresses through day
- Goals: empty list, add goals via input
- Overseer: ready to chat, no history
- Streak: 0

**Inputs:**
- Add goal text input
- Overseer chat input

### 2. Finances

**Features:**
- Net Worth: $0
- Assets: $0, Liabilities: $0
- Businesses: empty, add via form
- Subscriptions: empty, add via form
- Incoming Orders: empty, add via form

**Inputs:**
- Net worth, assets, liabilities number inputs
- Add business form (name, revenue, expenses, orders, color)
- Add subscription form (name, cost, renews date)
- Add order text input

### 3. Brand

**Features:**
- Handle: empty input
- Platforms: empty, add via form
- Posted Today: 0 counter
- Reflection: empty textarea

**Inputs:**
- Handle text input
- Tagline text input
- Add platform form (name, icon, followers, delta, color)
- Reflection textarea
- Posted today increment button

### 4. Health

**Removed:**
- Supplements section entirely

**Added:**
- Sleep input with two modes:
  - Direct: "Hours slept" number input
  - Time-based: Bedtime + Wake time (auto-calculates duration)
- WHOOP data: all 0s, with input fields to manually enter values
- Peak window: calculated from sleep data

**Inputs:**
- Sleep mode toggle (direct/time)
- Hours slept number input
- Bedtime time input
- Wake time time input
- WHOOP inputs (recovery, sleep %, strain, HRV, RHR)

### 5. Gym

**Setup Mode:**
- Configure weekly split (7 days, each day = workout type)
- Each day has a dropdown/select for workout type

**Daily Mode:**
- Shows today's workout type
- Exercise list for that day
- Add exercise form (name, last weight, last reps)
- Progressive overload coach button

**Inputs:**
- Weekly split: 7 dropdowns (one per day)
- Add exercise form (name, weight, reps)
- Exercise list with edit/delete

## Mobile-First Requirements

### Layout
- Bottom nav (already exists)
- All inputs: min 44px tap targets
- Cards stack vertically with proper spacing
- No horizontal scrolling
- Viewport meta tag: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`

### Input Handling
- Number inputs with mobile-friendly keyboards
- Date/time pickers native to mobile
- Prevent zoom on input focus

### Performance
- Lightweight animations
- Fast state updates
- No heavy computations on main thread

### Touch
- Swipe gestures where helpful
- Long-press for actions
- Clear visual feedback on tap

## UI/UX Approach

Using Impeccable and ui-ux-pro-max for:
- Dark theme consistency
- Input field styling
- Card layouts
- Micro-interactions
- Responsive design

## Light and Dark theme support

- Use the system theme
- Allow user to toggle between light and dark mode
- Dark mode should be default for the app
- The light mode should be a comfortable to read mode.
- Theme settings on all devices. (Should be saved to local storage)
- Use Impeccable v2 for the theme. (https://impeccable.style/)
- Use ui-ux-pro-max for the theme.

### Design Tokens

```javascript
{
  colors: {
    background: "#000",
    card: "#0d0d0d",
    input: "#111",
    border: "#222",
    text: "#fff",
    textMuted: "#555",
    accent: "#f59e0b",
    success: "#2ddb81",
    danger: "#ef4444",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  borderRadius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14,
  },
}
```

## Implementation Notes

- React with hooks for state management
- LocalStorage for persistence
- No external dependencies beyond React
- As many files as needed. Base /template file is v1.jsx
