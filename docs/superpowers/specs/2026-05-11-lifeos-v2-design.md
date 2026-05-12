# LifeOS v2 Design Spec

**Date:** 2026-05-11
**Status:** Approved
**Version:** 2.0

## Overview

Complete visual and functional redesign of LifeOS with glassmorphism aesthetic, improved information architecture, and accountability features.

## Visual Style: Glassmorphism

- Frosted glass effects with `backdrop-filter: blur()`
- Vibrant gradient backgrounds per page
- Semi-transparent cards with subtle borders
- Soft shadows and depth
- Modern, premium aesthetic

### Color Palette

| Page | Gradient | Purpose |
|------|----------|---------|
| Main | `#667eea → #764ba2` | Primary dashboard |
| Finances | `#10b981 → #059669` | Money tracking |
| Health | `#ec4899 → #be185d` | Health metrics |
| Gym | `#f97316 → #ea580c` | Workout tracking |
| Brand | `#8b5cf6 → #7c3aed` | Social media |
| Success | `#4ade80` | Completed items |
| Warning | `#fbbf24` | In progress |
| Danger | `#ef4444` | Missed items |

### Typography

- **Headings:** Bold, 700 weight
- **Body:** Regular, 400-500 weight
- **Labels:** Uppercase, small, 600 weight
- **Numbers:** Bold, 700 weight

### Animations

- Page transitions: Slide in/out
- Card entrance: Fade up
- Current timeline item: Pulse
- Accountability card: Shake
- Button interactions: Scale on tap/hover

## Main Dashboard

### Hero Section (Top)

- Greeting with date
- 4 key metrics in a row:
  - Day Progress (percentage)
  - Recovery (percentage)
  - Streak (number)
  - Goals (completed/total)
- Glassmorphism card with blur effects

### Timeline Section (Below)

- Vertical timeline showing day's flow
- **Completed items:** Green checkmark, normal opacity
- **Current item:** Yellow, pulsing animation, highlighted border
- **Upcoming items:** Dimmed, lower opacity
- Each item shows:
  - Time
  - Status (COMPLETED/NOW/UPCOMING)
  - Title
  - Details (duration, notes, etc.)

## Accountability Feature

### Top Card (Cannot Dismiss)

- Red warning banner with shake animation
- Lists missed goal(s)
- Textarea for explanation
- "Submit & Continue" button
- Rest of app dimmed until accountability resolved
- Cannot dismiss without submitting explanation

### Timeline Notes

- Missed goals show with red indicator
- Accountability note displayed inline in timeline card
- Shows explanation for future reference

## Finances Page

### Layout: Businesses First

- Business cards at top with:
  - Business name
  - Revenue/expenses/orders
  - Profit calculation
  - Color indicator
- Net worth summary below
- Subscriptions section
- Focus on income sources

### Business Card Structure

```
┌─────────────────────────────────┐
│ Business Name          +$2,400  │
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │ Rev  │ │ Exp  │ │ Ord  │     │
│ │$4,000│ │$1,600│ │  12  │     │
│ └──────┘ └──────┘ └──────┘     │
└─────────────────────────────────┘
```

## Health Page

### Layout: Bento Grid

- Grid layout with recovery ring and all metrics
- Metrics displayed:
  - Recovery score (large, with ring)
  - Sleep duration
  - Strain score
  - Resting heart rate (RHR)
  - Heart rate variability (HRV)
- Pink gradient theme

## Gym Page

### Layout: Split Overview

- Shows workout split (Push/Pull/Legs)
- Current day highlighted with border
- Today's workout details below
- Workout day counter
- Streak counter
- Orange gradient theme

### Split Display

```
┌────────┐ ┌────────┐ ┌────────┐
│  PUSH  │ │  PULL  │ │  LEGS  │
│ Day 12 │ │ Day 13 │ │ Day 14 │
└────────┘ └────────┘ └────────┘
```

## Brand Page

### Layout: Platform Cards

- Each platform gets its own card:
  - Platform icon
  - Handle/username
  - Follower count
  - Weekly growth
- Focus on per-platform tracking
- Purple gradient theme

### Platform Card Structure

```
┌─────────────────────────────────┐
│ 𝕏 Twitter          5,200  +89   │
│   @username                      │
└─────────────────────────────────┘
```

## Navigation

- Bottom navigation bar with glassmorphism
- 6 tabs: Main, Finances, Brand, Health, Gym, Settings
- Active tab highlighted
- Icons for each tab

## Component Library

### Glass Card

```jsx
<GlassCard>
  {/* Content */}
</GlassCard>
```

- Background: `rgba(255,255,255,0.15)`
- Backdrop filter: `blur(10px)`
- Border: `1px solid rgba(255,255,255,0.2)`
- Border radius: `12px`
- Padding: `16px`

### Timeline Item

```jsx
<TimelineItem status="completed|current|upcoming">
  {/* Content */}
</TimelineItem>
```

- Status determines styling
- Completed: Green indicator
- Current: Yellow, pulsing
- Upcoming: Dimmed

### Accountability Card

```jsx
<AccountabilityCard missedGoals={[...]}>
  {/* Form */}
</AccountabilityCard>
```

- Red warning banner
- Shake animation
- Required textarea
- Submit button

## Data Model Updates

### Goals

```js
{
  id: number,
  text: string,
  done: boolean,
  time?: string,        // For timeline
  details?: string,     // Additional info
  accountabilityNote?: string  // For missed goals
}
```

### Accountability

```js
{
  goalId: number,
  explanation: string,
  timestamp: number,
  resolved: boolean
}
```

## Implementation Notes

- Use Framer Motion for animations
- Use CSS custom properties for theming
- Implement responsive design for mobile-first
- Ensure accessibility with proper contrast ratios
- Test on various screen sizes

## Success Criteria

- [ ] Glassmorphism aesthetic implemented across all pages
- [ ] Hero section with 4 key metrics on main page
- [ ] Timeline view showing day's flow
- [ ] Accountability feature with required explanation
- [ ] Finances page with businesses-first layout
- [ ] Health page with bento grid layout
- [ ] Gym page with split overview
- [ ] Brand page with platform cards
- [ ] Smooth animations and transitions
- [ ] Consistent color theming per page
