# ✈️ WanderPlan - Travel Itinerary Planner

A full-stack Travel Itinerary Planner application with an intuitive frontend interface and a lightweight Node.js/Express REST backend.

---

## 🌟 Features

- **Trip Management**: Create, edit, and organize multiple trips with custom destinations, dates, budgets, and cover images.
- **Day-by-Day Timeline**: Organize itineraries into Day 1, Day 2, etc., with precise timestamps, titles, and locations.
- **Categorized Activities**: Color-coded badges for **Sightseeing 🏛️**, **Food & Dining 🍜**, **Transport 🚆**, **Hotel 🏨**, **Adventure 🎒**, and **Shopping 🛍️**.
- **Interactive Budget Meter**: Automatically computes total estimated expenses against your budget and warns when nearing limits.
- **Activity Completion Tracking**: Check off activities as you complete them during your journey.
- **Google Maps Integration**: Direct one-click links to Google Maps for any activity location.
- **Print / PDF Friendly**: Export a clean, formatted itinerary to print or save as PDF.
- **Persistent Storage**: Trip and itinerary data persist automatically in `data/trips.json`.

---

## 📁 Project Structure

```
travel/
├── data/
│   └── trips.json         # JSON database with pre-seeded sample trips
├── public/                # Frontend Single Page App (SPA)
│   ├── css/
│   │   └── style.css      # Responsive modern styling with cards & timeline
│   ├── js/
│   │   └── app.js         # Client-side state, API calls & interactive UI
│   └── index.html         # Main dashboard and itinerary planner view
├── server.js              # Express.js REST API backend & static file server
├── package.json           # Dependencies and scripts
└── README.md
```

---

## 🚀 How to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
*(Or `node server.js`)*

### 3. Open in Browser
Navigate to:
```
http://localhost:3000
```

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips` | List all trips with summary stats (spent, activities count) |
| `POST` | `/api/trips` | Create a new trip (generates days automatically) |
| `GET` | `/api/trips/:id` | Get single trip details with all days and activities |
| `PUT` | `/api/trips/:id` | Update trip metadata (title, dates, budget, etc.) |
| `DELETE` | `/api/trips/:id` | Delete a trip |
| `POST` | `/api/trips/:id/days` | Add a new day to an existing trip |
| `POST` | `/api/trips/:id/activities` | Add an activity to a specific day |
| `PATCH` | `/api/trips/:id/activities/:activityId/toggle` | Toggle completion status |
| `DELETE` | `/api/trips/:id/activities/:activityId` | Remove an activity |
| `GET` | `/api/trips/:id/summary` | Get financial breakdown by category and budget metrics |
