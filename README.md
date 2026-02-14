# BP Tracker

A modern blood pressure tracking application built with Next.js, featuring an intuitive dashboard with trend visualization and data export capabilities.

![BP Tracker Dashboard](./docs/screenshots/dashboard.png)

## Features

- **Quick Input**: Enter readings in simple format `120/80/72` (systolic/diastolic/heart rate)
- **Visual Trends**: Interactive charts showing your blood pressure history over time
- **Smart Classification**: Automatic color-coding based on AHA (American Heart Association) guidelines
- **Statistics Dashboard**: View averages, trends, and latest readings at a glance
- **Data Export**: Export your records to CSV for sharing with healthcare providers
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Local Storage**: All data stored locally in SQLite database

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Database | [SQLite](https://sqlite.org/) (via better-sqlite3) |
| Testing | [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/) |

## Prerequisites

- **Node.js** 18.0 or later
- **npm** or **yarn** package manager

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bp-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

Initialize the SQLite database with the required schema:

```bash
npm run db:init
```

This creates a `bp_tracker.db` file in the project root with the necessary tables.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Adding a Blood Pressure Reading

1. **Enter the reading** in the input field using the format:
   - `120/80/72` - includes systolic, diastolic, and heart rate
   - `120/80` - includes systolic and diastolic only

2. **Add optional notes** (e.g., "Morning reading, after coffee")

3. **Click "Add Record"** to save

The reading will appear immediately in your records list and update the charts.

### Understanding the Charts

The dashboard displays three trend lines:
- **Red line** - Systolic pressure (top number)
- **Blue line** - Diastolic pressure (bottom number)
- **Green line** - Heart rate (if provided)

Hover over any point to see the exact values for that reading.

### Reading Color Codes

Each reading is color-coded according to AHA guidelines:

| Category | Color | Range |
|----------|-------|-------|
| Normal | 🟢 Green | < 120 / < 80 |
| Elevated | 🟡 Yellow | 120-129 / < 80 |
| High Stage 1 | 🟠 Orange | 130-139 or 80-89 |
| High Stage 2 | 🔴 Red | ≥ 140 or ≥ 90 |
| Crisis | 🔴 Dark Red | ≥ 180 or ≥ 120 |

### Viewing Statistics

The statistics panel shows:
- **Averages** for systolic, diastolic, and heart rate
- **Total readings** count
- **Date range** of your records
- **Latest reading** with color-coded status
- **Trend indicator** comparing recent vs. older readings

### Exporting Data

1. Click the **"Export CSV"** button in the header
2. The file `bp-records-YYYY-MM-DD.csv` will download automatically
3. You can optionally filter by date range using URL parameters:
   ```
   /api/export?from=2024-01-01&to=2024-12-31
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run test` | Run Jest tests |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |

## Project Structure

```
bp-tracker/
├── app/
│   ├── api/              # API routes
│   │   ├── records/      # CRUD operations for BP records
│   │   └── export/       # CSV export endpoint
│   ├── components/       # React components
│   │   ├── BPChart.tsx   # Trend visualization
│   │   ├── BPInputForm.tsx    # Input form
│   │   ├── BPRecordsList.tsx  # Records table
│   │   └── BPStats.tsx   # Statistics panel
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard page
├── lib/
│   ├── db.ts             # Database client
│   └── parser.ts         # Input parser
├── db/
│   ├── schema.sql        # Database schema
│   └── init.ts           # Database initialization
├── __tests__/            # Test files
└── public/               # Static assets
```

## Database Schema

```sql
CREATE TABLE bp_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    systolic INTEGER NOT NULL,        -- Systolic pressure (mmHg)
    diastolic INTEGER NOT NULL,       -- Diastolic pressure (mmHg)
    heart_rate INTEGER NOT NULL,      -- Heart rate (bpm)
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT                        -- Optional notes
);
```

## Screenshots

### Dashboard Overview
![Dashboard Overview](./docs/screenshots/dashboard-overview.png)
*Main dashboard showing charts, input form, and statistics*

### Adding a Reading
![Adding Reading](./docs/screenshots/add-reading.png)
*Input form with validation and optional notes*

### Records List
![Records List](./docs/screenshots/records-list.png)
*Paginated list with color-coded readings and delete functionality*

### Statistics Panel
![Statistics](./docs/screenshots/statistics.png)
*Comprehensive statistics including averages and trends*

### Data Export
![Export](./docs/screenshots/export.png)
*CSV export feature for sharing data with healthcare providers*

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- bpinputform.test.tsx
```

### Type Checking

```bash
npm run typecheck
```

### Building for Production

```bash
npm run build
npm start
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Blood pressure classification based on [American Heart Association guidelines](https://www.heart.org/en/health-topics/high-blood-pressure)
- Icons and styling inspired by modern healthcare applications

---

**Note**: This application is for personal tracking purposes only. Always consult with healthcare professionals for medical advice and interpretation of blood pressure readings.
