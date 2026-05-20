 
# 🌙 Lune Pool — Project 1: Responsive Frontend Interface

**DecodeLabs Full Stack Development | Batch 2026**
"# Task-1-Hikma-Hamza"

Project 1 is the interface phase of the Lune Pool cycle tracker. The goal was to build a fully responsive, user-friendly frontend using only HTML5, CSS3, and vanilla JavaScript - no frameworks, no libraries. Just the fundamentals.

---

## 🎯 Project Goal

Build a responsive frontend interface for a real-world web application that works seamlessly across mobile, tablet, and desktop screen sizes.

---

## ✅ Key Requirements Met

- Semantic HTML5 structure throughout
- Responsive layout for mobile, tablet, and desktop
- Mobile-first CSS using `min-width` media queries
- Clean, user-friendly UI with a consistent design system
- Vanilla JavaScript for all interactivity — no frameworks
- CSS Grid for page layout, Flexbox for components

---

## ✨ Features

### 🏠 Dashboard
- Cycle day progress ring (built with CSS `conic-gradient`)
- Next period countdown calculated from last logged date
- Ovulation date estimate
- Current cycle phase display (Menstrual, Follicular, Ovulation, Luteal)
- Phase-based wellness tip card that updates automatically

### 📅 Calendar
- Full monthly calendar rendered entirely by JavaScript
- Colour-coded days: period (pink), fertile window (green), ovulation (bright green), predicted (dashed)
- Previous and next month navigation
- Today's date highlighted with a border

### ✏️ Log
- Period start and end date inputs
- Flow intensity selector (Spotting, Light, Medium, Heavy)
- Cramps severity selector (None, Mild, Moderate, Severe)
- Mood selector with emoji indicators
- Notes text area for additional symptoms
- Save confirmation message

### 📊 History
- Summary stats: total cycles, average cycle length, average period length
- List of all past cycles with symptom chips
- Remove button on each entry

---

## 🛠 Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic page structure |
| CSS3 | Styling, layout, responsive design |
| JavaScript (ES6+) | DOM manipulation, interactivity, data storage |
| Google Fonts | Playfair Display (headings), Nunito (body) |
| localStorage | Storing cycle data in the browser |

---

## 🎨 Design System

### Colour Palette

| Name | Hex | Used For |
|------|-----|----------|
| Rose | `#e8829a` | Primary brand, buttons, ring |
| Rose Light | `#fde8ef` | Card backgrounds, period days |
| Lavender Light | `#f2eaf8` | Tip card, mood chips |
| Sage Light | `#e8f5ea` | Fertile window days |
| Cream | `#fdf8f9` | Page background |
| Text | `#3d2c35` | Primary text |

### Typography
- **Headlines:** Playfair Display (serif) — warmth and personality
- **Body:** Nunito (sans-serif) — clean and readable
- Maximum 2 font families, 3 weights

### Design Philosophy
Soft and calming pastel aesthetic — shifting away from clinical or sterile health app styling toward something warm, grounded, and approachable.

---

## 📁 File Structure

```
Responsive-frontend/
├── index.html      # All page sections and semantic structure
├── styles.css      # All styling and responsive breakpoints
└── script.js       # Navigation, rendering, data logic
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Default (< 768px) | Single column, top navigation bar |
| 768px+ | Sidebar navigation, wider content |
| 1024px+ | Extended content area |

---

## 🏗 HTML Structure

The app is a single HTML page using semantic landmark elements:

```html
<header>   — App name and branding
<nav>      — Mobile top navigation
<main>     — All four page sections
  <section id="dashboard">
  <section id="calendar">
  <section id="log">
  <section id="history">
```

Pages are shown and hidden using JavaScript by toggling a CSS `.active` class — no page reloads needed.

---

## ⚙️ How the JavaScript Works

### Navigation
```js
function showSection(sectionId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  // Show chosen page
  document.getElementById(sectionId).classList.add('active');
}
```

### Calendar Rendering
The calendar is built dynamically by JavaScript on every render:
1. Clear the grid
2. Write day headers (Su Mo Tu...)
3. Build sets of special dates (period days, fertile window, ovulation)
4. Add blank cells before day 1 to align the grid
5. Loop day 1 → 31, check which set each day belongs to, assign colour class

### Cycle Predictions
```js
// Next period = last start date + average cycle length
predictNextPeriod(lastCycle) → lastCycle.startDate + 28 days

// Ovulation = next period date − 14 days
predictOvulation(lastCycle)  → nextPeriod − 14 days
```

---

## 🚀 How to Run

No installation needed.

1. Download or clone the repository
2. Open `index.html` in VS Code
3. Right-click → **Open with Live Server**

The app runs entirely in the browser. No terminal, no server required for Project 1.

---

## 📐 Project Mandate

As specified in the DecodeLabs brief:

> "No Frameworks. Master the fundamentals first."

No React. No Bootstrap. No Tailwind. Every layout, animation, and interaction is built from scratch using raw HTML, CSS, and JavaScript to demonstrate full understanding of the core technologies.

---

## 👩‍💻 Built By

**NAPARI45** — DecodeLabs Full Stack Development Internship, Batch 2026

Powered by [DecodeLabs](https://www.decodelabs.tech)
