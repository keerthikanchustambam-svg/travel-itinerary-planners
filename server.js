const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'trips.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and file exist
function getTripsData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading data:', err);
    return [];
  }
}

function saveTripsData(trips) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(trips, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving data:', err);
    return false;
  }
}

// Helper: generate array of days between two dates
function generateDays(startDate, endDate) {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [
      {
        dayNumber: 1,
        date: startDate || new Date().toISOString().split('T')[0],
        title: 'Day 1 - Exploration',
        activities: []
      }
    ];
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 30); // Cap at 30 days

  for (let i = 0; i < diffDays; i++) {
    const curDate = new Date(start);
    curDate.setDate(start.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];
    days.push({
      dayNumber: i + 1,
      date: dateStr,
      title: `Day ${i + 1}`,
      activities: []
    });
  }
  return days;
}

// ----------------- API ROUTES ----------------- //

// 1. Get all trips
app.get('/api/trips', (req, res) => {
  const trips = getTripsData();
  const summary = trips.map(t => {
    let totalCost = 0;
    let activityCount = 0;
    (t.days || []).forEach(d => {
      (d.activities || []).forEach(a => {
        totalCost += Number(a.cost) || 0;
        activityCount++;
      });
    });

    return {
      id: t.id,
      title: t.title,
      destination: t.destination,
      startDate: t.startDate,
      endDate: t.endDate,
      budget: Number(t.budget) || 0,
      currency: t.currency || '$',
      coverImage: t.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      totalCost,
      daysCount: (t.days || []).length,
      activityCount
    };
  });
  res.json(summary);
});

// 2. Create a new trip
app.post('/api/trips', (req, res) => {
  const { title, destination, startDate, endDate, budget, currency, notes, coverImage } = req.body;

  if (!title || !destination) {
    return res.status(400).json({ error: 'Title and Destination are required.' });
  }

  const trips = getTripsData();
  const newTripId = 'trip_' + Date.now();
  const days = generateDays(startDate, endDate);

  const newTrip = {
    id: newTripId,
    title: title.trim(),
    destination: destination.trim(),
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || startDate || new Date().toISOString().split('T')[0],
    budget: Number(budget) || 0,
    currency: currency || '$',
    coverImage: coverImage && coverImage.trim() !== ''
      ? coverImage.trim()
      : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    notes: notes || '',
    days
  };

  trips.push(newTrip);
  saveTripsData(trips);

  res.status(201).json(newTrip);
});

// 3. Get single trip by ID
app.get('/api/trips/:id', (req, res) => {
  const trips = getTripsData();
  const trip = trips.find(t => t.id === req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  res.json(trip);
});

// 4. Update trip details
app.put('/api/trips/:id', (req, res) => {
  const trips = getTripsData();
  const index = trips.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  const { title, destination, startDate, endDate, budget, currency, notes, coverImage } = req.body;
  const existing = trips[index];

  trips[index] = {
    ...existing,
    title: title !== undefined ? title : existing.title,
    destination: destination !== undefined ? destination : existing.destination,
    startDate: startDate !== undefined ? startDate : existing.startDate,
    endDate: endDate !== undefined ? endDate : existing.endDate,
    budget: budget !== undefined ? Number(budget) : existing.budget,
    currency: currency !== undefined ? currency : existing.currency,
    notes: notes !== undefined ? notes : existing.notes,
    coverImage: coverImage !== undefined ? coverImage : existing.coverImage
  };

  saveTripsData(trips);
  res.json(trips[index]);
});

// 5. Delete a trip
app.delete('/api/trips/:id', (req, res) => {
  const trips = getTripsData();
  const filtered = trips.filter(t => t.id !== req.params.id);

  if (filtered.length === trips.length) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  saveTripsData(filtered);
  res.json({ message: 'Trip deleted successfully.' });
});

// 6. Add activity to a trip day
app.post('/api/trips/:id/activities', (req, res) => {
  const { dayNumber, time, title, category, location, cost, notes } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Activity title is required.' });
  }

  const trips = getTripsData();
  const trip = trips.find(t => t.id === req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  const targetDayNumber = Number(dayNumber) || 1;
  let targetDay = (trip.days || []).find(d => d.dayNumber === targetDayNumber);

  if (!targetDay) {
    targetDay = {
      dayNumber: targetDayNumber,
      date: '',
      title: `Day ${targetDayNumber}`,
      activities: []
    };
    trip.days.push(targetDay);
    trip.days.sort((a, b) => a.dayNumber - b.dayNumber);
  }

  const newActivity = {
    id: 'act_' + Date.now(),
    time: time || '09:00',
    title: title.trim(),
    category: category || 'Sightseeing',
    location: location ? location.trim() : '',
    cost: Number(cost) || 0,
    notes: notes ? notes.trim() : '',
    completed: false
  };

  targetDay.activities = targetDay.activities || [];
  targetDay.activities.push(newActivity);
  // Sort activities by time
  targetDay.activities.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  saveTripsData(trips);
  res.status(201).json({ activity: newActivity, trip });
});

// 7. Toggle activity completion status
app.patch('/api/trips/:id/activities/:activityId/toggle', (req, res) => {
  const trips = getTripsData();
  const trip = trips.find(t => t.id === req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  let found = false;
  let updatedActivity = null;

  for (const day of trip.days || []) {
    const act = (day.activities || []).find(a => a.id === req.params.activityId);
    if (act) {
      act.completed = !act.completed;
      updatedActivity = act;
      found = true;
      break;
    }
  }

  if (!found) {
    return res.status(404).json({ error: 'Activity not found.' });
  }

  saveTripsData(trips);
  res.json(updatedActivity);
});

// 8. Delete activity
app.delete('/api/trips/:id/activities/:activityId', (req, res) => {
  const trips = getTripsData();
  const trip = trips.find(t => t.id === req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  let found = false;
  for (const day of trip.days || []) {
    const beforeCount = (day.activities || []).length;
    day.activities = (day.activities || []).filter(a => a.id !== req.params.activityId);
    if (day.activities.length < beforeCount) {
      found = true;
      break;
    }
  }

  if (!found) {
    return res.status(404).json({ error: 'Activity not found.' });
  }

  saveTripsData(trips);
  res.json({ message: 'Activity deleted successfully.' });
});

// 9. Add a new day to trip
app.post('/api/trips/:id/days', (req, res) => {
  const trips = getTripsData();
  const trip = trips.find(t => t.id === req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  trip.days = trip.days || [];
  const nextDayNum = trip.days.length + 1;

  let nextDate = '';
  if (trip.startDate) {
    const d = new Date(trip.startDate);
    d.setDate(d.getDate() + (nextDayNum - 1));
    nextDate = d.toISOString().split('T')[0];
  }

  const newDay = {
    dayNumber: nextDayNum,
    date: nextDate,
    title: req.body.title || `Day ${nextDayNum}`,
    activities: []
  };

  trip.days.push(newDay);
  saveTripsData(trips);
  res.status(201).json(newDay);
});

// 10. Get summary and budget statistics for a trip
app.get('/api/trips/:id/summary', (req, res) => {
  const trips = getTripsData();
  const trip = trips.find(t => t.id === req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  let totalCost = 0;
  const categories = {};
  let totalActivities = 0;
  let completedActivities = 0;

  (trip.days || []).forEach(day => {
    (day.activities || []).forEach(act => {
      const cost = Number(act.cost) || 0;
      const cat = act.category || 'Sightseeing';
      totalCost += cost;
      categories[cat] = (categories[cat] || 0) + cost;
      totalActivities++;
      if (act.completed) completedActivities++;
    });
  });

  const budget = Number(trip.budget) || 0;
  const remainingBudget = budget - totalCost;

  res.json({
    tripId: trip.id,
    tripTitle: trip.title,
    budget,
    totalCost,
    remainingBudget,
    currency: trip.currency || '$',
    totalActivities,
    completedActivities,
    categories
  });
});

// Fallback to index.html for client-side navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Travel Itinerary Planner Server is running at http://localhost:${PORT}`);
});
