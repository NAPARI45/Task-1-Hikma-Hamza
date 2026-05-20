/* ============================================================
   LUNE POOL — CYCLE TRACKER  |  script.js  (Project 1)

   Project 1 version — no backend, no fetch().
   All data is stored in localStorage (the browser's
   built-in storage). Data persists between page refreshes
   but is local to this device only.
   ============================================================ */


/* ──────────────────────────────────────────────────────────
   1. DATA MANAGEMENT
   getData()  → reads saved data from localStorage
   saveData() → writes data to localStorage
────────────────────────────────────────────────────────────── */

function getData() {
  const stored = localStorage.getItem('luna_data');
  if (stored) {
    return JSON.parse(stored);
  }
  // Default structure if nothing saved yet
  return {
    cycles:   [],
    settings: { cycleLength: 28, periodLength: 5 }
  };
}

function saveData(data) {
  localStorage.setItem('luna_data', JSON.stringify(data));
}


/* ──────────────────────────────────────────────────────────
   2. NAVIGATION
   showSection() hides all pages and shows only the one
   matching the sectionId passed in.
────────────────────────────────────────────────────────────── */

function showSection(sectionId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show the chosen page
  document.getElementById(sectionId).classList.add('active');

  // Update bottom nav buttons
  document.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });

  // Update sidebar nav buttons (desktop)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });

  // Refresh content when navigating to each page
  if (sectionId === 'dashboard') renderDashboard();
  if (sectionId === 'calendar')  renderCalendar();
  if (sectionId === 'history')   renderHistory();
}

// Attach click events to all nav buttons
document.querySelectorAll('[data-section]').forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});


/* ──────────────────────────────────────────────────────────
   3. CYCLE CALCULATIONS
   Helper functions that work out dates and cycle info
   from the saved data.
────────────────────────────────────────────────────────────── */

// Returns the most recently logged cycle, or null if none
function getLastCycle() {
  const data = getData();
  if (data.cycles.length === 0) return null;
  return data.cycles[data.cycles.length - 1];
}

// Predicts the start date of the next period
function predictNextPeriod() {
  const data = getData();
  const last = getLastCycle();
  if (!last) return null;
  const start = new Date(last.startDate);
  start.setDate(start.getDate() + data.settings.cycleLength);
  return start;
}

// Predicts ovulation — 14 days before next period
function predictOvulation() {
  const nextPeriod = predictNextPeriod();
  if (!nextPeriod) return null;
  const ov = new Date(nextPeriod);
  ov.setDate(ov.getDate() - 14);
  return ov;
}

// Returns how many days into the current cycle the user is
function getCurrentCycleDay() {
  const last = getLastCycle();
  if (!last) return null;
  const start = new Date(last.startDate);
  const today = new Date();
  const diff  = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

// Returns the phase name based on cycle day
function getCurrentPhase() {
  const data = getData();
  const day  = getCurrentCycleDay();
  if (!day) return null;
  if (day <= data.settings.periodLength) return 'Menstrual';
  if (day <= 13)  return 'Follicular';
  if (day === 14) return 'Ovulation';
  if (day <= 28)  return 'Luteal';
  return 'Late Luteal';
}

// Calculates average cycle length from logged cycles
function getAvgCycleLength() {
  const data = getData();
  if (data.cycles.length < 2) return data.settings.cycleLength;
  let total = 0, count = 0;
  for (let i = 1; i < data.cycles.length; i++) {
    const prev = new Date(data.cycles[i - 1].startDate);
    const curr = new Date(data.cycles[i].startDate);
    const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diff > 15 && diff < 50) { total += diff; count++; }
  }
  return count > 0 ? Math.round(total / count) : data.settings.cycleLength;
}

// Calculates average period length from cycles with end dates
function getAvgPeriodLength() {
  const data     = getData();
  const withEnd  = data.cycles.filter(c => c.endDate);
  if (withEnd.length === 0) return data.settings.periodLength;
  const total = withEnd.reduce((sum, c) => {
    return sum + Math.round(
      (new Date(c.endDate) - new Date(c.startDate)) / (1000 * 60 * 60 * 24)
    ) + 1;
  }, 0);
  return Math.round(total / withEnd.length);
}

// Formats a Date into "15 Jun"
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Formats a Date into "15 June 2026"
function formatDateLong(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Returns "YYYY-MM-DD" string for a Date object
function toISODay(date) {
  return date.toISOString().split('T')[0];
}


/* ──────────────────────────────────────────────────────────
   4. DASHBOARD
   Reads from localStorage and renders the cycle ring,
   predictions, and tip card.
────────────────────────────────────────────────────────────── */

function renderDashboard() {
  // Time-based greeting
  const hour = new Date().getHours();
  const greetingEl = document.getElementById('greeting');
  if (hour < 12)      greetingEl.textContent = 'Good morning 🌸';
  else if (hour < 18) greetingEl.textContent = 'Good afternoon 🌼';
  else                greetingEl.textContent  = 'Good evening 🌙';

  const data  = getData();
  const day   = getCurrentCycleDay();
  const phase = getCurrentPhase();

  // ── Cycle ring ──
  const ringDayEl   = document.getElementById('ringDay');
  const cycleRingEl = document.getElementById('cycleRing');

  if (day) {
    ringDayEl.textContent = day;
    const pct = Math.min((day / data.settings.cycleLength) * 100, 100);
    cycleRingEl.style.background =
      `conic-gradient(var(--rose) ${pct}%, var(--rose-light) ${pct}%)`;
  } else {
    ringDayEl.textContent = '—';
  }

  // ── Next period prediction ──
  const nextPeriod   = predictNextPeriod();
  const nextPeriodEl = document.getElementById('nextPeriodVal');
  if (nextPeriod) {
    const daysUntil = Math.round((nextPeriod - new Date()) / (1000 * 60 * 60 * 24));
    if      (daysUntil <= 0)  nextPeriodEl.textContent = 'Due now';
    else if (daysUntil === 1) nextPeriodEl.textContent = 'Tomorrow';
    else                      nextPeriodEl.textContent = `In ${daysUntil} days`;
  } else {
    nextPeriodEl.textContent = '—';
  }

  // ── Ovulation prediction ──
  const ovulation = predictOvulation();
  document.getElementById('ovulationVal').textContent =
    ovulation ? formatDate(ovulation) : '—';

  // ── Current phase ──
  document.getElementById('phaseVal').textContent = phase || '—';

  // ── Phase tip card ──
  const tips = {
    'Menstrual':   '🌺 Rest when you can. Your body is working hard.',
    'Follicular':  '🌱 Energy is rising! Great time to start something new.',
    'Ovulation':   '✨ You\'re at your most energetic today.',
    'Luteal':      '🌙 Wind down and practise self-care this week.',
    'Late Luteal': '🫖 Be extra kind to yourself today.'
  };
  document.getElementById('tipCard').innerHTML =
    `<p>${tips[phase] || 'Log your first period to start tracking. 🌸'}</p>`;
}


/* ──────────────────────────────────────────────────────────
   5. CALENDAR
   Builds the monthly calendar grid using JavaScript.
   Reads cycle data from localStorage to colour-code days.
────────────────────────────────────────────────────────────── */

let calMonth = new Date().getMonth();
let calYear  = new Date().getFullYear();

function renderCalendar() {
  const data       = getData();
  const grid       = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('calMonthYear');
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  monthLabel.textContent = `${monthNames[calMonth]} ${calYear}`;
  grid.innerHTML = ''; // clear previous calendar

  // ── Day headers ──
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(day => {
    const el = document.createElement('div');
    el.className   = 'cal-day-header';
    el.textContent = day;
    grid.appendChild(el);
  });

  // ── Build sets of special dates ──

  // Past period days from logged cycles
  const periodDays = new Set();
  data.cycles.forEach(cycle => {
    if (!cycle.startDate) return;
    const start = new Date(cycle.startDate);
    const end   = cycle.endDate
      ? new Date(cycle.endDate)
      : new Date(start.getTime() + (data.settings.periodLength - 1) * 86400000);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      periodDays.add(toISODay(new Date(d)));
    }
  });

  // Predicted future period, fertile window, and ovulation
  const predictedPeriodDays = new Set();
  const fertileDays         = new Set();
  let   ovulationDay        = null;

  const nextPeriod = predictNextPeriod();
  if (nextPeriod) {
    for (let i = 0; i < data.settings.periodLength; i++) {
      const d = new Date(nextPeriod);
      d.setDate(d.getDate() + i);
      predictedPeriodDays.add(toISODay(d));
    }
    const ov = new Date(nextPeriod);
    ov.setDate(ov.getDate() - 14);
    ovulationDay = toISODay(ov);
    for (let i = -5; i < 0; i++) {
      const d = new Date(ov);
      d.setDate(d.getDate() + i);
      fertileDays.add(toISODay(d));
    }
  }

  // ── Empty cells before day 1 ──
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  // ── Day cells ──
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr    = toISODay(new Date());

  for (let day = 1; day <= daysInMonth; day++) {
    const month   = String(calMonth + 1).padStart(2, '0');
    const dayStr  = String(day).padStart(2, '0');
    const dateStr = `${calYear}-${month}-${dayStr}`;

    const el = document.createElement('div');
    el.className   = 'cal-day';
    el.textContent = day;

    if      (periodDays.has(dateStr))          el.classList.add('period-day');
    else if (dateStr === ovulationDay)          el.classList.add('ovulation-day');
    else if (fertileDays.has(dateStr))         el.classList.add('fertile-day');
    else if (predictedPeriodDays.has(dateStr)) el.classList.add('predicted-day');

    if (dateStr === todayStr) el.classList.add('today');
    grid.appendChild(el);
  }
}

// Month navigation buttons
document.getElementById('prevMonth').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});


/* ──────────────────────────────────────────────────────────
   6. LOG FORM
   Reads form values and saves to localStorage.
   No fetch() — no backend needed for Project 1.
────────────────────────────────────────────────────────────── */

// Default start date to today
document.getElementById('startDate').value = toISODay(new Date());

// Pill button toggle — only one pill selected per group
document.querySelectorAll('.pill-group').forEach(group => {
  group.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });
});

// Save log button
document.getElementById('saveLogBtn').addEventListener('click', () => {
  const startDate = document.getElementById('startDate').value;

  if (!startDate) {
    showSaveMsg('⚠️ Please enter a start date.');
    return;
  }

  // Build the cycle entry object
  const entry = {
    startDate,
    endDate: document.getElementById('endDate').value   || null,
    flow:    document.querySelector('#flowGroup .pill.selected')?.dataset.value   || null,
    cramps:  document.querySelector('#crampsGroup .pill.selected')?.dataset.value || null,
    mood:    document.querySelector('#moodGroup .pill.selected')?.dataset.value   || null,
    notes:   document.getElementById('notes').value.trim()
  };

  // Load existing data
  const data = getData();

  // Check if a cycle with this start date already exists — update if so
  const existingIndex = data.cycles.findIndex(c => c.startDate === startDate);

  if (existingIndex >= 0) {
    data.cycles[existingIndex] = entry;
  } else {
    data.cycles.push(entry);
    // Keep cycles sorted oldest to newest
    data.cycles.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }

  saveData(data);
  showSaveMsg('✅ Saved! Your cycle has been logged.');
  renderDashboard();
});

function showSaveMsg(msg) {
  const el = document.getElementById('saveMsg');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
}


/* ──────────────────────────────────────────────────────────
   7. HISTORY
   Reads all cycles from localStorage and renders them
   as a list with stats and symptom chips.
────────────────────────────────────────────────────────────── */

function renderHistory() {
  const data   = getData();
  const cycles = [...data.cycles].reverse(); // newest first

  // ── Stats ──
  document.getElementById('statCycles').textContent = data.cycles.length;

  document.getElementById('statAvgCycle').textContent =
    data.cycles.length >= 2 ? getAvgCycleLength() + 'd' : '—';

  document.getElementById('statAvgPeriod').textContent =
    data.cycles.filter(c => c.endDate).length >= 1 ? getAvgPeriodLength() + 'd' : '—';

  // ── Cycle list ──
  const listEl = document.getElementById('cycleList');

  if (cycles.length === 0) {
    listEl.innerHTML =
      '<p class="empty-msg">No cycles logged yet. Head to Log to get started! 🌸</p>';
    return;
  }

  listEl.innerHTML = cycles.map((cycle, index) => {
    const start       = new Date(cycle.startDate);
    const dateStr     = formatDateLong(start);
    let   durationStr = 'Ongoing';

    if (cycle.endDate) {
      const days = Math.round(
        (new Date(cycle.endDate) - start) / (1000 * 60 * 60 * 24)
      ) + 1;
      durationStr = `${days} day period`;
    }

    let chips = '';
    if (cycle.flow)                              chips += `<span class="chip chip-flow">Flow: ${cycle.flow}</span>`;
    if (cycle.cramps && cycle.cramps !== 'none') chips += `<span class="chip chip-cramps">Cramps: ${cycle.cramps}</span>`;
    if (cycle.mood)                              chips += `<span class="chip chip-mood">${cycle.mood}</span>`;

    // Calculate the real index in the original (non-reversed) array for deletion
    const realIndex = data.cycles.length - 1 - index;

    return `
      <div class="cycle-entry" id="entry-${realIndex}">
        <div class="cycle-entry-top">
          <span class="cycle-entry-date">🌺 ${dateStr}</span>
          <span class="cycle-entry-dur">${durationStr}</span>
        </div>
        ${chips ? `<div class="chip-row">${chips}</div>` : ''}
        ${cycle.notes ? `<p class="cycle-notes">"${cycle.notes}"</p>` : ''}
        <button
          onclick="handleDelete(${realIndex})"
          style="margin-top:8px; background:none; border:1px solid var(--rose);
                 color:var(--rose); border-radius:8px; padding:4px 12px;
                 font-size:0.78rem; cursor:pointer;">
          Remove
        </button>
      </div>
    `;
  }).join('');
}

// Delete a cycle by its index in the cycles array
function handleDelete(index) {
  const data = getData();
  data.cycles.splice(index, 1);
  saveData(data);
  renderHistory();
  renderDashboard();
}


/* ──────────────────────────────────────────────────────────
   8. INITIALISE
   Runs once when the page loads.
────────────────────────────────────────────────────────────── */
renderDashboard();
renderCalendar();