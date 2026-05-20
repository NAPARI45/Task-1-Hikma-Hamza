/* ============================================================
   LUNA — CYCLE TRACKER  |  script.js  (Project 2 version)
   
   KEY CHANGE from Project 1:
   All data now comes from your Express backend API
   instead of localStorage. We use fetch() to talk to it.
   
   API base URL — change this if your server moves
   ============================================================ */

const API = 'http://localhost:3000';


/* ──────────────────────────────────────────────────────────
   1. API HELPER FUNCTIONS
   These replace getData() and saveData() from Project 1.
   They talk to your backend instead of localStorage.
────────────────────────────────────────────────────────────── */

/* fetchAllCycles()
   Calls GET /cycles and returns the array of cycles.
   Used by: History page, cycle calculations.
────────────────────────────────────────────────────────────── */
async function fetchAllCycles() {
  try {
    const response = await fetch(`${API}/cycles`);
    const data     = await response.json();
    return data.cycles || [];
  } catch (err) {
    console.error('Could not reach API:', err);
    return [];
  }
}

/* fetchLatestCycle()
   Calls GET /cycles/latest and returns the most recent cycle.
   Used by: Dashboard predictions.
────────────────────────────────────────────────────────────── */
async function fetchLatestCycle() {
  try {
    const response = await fetch(`${API}/cycles/latest`);
    if (response.status === 404) return null;
    const data = await response.json();
    return data.cycle || null;
  } catch (err) {
    console.error('Could not reach API:', err);
    return null;
  }
}

/* postCycle(entry)
   Calls POST /cycles with the cycle data from the Log form.
   Returns { success, message, cycle } from the server.
────────────────────────────────────────────────────────────── */
async function postCycle(entry) {
  try {
    const response = await fetch(`${API}/cycles`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(entry)
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Could not save cycle:', err);
    return { success: false, message: 'Server unreachable' };
  }
}

/* deleteCycle(id)
   Calls DELETE /cycles/:id.
────────────────────────────────────────────────────────────── */
async function deleteCycle(id) {
  try {
    const response = await fetch(`${API}/cycles/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Could not delete cycle:', err);
    return { success: false };
  }
}


/* ──────────────────────────────────────────────────────────
   2. SETTINGS
   Settings stay in localStorage — they are personal
   display preferences, not data that needs a server.
────────────────────────────────────────────────────────────── */

function getSettings() {
  const stored = localStorage.getItem('luna_settings');
  return stored
    ? JSON.parse(stored)
    : { cycleLength: 28, periodLength: 5 };
}

function saveSettings(settings) {
  localStorage.setItem('luna_settings', JSON.stringify(settings));
}


/* ──────────────────────────────────────────────────────────
   3. NAVIGATION
────────────────────────────────────────────────────────────── */

function showSection(sectionId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(sectionId).classList.add('active');

  document.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });

  if (sectionId === 'dashboard') renderDashboard();
  if (sectionId === 'calendar')  renderCalendar();
  if (sectionId === 'history')   renderHistory();
}

document.querySelectorAll('[data-section]').forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});


/* ──────────────────────────────────────────────────────────
   4. CYCLE CALCULATIONS
   These now receive cycle data as a parameter instead of
   reading from localStorage directly.
────────────────────────────────────────────────────────────── */

function predictNextPeriod(lastCycle) {
  if (!lastCycle) return null;
  const settings = getSettings();
  const start = new Date(lastCycle.startDate);
  start.setDate(start.getDate() + settings.cycleLength);
  return start;
}

function predictOvulation(lastCycle) {
  const nextPeriod = predictNextPeriod(lastCycle);
  if (!nextPeriod) return null;
  const ov = new Date(nextPeriod);
  ov.setDate(ov.getDate() - 14);
  return ov;
}

function getCurrentCycleDay(lastCycle) {
  if (!lastCycle) return null;
  const start = new Date(lastCycle.startDate);
  const today = new Date();
  const diff  = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

function getCurrentPhase(lastCycle) {
  const settings = getSettings();
  const day      = getCurrentCycleDay(lastCycle);
  if (!day) return null;
  if (day <= settings.periodLength) return 'Menstrual';
  if (day <= 13)  return 'Follicular';
  if (day === 14) return 'Ovulation';
  if (day <= 28)  return 'Luteal';
  return 'Late Luteal';
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toISODay(date) {
  return date.toISOString().split('T')[0];
}


/* ──────────────────────────────────────────────────────────
   5. DASHBOARD
   Now async — fetches the latest cycle from the API first.
────────────────────────────────────────────────────────────── */

async function renderDashboard() {
  const hour = new Date().getHours();
  const greetingEl = document.getElementById('greeting');
  if (hour < 12)      greetingEl.textContent = 'Good morning 🌸';
  else if (hour < 18) greetingEl.textContent = 'Good afternoon 🌼';
  else                greetingEl.textContent = 'Good evening 🌙';

  const lastCycle = await fetchLatestCycle();
  const settings  = getSettings();
  const day       = getCurrentCycleDay(lastCycle);
  const phase     = getCurrentPhase(lastCycle);

  const ringDayEl   = document.getElementById('ringDay');
  const cycleRingEl = document.getElementById('cycleRing');

  if (day) {
    ringDayEl.textContent = day;
    const pct = Math.min((day / settings.cycleLength) * 100, 100);
    cycleRingEl.style.background =
      `conic-gradient(var(--rose) ${pct}%, var(--rose-light) ${pct}%)`;
  } else {
    ringDayEl.textContent = '—';
  }

  const nextPeriod   = predictNextPeriod(lastCycle);
  const nextPeriodEl = document.getElementById('nextPeriodVal');
  if (nextPeriod) {
    const daysUntil = Math.round((nextPeriod - new Date()) / (1000 * 60 * 60 * 24));
    if      (daysUntil <= 0)  nextPeriodEl.textContent = 'Due now';
    else if (daysUntil === 1) nextPeriodEl.textContent = 'Tomorrow';
    else                      nextPeriodEl.textContent = `In ${daysUntil} days`;
  } else {
    nextPeriodEl.textContent = '—';
  }

  const ovulation = predictOvulation(lastCycle);
  document.getElementById('ovulationVal').textContent =
    ovulation ? formatDate(ovulation) : '—';

  document.getElementById('phaseVal').textContent = phase || '—';

  const tips = {
    'Menstrual':   '🌺 Rest when you can. Your body is working hard.',
    'Follicular':  '🌱 Energy is rising! Great time to start something new.',
    'Ovulation':   '✨ You\'re at your most energetic today.',
    'Luteal':      '🌙 Wind down and practise self-care this week.',
    'Late Luteal': '🫖 Be extra kind to yourself today.'
  };
  document.getElementById('tipCard').innerHTML =
    `<p>${tips[phase] || 'Log your first period to start seeing insights. 🌸'}</p>`;
}


/* ──────────────────────────────────────────────────────────
   6. CALENDAR
────────────────────────────────────────────────────────────── */

let calMonth = new Date().getMonth();
let calYear  = new Date().getFullYear();

async function renderCalendar() {
  const settings   = getSettings();
  const grid       = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('calMonthYear');
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  monthLabel.textContent = `${monthNames[calMonth]} ${calYear}`;
  grid.innerHTML = '';

  const cycles    = await fetchAllCycles();
  const lastCycle = cycles.length > 0 ? cycles[0] : null;

  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(day => {
    const el = document.createElement('div');
    el.className   = 'cal-day-header';
    el.textContent = day;
    grid.appendChild(el);
  });

  const periodDays = new Set();
  cycles.forEach(cycle => {
    if (!cycle.startDate) return;
    const start = new Date(cycle.startDate);
    const end   = cycle.endDate
      ? new Date(cycle.endDate)
      : new Date(start.getTime() + (settings.periodLength - 1) * 86400000);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      periodDays.add(toISODay(new Date(d)));
    }
  });

  const predictedPeriodDays = new Set();
  const fertileDays         = new Set();
  let   ovulationDay        = null;

  const nextPeriod = predictNextPeriod(lastCycle);
  if (nextPeriod) {
    for (let i = 0; i < settings.periodLength; i++) {
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

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

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
   7. LOG FORM
────────────────────────────────────────────────────────────── */

document.getElementById('startDate').value = toISODay(new Date());

document.querySelectorAll('.pill-group').forEach(group => {
  group.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });
});

document.getElementById('saveLogBtn').addEventListener('click', async () => {
  const startDate = document.getElementById('startDate').value;

  if (!startDate) {
    showSaveMsg('⚠️ Please enter a start date.');
    return;
  }

  const entry = {
    startDate,
    endDate: document.getElementById('endDate').value   || null,
    flow:    document.querySelector('#flowGroup .pill.selected')?.dataset.value   || null,
    cramps:  document.querySelector('#crampsGroup .pill.selected')?.dataset.value || null,
    mood:    document.querySelector('#moodGroup .pill.selected')?.dataset.value   || null,
    notes:   document.getElementById('notes').value.trim()
  };

  // Disable button while the request is in flight
  const btn = document.getElementById('saveLogBtn');
  btn.textContent = 'Saving...';
  btn.disabled    = true;

  const result = await postCycle(entry);

  btn.textContent = 'Save Log';
  btn.disabled    = false;

  if (result.success) {
    showSaveMsg('✅ Saved! Your cycle has been logged.');
    renderDashboard();
  } else {
    const errorMsg = result.errors ? result.errors.join(', ') : result.message;
    showSaveMsg(`⚠️ ${errorMsg}`);
  }
});

function showSaveMsg(msg) {
  const el = document.getElementById('saveMsg');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
}


/* ──────────────────────────────────────────────────────────
   8. HISTORY
────────────────────────────────────────────────────────────── */

async function renderHistory() {
  const cycles = await fetchAllCycles();

  document.getElementById('statCycles').textContent = cycles.length;

  if (cycles.length >= 2) {
    let total = 0, count = 0;
    const sorted = [...cycles].reverse();
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round(
        (new Date(sorted[i].startDate) - new Date(sorted[i-1].startDate))
        / (1000 * 60 * 60 * 24)
      );
      if (diff > 15 && diff < 50) { total += diff; count++; }
    }
    document.getElementById('statAvgCycle').textContent =
      count > 0 ? Math.round(total / count) + 'd' : '—';
  } else {
    document.getElementById('statAvgCycle').textContent = '—';
  }

  const withEnd = cycles.filter(c => c.endDate);
  if (withEnd.length >= 1) {
    const total = withEnd.reduce((sum, c) => {
      return sum + Math.round(
        (new Date(c.endDate) - new Date(c.startDate)) / (1000 * 60 * 60 * 24)
      ) + 1;
    }, 0);
    document.getElementById('statAvgPeriod').textContent =
      Math.round(total / withEnd.length) + 'd';
  } else {
    document.getElementById('statAvgPeriod').textContent = '—';
  }

  const listEl = document.getElementById('cycleList');

  if (cycles.length === 0) {
    listEl.innerHTML =
      '<p class="empty-msg">No cycles logged yet. Head to Log to get started! 🌸</p>';
    return;
  }

  listEl.innerHTML = cycles.map(cycle => {
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

    return `
      <div class="cycle-entry" id="entry-${cycle.id}">
        <div class="cycle-entry-top">
          <span class="cycle-entry-date">🌺 ${dateStr}</span>
          <span class="cycle-entry-dur">${durationStr}</span>
        </div>
        ${chips ? `<div class="chip-row">${chips}</div>` : ''}
        ${cycle.notes ? `<p class="cycle-notes">"${cycle.notes}"</p>` : ''}
        <button
          class="delete-btn"
          onclick="handleDelete(${cycle.id})"
          style="margin-top:8px; background:none; border:1px solid var(--rose);
                 color:var(--rose); border-radius:8px; padding:4px 12px;
                 font-size:0.78rem; cursor:pointer;">
          Remove
        </button>
      </div>
    `;
  }).join('');
}

async function handleDelete(id) {
  const result = await deleteCycle(id);
  if (result.success) {
    const el = document.getElementById(`entry-${id}`);
    if (el) el.remove();
    renderHistory();
    renderDashboard();
  }
}


/* ──────────────────────────────────────────────────────────
   9. SETTINGS MODAL
────────────────────────────────────────────────────────────── */

document.getElementById('settingsBtn').addEventListener('click', () => {
  const s = getSettings();
  document.getElementById('cycleLen').value  = s.cycleLength;
  document.getElementById('periodLen').value = s.periodLength;
  document.getElementById('settingsModal').classList.add('open');
});

document.getElementById('closeSettings').addEventListener('click', () => {
  document.getElementById('settingsModal').classList.remove('open');
});

document.getElementById('settingsModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  const cycleLen  = parseInt(document.getElementById('cycleLen').value);
  const periodLen = parseInt(document.getElementById('periodLen').value);

  if (cycleLen < 20 || cycleLen > 45) {
    alert('Cycle length must be between 20 and 45 days.'); return;
  }
  if (periodLen < 2 || periodLen > 10) {
    alert('Period length must be between 2 and 10 days.'); return;
  }

  saveSettings({ cycleLength: cycleLen, periodLength: periodLen });
  document.getElementById('settingsModal').classList.remove('open');
  renderDashboard();
  renderCalendar();
});


/* ──────────────────────────────────────────────────────────
   10. INITIALISE
────────────────────────────────────────────────────────────── */
renderDashboard();
renderCalendar();