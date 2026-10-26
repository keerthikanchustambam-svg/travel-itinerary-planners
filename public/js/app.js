// Travel Itinerary Planner Client App
const API_BASE = '/api';

// Application State
let tripsList = [];
let currentTrip = null;
let activeDayNumber = 1;

// DOM Elements
const tripsView = document.getElementById('trips-view');
const plannerView = document.getElementById('planner-view');
const tripsGrid = document.getElementById('trips-grid');
const tripSearchInput = document.getElementById('trip-search-input');
const tripsCountLabel = document.getElementById('trips-count-label');

// Modals
const modalCreateTrip = document.getElementById('modal-create-trip');
const modalAddActivity = document.getElementById('modal-add-activity');
const formCreateTrip = document.getElementById('form-create-trip');
const formAddActivity = document.getElementById('form-add-activity');
const actDaySelect = document.getElementById('act-day-select');

// Planner Elements
const bannerTitle = document.getElementById('banner-title');
const bannerDestination = document.getElementById('banner-destination');
const bannerDates = document.getElementById('banner-dates');
const bannerNotes = document.getElementById('banner-notes');
const tripBanner = document.getElementById('trip-banner');
const statDuration = document.getElementById('stat-duration');
const statActivities = document.getElementById('stat-activities');
const statExpenses = document.getElementById('stat-expenses');
const statBudget = document.getElementById('stat-budget');
const statRemaining = document.getElementById('stat-remaining');
const budgetProgressBar = document.getElementById('budget-progress-bar');
const budgetPercentage = document.getElementById('budget-percentage');
const dayTabsContainer = document.getElementById('day-tabs-container');
const currentDayHeading = document.getElementById('current-day-heading');
const currentDayDate = document.getElementById('current-day-date');
const activitiesTimeline = document.getElementById('activities-timeline');

// Buttons
const btnViewTrips = document.getElementById('btn-view-trips');
const btnOpenCreateTrip = document.getElementById('btn-open-create-trip');
const btnHeroNewTrip = document.getElementById('btn-hero-new-trip');
const btnBackToTrips = document.getElementById('btn-back-to-trips');
const btnAddDay = document.getElementById('btn-add-day');
const btnOpenAddActivity = document.getElementById('btn-open-add-activity');
const btnDeleteTrip = document.getElementById('btn-delete-trip');
const btnPrintItinerary = document.getElementById('btn-print-itinerary');
const navBrand = document.getElementById('nav-brand');

// Category Icons Map
const categoryIcons = {
  Sightseeing: 'fa-landmark',
  Food: 'fa-utensils',
  Transport: 'fa-plane-departure',
  Hotel: 'fa-hotel',
  Activity: 'fa-person-hiking',
  Shopping: 'fa-bag-shopping'
};

// ======================== INITIALIZATION ======================== //

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadTrips();
  setDefaultDates();
});

function setDefaultDates() {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 5);

  const startInput = document.getElementById('trip-start-date');
  const endInput = document.getElementById('trip-end-date');
  if (startInput) startInput.value = today.toISOString().split('T')[0];
  if (endInput) endInput.value = nextWeek.toISOString().split('T')[0];
}

function setupEventListeners() {
  // Navigation
  btnViewTrips.addEventListener('click', showTripsView);
  navBrand.addEventListener('click', showTripsView);
  btnBackToTrips.addEventListener('click', showTripsView);

  // Modals Open
  btnOpenCreateTrip.addEventListener('click', () => openModal(modalCreateTrip));
  btnHeroNewTrip.addEventListener('click', () => openModal(modalCreateTrip));
  btnOpenAddActivity.addEventListener('click', () => {
    populateDaySelectOptions();
    actDaySelect.value = activeDayNumber;
    openModal(modalAddActivity);
  });

  // Modal Closers
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.currentTarget.getAttribute('data-close');
      closeModal(document.getElementById(modalId));
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      closeModal(e.target.closest('.modal'));
    });
  });

  // Form Submissions
  formCreateTrip.addEventListener('submit', handleCreateTrip);
  formAddActivity.addEventListener('submit', handleAddActivity);

  // Search Filter
  tripSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    renderTripsGrid(tripsList.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.destination.toLowerCase().includes(query)
    ));
  });

  // Trip Actions
  btnAddDay.addEventListener('click', handleAddDay);
  btnDeleteTrip.addEventListener('click', handleDeleteCurrentTrip);
  btnPrintItinerary.addEventListener('click', () => window.print());
}

// ======================== TOAST & MODAL HELPERS ======================== //

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.background = isError ? '#ef4444' : '#1e293b';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function openModal(modal) {
  if (modal) modal.classList.add('active');
}

function closeModal(modal) {
  if (modal) modal.classList.remove('active');
}

// ======================== VIEW TOGGLING ======================== //

function showTripsView() {
  plannerView.classList.remove('active');
  tripsView.classList.add('active');
  currentTrip = null;
  loadTrips();
}

function showPlannerView() {
  tripsView.classList.remove('active');
  plannerView.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ======================== API CALLS & DATA ======================== //

async function loadTrips() {
  try {
    const res = await fetch(`${API_BASE}/trips`);
    if (!res.ok) throw new Error('Failed to fetch trips');
    tripsList = await res.json();
    renderTripsGrid(tripsList);
  } catch (err) {
    console.error(err);
    showToast('Failed to load trips from server', true);
  }
}

async function loadTripDetail(tripId) {
  try {
    const res = await fetch(`${API_BASE}/trips/${tripId}`);
    if (!res.ok) throw new Error('Trip not found');
    currentTrip = await res.json();
    activeDayNumber = 1;
    renderPlannerView();
    showPlannerView();
  } catch (err) {
    console.error(err);
    showToast('Failed to open trip itinerary', true);
  }
}

// ======================== RENDER FUNCTIONS ======================== //

function renderTripsGrid(trips) {
  tripsCountLabel.textContent = `${trips.length} itinerary${trips.length === 1 ? '' : 'ies'} ready to explore`;
  tripsGrid.innerHTML = '';

  if (trips.length === 0) {
    tripsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-map-location-dot"></i></div>
        <h3>No itineraries found</h3>
        <p>Start by creating your first trip itinerary to organize flights, hotels, and sights.</p>
        <button class="btn btn-primary" onclick="document.getElementById('btn-open-create-trip').click()">
          <i class="fa-solid fa-plus"></i> Create Your First Trip
        </button>
      </div>
    `;
    return;
  }

  trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.addEventListener('click', () => loadTripDetail(trip.id));

    const curr = trip.currency || '$';

    card.innerHTML = `
      <div class="trip-card-image-wrap">
        <img class="trip-card-image" src="${escapeHtml(trip.coverImage)}" alt="${escapeHtml(trip.title)}" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'">
        <span class="destination-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(trip.destination)}</span>
        <span class="days-badge">${trip.daysCount} Day${trip.daysCount === 1 ? '' : 's'}</span>
      </div>
      <div class="trip-card-body">
        <h3 class="trip-card-title">${escapeHtml(trip.title)}</h3>
        <div class="trip-card-dates">
          <i class="fa-regular fa-calendar"></i>
          <span>${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</span>
        </div>
        <div class="trip-card-footer">
          <div class="trip-cost-preview">
            Spent: <strong>${curr}${trip.totalCost.toLocaleString()}</strong> / ${curr}${trip.budget.toLocaleString()}
          </div>
          <span class="btn btn-sm btn-secondary"><i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </div>
    `;

    tripsGrid.appendChild(card);
  });
}

function renderPlannerView() {
  if (!currentTrip) return;

  const curr = currentTrip.currency || '$';

  // Banner details
  bannerTitle.textContent = currentTrip.title;
  bannerDestination.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(currentTrip.destination)}`;
  bannerDates.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formatDate(currentTrip.startDate)} &mdash; ${formatDate(currentTrip.endDate)}`;
  bannerNotes.textContent = currentTrip.notes || '';
  tripBanner.style.backgroundImage = `url('${currentTrip.coverImage}')`;

  // Calculate statistics
  let totalCost = 0;
  let activityCount = 0;
  (currentTrip.days || []).forEach(day => {
    (day.activities || []).forEach(act => {
      totalCost += Number(act.cost) || 0;
      activityCount++;
    });
  });

  const budget = Number(currentTrip.budget) || 0;
  const remaining = budget - totalCost;
  const pct = budget > 0 ? Math.min(Math.round((totalCost / budget) * 100), 100) : 0;

  // Stats Display
  statDuration.textContent = `${(currentTrip.days || []).length} Days`;
  statActivities.textContent = activityCount;
  statExpenses.textContent = `${curr}${totalCost.toLocaleString()}`;
  statBudget.textContent = `${curr}${budget.toLocaleString()}`;
  statRemaining.textContent = `${curr}${remaining.toLocaleString()}`;
  statRemaining.style.color = remaining < 0 ? 'var(--danger)' : 'var(--text-main)';

  // Budget Progress Meter
  budgetProgressBar.style.width = `${pct}%`;
  budgetPercentage.textContent = `${pct}% used`;
  budgetProgressBar.className = 'progress-fill';
  if (pct > 90) {
    budgetProgressBar.classList.add('danger');
  } else if (pct > 70) {
    budgetProgressBar.classList.add('warning');
  }

  // Render Day Tabs
  renderDayTabs();

  // Render current day's activities
  renderCurrentDayActivities();
}

function renderDayTabs() {
  dayTabsContainer.innerHTML = '';
  const days = currentTrip.days || [];

  days.forEach(day => {
    const tabBtn = document.createElement('button');
    tabBtn.className = `day-tab-btn ${day.dayNumber === activeDayNumber ? 'active' : ''}`;
    tabBtn.innerHTML = `Day ${day.dayNumber}`;
    tabBtn.addEventListener('click', () => {
      activeDayNumber = day.dayNumber;
      renderDayTabs();
      renderCurrentDayActivities();
    });
    dayTabsContainer.appendChild(tabBtn);
  });
}

function renderCurrentDayActivities() {
  const days = currentTrip.days || [];
  const currentDay = days.find(d => d.dayNumber === activeDayNumber) || days[0];

  if (!currentDay) {
    activitiesTimeline.innerHTML = '<p class="subtitle">No days created yet. Click "+ Add Day" to get started.</p>';
    return;
  }

  currentDayHeading.textContent = currentDay.title || `Day ${currentDay.dayNumber}`;
  currentDayDate.textContent = currentDay.date ? formatDate(currentDay.date) : '';

  const activities = currentDay.activities || [];
  activitiesTimeline.innerHTML = '';

  if (activities.length === 0) {
    activitiesTimeline.innerHTML = `
      <div class="empty-state" style="padding: 2.5rem 1rem;">
        <i class="fa-solid fa-clipboard-list empty-state-icon" style="font-size: 2.2rem;"></i>
        <h4>No activities scheduled for Day ${currentDay.dayNumber}</h4>
        <p>Add dining, sightseeing spots, flights, or hotels to build your itinerary.</p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('btn-open-add-activity').click()">
          <i class="fa-solid fa-plus"></i> Add First Activity
        </button>
      </div>
    `;
    return;
  }

  const curr = currentTrip.currency || '$';

  activities.forEach(act => {
    const item = document.createElement('div');
    item.className = 'timeline-item';

    const catIcon = categoryIcons[act.category] || 'fa-map-pin';
    const isCompleted = act.completed ? 'completed' : '';

    item.innerHTML = `
      <div class="timeline-marker">${escapeHtml(act.time || '--:--')}</div>
      <div class="timeline-card ${isCompleted}">
        <div class="activity-header">
          <div>
            <div class="activity-title">${escapeHtml(act.title)}</div>
            <div class="activity-badges">
              <span class="cat-badge cat-${escapeHtml(act.category || 'Sightseeing')}">
                <i class="fa-solid ${catIcon}"></i> ${escapeHtml(act.category || 'Sightseeing')}
              </span>
              ${act.cost > 0 ? `<span class="cost-badge">${curr}${Number(act.cost).toLocaleString()}</span>` : ''}
            </div>
          </div>
          <div class="activity-actions">
            <button class="icon-btn" title="${act.completed ? 'Mark pending' : 'Mark completed'}" data-toggle="${act.id}">
              <i class="fa-regular ${act.completed ? 'fa-circle-check' : 'fa-circle'}"></i>
            </button>
            <button class="icon-btn delete" title="Delete activity" data-del="${act.id}">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>

        ${act.location ? `
          <div class="activity-location">
            <i class="fa-solid fa-location-dot"></i>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(act.location)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i>
            </a>
          </div>
        ` : ''}

        ${act.notes ? `
          <div class="activity-notes">
            <i class="fa-solid fa-info-circle"></i> ${escapeHtml(act.notes)}
          </div>
        ` : ''}
      </div>
    `;

    // Activity Button Listeners
    item.querySelector('[data-toggle]').addEventListener('click', () => toggleActivityComplete(act.id));
    item.querySelector('[data-del]').addEventListener('click', () => deleteActivity(act.id));

    activitiesTimeline.appendChild(item);
  });
}

function populateDaySelectOptions() {
  actDaySelect.innerHTML = '';
  if (!currentTrip || !currentTrip.days) return;

  currentTrip.days.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.dayNumber;
    opt.textContent = `Day ${d.dayNumber}${d.title ? ' - ' + d.title : ''}`;
    actDaySelect.appendChild(opt);
  });
}

// ======================== ACTIONS & EVENT HANDLERS ======================== //

async function handleCreateTrip(e) {
  e.preventDefault();

  const title = document.getElementById('trip-title').value.trim();
  const destination = document.getElementById('trip-destination').value.trim();
  const startDate = document.getElementById('trip-start-date').value;
  const endDate = document.getElementById('trip-end-date').value;
  const budget = parseFloat(document.getElementById('trip-budget').value) || 0;
  const currency = document.getElementById('trip-currency').value;
  const coverImage = document.getElementById('trip-cover').value.trim();
  const notes = document.getElementById('trip-notes').value.trim();

  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, destination, startDate, endDate, budget, currency, coverImage, notes })
    });

    if (!res.ok) throw new Error('Failed to create trip');
    const createdTrip = await res.json();

    closeModal(modalCreateTrip);
    formCreateTrip.reset();
    setDefaultDates();
    showToast(`Trip to "${destination}" created!`);

    // Open newly created trip immediately
    await loadTripDetail(createdTrip.id);
  } catch (err) {
    console.error(err);
    showToast('Failed to create trip. Please try again.', true);
  }
}

async function handleAddActivity(e) {
  e.preventDefault();
  if (!currentTrip) return;

  const dayNumber = parseInt(document.getElementById('act-day-select').value, 10);
  const time = document.getElementById('act-time').value;
  const title = document.getElementById('act-title').value.trim();
  const category = document.getElementById('act-category').value;
  const cost = parseFloat(document.getElementById('act-cost').value) || 0;
  const location = document.getElementById('act-location').value.trim();
  const notes = document.getElementById('act-notes').value.trim();

  try {
    const res = await fetch(`${API_BASE}/trips/${currentTrip.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayNumber, time, title, category, cost, location, notes })
    });

    if (!res.ok) throw new Error('Failed to add activity');
    const data = await res.json();
    currentTrip = data.trip;

    closeModal(modalAddActivity);
    formAddActivity.reset();
    showToast(`Activity "${title}" added!`);

    activeDayNumber = dayNumber;
    renderPlannerView();
  } catch (err) {
    console.error(err);
    showToast('Failed to add activity.', true);
  }
}

async function toggleActivityComplete(activityId) {
  if (!currentTrip) return;

  try {
    const res = await fetch(`${API_BASE}/trips/${currentTrip.id}/activities/${activityId}/toggle`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to toggle status');

    // Update in local state
    for (const d of currentTrip.days) {
      const a = (d.activities || []).find(act => act.id === activityId);
      if (a) {
        a.completed = !a.completed;
        break;
      }
    }
    renderPlannerView();
  } catch (err) {
    console.error(err);
    showToast('Could not update status', true);
  }
}

async function deleteActivity(activityId) {
  if (!confirm('Are you sure you want to remove this activity?')) return;
  if (!currentTrip) return;

  try {
    const res = await fetch(`${API_BASE}/trips/${currentTrip.id}/activities/${activityId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete activity');

    // Remove from local trip days
    for (const d of currentTrip.days) {
      d.activities = (d.activities || []).filter(a => a.id !== activityId);
    }
    showToast('Activity deleted.');
    renderPlannerView();
  } catch (err) {
    console.error(err);
    showToast('Failed to delete activity', true);
  }
}

async function handleAddDay() {
  if (!currentTrip) return;

  try {
    const res = await fetch(`${API_BASE}/trips/${currentTrip.id}/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!res.ok) throw new Error('Failed to add day');
    const newDay = await res.json();

    currentTrip.days.push(newDay);
    activeDayNumber = newDay.dayNumber;
    showToast(`Day ${newDay.dayNumber} added!`);
    renderPlannerView();
  } catch (err) {
    console.error(err);
    showToast('Failed to add day', true);
  }
}

async function handleDeleteCurrentTrip() {
  if (!currentTrip) return;
  if (!confirm(`Are you sure you want to delete the trip "${currentTrip.title}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE}/trips/${currentTrip.id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete trip');
    showToast('Trip deleted successfully');
    showTripsView();
  } catch (err) {
    console.error(err);
    showToast('Failed to delete trip', true);
  }
}

// ======================== FORMATTING UTILITIES ======================== //

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
