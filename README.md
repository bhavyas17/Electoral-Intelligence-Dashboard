# Electoral Campaign Dashboard

A full-stack electoral intelligence dashboard for **Illinois Senatorial District 21, 22, 41, 42** operations. Built to give campaign managers, field directors, and communications staff a real-time, data-driven view of constituency health, voter sentiment, stakeholder relationships, electoral arithmetic, and opposition intelligence — all in one place. This also provides an overview of constituency statistics, turnout projections, vote margins, issue density heat maps, and a walk list generator drawing workbench.

---

## Table of contents

- [What this is](#what-this-is)
- [Architecture overview](#architecture-overview)
- [Module breakdown](#module-breakdown)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local setup — step by step](#local-setup--step-by-step)
- [Environment variables](#environment-variables)
- [Database setup (PostGIS)](#database-setup-postgis)
- [Running the servers](#running-the-servers)
- [API reference](#api-reference)
- [Mock mode](#mock-mode)
- [Data sources](#data-sources)
- [Contributing](#contributing)
- [License](#license)

---

## What this is

This is a constituency electoral intelligence platform designed around the real operational needs of a state-level political campaign. It replaces the disconnected stack of spreadsheets, CRM exports, and manual media monitoring that most campaigns rely on and replaces it with a unified, interactive dashboard that surfaces the right information to the right person at the right time.

The platform covers eight intelligence modules:

| Module | Name | Core function |
|--------|------|---------------|
| 1 | Constituency overview | Geographic map, KPI snapshot, canvassing coverage |
| 3 | Citizen sentiment | NLP social media pulse, email/call classifier, polling |
| 5 | Stakeholder intelligence | Network graph, endorsements, donor compliance |
| 6 | Electoral Map | Vote goal, VBM chase, canvassing pace |
| 7 | Comparison Benchmark | District vs state benchmarks, peer comparisons, grant tracker |
| 8 | Campaign intelligence | Real-time alerts, weekly briefing, opposition watch |

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Frontend)                   │
│  index.html · people.html · electoral.html               │
│  comparison.html · intelligence.html                     │
│  app.js · app.css                                        │
│  Leaflet.js · Chart.js · Leaflet Draw · Leaflet Heat     │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│   Node.js / Express │   │   Python / Flask             │
│   server.js         │   │   sentiment_server.py        │
│   PORT 8080         │   │   PORT 8081                  │
│                     │   │                              │
│  /api/precincts     │   │  /api/sentiment/classify     │
│  /api/walklist      │   │  /api/sentiment/data         │
│  /api/crm-density   │   │  /api/people/stakeholders    │
│                     │   │  /api/people/compliance      │
└──────────┬──────────┘   └──────────────┬───────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────────────────────────────────────────┐
│          PostgreSQL + PostGIS Database                   │
│          db_schema.sql                                   │
│                                                         │
│  districts · precincts · voters · crm_contacts          │
│  canvassing_logs                                        │
│  Spatial indexes (GIST) on all geometry columns         │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│          External APIs (optional)                        │
│  Gemini 2.5 Flash API — NLP sentiment classification    │
│  Mapbox / Leaflet — map tile rendering                  │
│  ILSBE voter file — voter registration data             │
└─────────────────────────────────────────────────────────┘
```

The system runs two backend servers in parallel. The Node.js server handles all geospatial map queries through PostGIS. The Python Flask server handles all NLP sentiment classification and stakeholder/compliance API calls. Both fall back to mock data automatically when the database is offline, making local development possible without a live database.

---

## Module breakdown

### Module 1 — Constituency overview (`index.html`)

The entry point and map engine. Powered by Leaflet.js with five toggleable overlay layers.

**What it shows:**
- Interactive precinct map of IL Senate District 21 (Naperville / Lisle area)
- Overlay toggles: voter turnout · vote margin · issue density · canvassing coverage · demographics
- Four drill-down levels: Illinois state → District 21 → precinct click panel → household voter dots
- Walk list generator: draw a polygon on the map → PostGIS `ST_Contains` query → prioritised door-knock list export
- Left sidebar: KPI cards, party lean chart, canvassing pace, bill tracker
- Sentiment panel: live NLP classifier, polling trend chart, town hall Q&A log

**Key files:** `index.html`, `app.js`, `app.css`, `server.js`

---

### Module 3 — Citizen sentiment (embedded in `index.html` sentiment panel)

Real-time NLP pipeline for constituent communications.

**What it shows:**
- Social media sentiment scores per issue (healthcare, taxes, education, infrastructure, public safety)
- Real-time alert banners for volume spikes and virality events
- Inbound email/call NLP classifier powered by Gemini 2.5 Flash API
- Week-over-week inbound volume chart
- Town hall feedback Q&A log with divergence alert
- AI weekly strategic sentiment briefing paragraph

**Key files:** `sentiment_server.py`, `sample_sentiment_data.json`

---

### Module 5 — Stakeholder intelligence (`people.html`)

Relationship network and donor compliance layer.

**What it shows:**
- D3.js force-directed stakeholder network graph (Senator → unions, business orgs, advocacy groups)
- Endorsement status, alignment scores, last contact date, open asks per stakeholder
- Donor geography map, sector breakdown chart
- FEC/ILSBE compliance flags: limit exceeded, dual donor, prohibited foreign source

**Key files:** `people.html`, `sentiment_server.py` (`/api/people/stakeholders`, `/api/people/compliance`)

---

### Module 6 — Electoral map (`electoral.html`)

The campaign's vote-counting engine.

**What it shows:**
- Vote goal calculator with pace-to-goal progress bar
- VBM (vote by mail) request and return rate tracker
- VBM chase universe — voters who requested a ballot but have not returned it
- Canvassing contact rate by precinct
- Historical precinct results: turnout %, vote margin, swing precinct flags
- Voter registration trends: active vs inactive, party affiliation split, new registrant tracking
- Early vote pace vs prior cycle benchmark

**Key files:** `electoral.html`

---

### Module 7 — Comparison Benchmark (`comparison.html`)

District vs state benchmark and funding gap analysis.

**What it shows:**
- 47-indicator benchmark comparison: District 21 vs Illinois state average
- Gap analysis ranked by deficit size (negative gaps flagged red, positive green)
- Peer district comparison: District 21 vs 8 comparable suburban IL Senate districts
- Best practices panel: programmes from peer districts achieving better outcomes
- State budget and per-capita funding by category: education, infrastructure, public health
- Grant tracker: active grants + untapped grant prospectus with deadlines

**Key files:** `comparison.html`

---

### Module 8 — Campaign intelligence (`intelligence.html`)

The alert engine and opposition watch system.

**What it shows:**
- Real-time alert feed: volume spikes, virality alerts, bill vote countdowns, compliance flags
- Alert priority tiers: red (immediate) · yellow (monitor) · green (on track)
- Weekly AI briefing report with priority signals and recommended actions
- Opposition messaging surveillance: narrative threat scoring
- PAC spending tracker with FEC filing integration
- Media buy detection

**Key files:** `intelligence.html`

---

## Tech stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 / CSS3 / Vanilla JS | — | UI structure and logic |
| Leaflet.js | 1.9.4 | Interactive map rendering |
| Leaflet Draw | 1.0.4 | Polygon drawing for walk list extraction |
| Leaflet Heat | 0.2.0 | Issue density heat map overlay |
| Chart.js | Latest | Bar, line, pie, and donut charts |
| Outfit font (Google Fonts) | — | Primary typeface |
| Inter / JetBrains Mono | — | Module pages secondary fonts |

### Backend — Node.js server
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥18.x | Runtime |
| Express | ^4.x | HTTP server and routing |
| pg | ^8.x | PostgreSQL client (PostGIS support) |
| cors | ^2.x | Cross-origin request handling |

### Backend — Python server
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | ≥3.9 | Runtime |
| Flask | ^3.x | HTTP server and API routing |
| Flask-CORS | ^4.x | Cross-origin request handling |
| requests | ^2.x | Gemini API HTTP calls |

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL ≥14 | Primary relational database |
| PostGIS ≥3.3 | Spatial geometry types and `ST_Contains` queries |
| GIST indexes | Spatial query acceleration on geometry columns |

### External APIs (optional)
| API | Purpose | Required? |
|-----|---------|-----------|
| Google Gemini 2.5 Flash | NLP sentiment classification | No — falls back to local rule-based classifier |
| Leaflet / OpenStreetMap | Map tile rendering | Yes — CDN loaded, no key needed |
| Mapbox | Enhanced map tiles (optional upgrade) | No |

---

## Project structure

```
Dashboard/
│
├── index.html                  # Module 1 — Constituency overview (entry point)
├── people.html                 # Module 5 — Stakeholder intelligence
├── electoral.html              # Module 6 — Electoral arithmetic
├── comparison.html             # Module 7 — Evidence library
├── intelligence.html           # Module 8 — Campaign intelligence
│
├── app.js                      # Core frontend JavaScript (Leaflet map, charts, API calls)
├── app.css                     # Shared stylesheet (dark theme, all modules)
│
├── server.js                   # Node.js / Express backend (geospatial API, PostGIS queries)
├── sentiment_server.py         # Python / Flask backend (NLP classifier, stakeholder API)
│
├── db_schema.sql               # PostgreSQL + PostGIS database schema and spatial queries
├── sample_sentiment_data.json  # Mock sentiment data (used when DB is offline)
│
├── package.json                # Node.js dependencies (create with npm init)
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

---

## Prerequisites

Before running this project locally you need the following installed:

### 1. Node.js (≥18.x)
Download from [nodejs.org](https://nodejs.org). Verify installation:
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
```

### 2. Python (≥3.9)
Download from [python.org](https://python.org) or use Anaconda. Verify:
```bash
python --version    # Should show 3.9 or higher
pip --version
```

### 3. PostgreSQL + PostGIS (optional for full functionality)
- PostgreSQL ≥14: [postgresql.org/download](https://www.postgresql.org/download)
- PostGIS ≥3.3: [postgis.net/install](https://postgis.net/install)

> **Skip this for mock mode.** Both servers detect a missing database and fall back to mock data automatically. The map, charts, and NLP classifier all work without a database.

### 4. Git
```bash
git --version
```

---

## Local setup — step by step

Follow these steps exactly in order.

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/bhavyas17/Electoral-Intelligence-Dashboard.git
cd vikvox-kitchen
```

---

### Step 2 — Install Node.js dependencies

Create a `package.json` if one does not exist, then install:

```bash
# If package.json does not exist yet:
npm init -y

# Install required packages:
npm install express cors pg

# Verify node_modules was created:
ls node_modules | grep express
```

---

### Step 3 — Install Python dependencies

#### Option A — Using Anaconda Navigator (recommended for Windows)

1. Open **Anaconda Navigator**
2. Click **CMD.exe Prompt** (Windows) or **Terminal** (Mac/Linux)
3. Confirm you see `(base)` at the start of the prompt
4. Navigate to the project folder:
   ```bash
   cd C:\Users\YourName\Desktop\vikvox-kitchen
   ```
5. Install dependencies:
   ```bash
   pip install flask flask-cors requests
   ```

#### Option B — Using standard terminal

```bash
pip install flask flask-cors requests
```

Create a `requirements.txt` for others:
```bash
pip freeze > requirements.txt
```

Or create it manually:
```
flask>=3.0
flask-cors>=4.0
requests>=2.31
```

---

### Step 4 — Set up environment variables (optional)

Create a `.env` file in the project root for optional integrations:

```bash
# .env

# PostgreSQL connection string (optional — mock mode works without this)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/vikvox_campaign

# Gemini API key for live NLP sentiment classification (optional)
# Get a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

> If `GEMINI_API_KEY` is not set, the Python server automatically uses the local rule-based keyword classifier. All features work.

---

### Step 5 — Set up the database (optional)

Skip this step entirely if you want to run in mock mode.

#### 5a — Create the database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql:
CREATE DATABASE vikvox_campaign;
\c vikvox_campaign
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

#### 5b — Run the schema

```bash
psql -U postgres -d vikvox_campaign -f db_schema.sql
```

This creates five tables:
- `districts` — district boundary polygons
- `precincts` — precinct boundary polygons with turnout and margin data
- `voters` — voter file records with geocoded household coordinates
- `crm_contacts` — constituent contact records tagged by issue
- `canvassing_logs` — NGP VAN canvassing results

#### 5c — Load sample data (optional)

The servers include built-in mock fallback data. If you want to load real or test data into the database, insert records into the tables following the schema in `db_schema.sql`.

---

### Step 6 — Start the Node.js server

Open a terminal window and run:

```bash
node server.js
```

You should see:
```
================================================================
 Listening on PORT: 8080
 Server URL: http://localhost:8080
================================================================
[Database] WARNING: Could not connect to real PostgreSQL/PostGIS...
[Database] Server will operate in MOCK MODE for developmental sandbox testing.
```

The database warning is normal if you skipped Step 5. The server continues in mock mode.

---

### Step 7 — Start the Python Flask server

Open a **second** terminal window (keep the Node.js server running in the first) and run:

```bash
python sentiment_server.py
```

You should see:
```
 * Running on http://0.0.0.0:5001
 * Debug mode: on
```

---

### Step 8 — Open the dashboard

Open any browser and navigate to:

```
http://localhost:8080
```

The Node.js server serves `index.html` as the entry point. All HTML pages are served from the same server.

To navigate between modules, either use the header buttons in `index.html` or open these URLs directly:

| Module | URL |
|--------|-----|
| Module 1 — Constituency overview | `http://localhost:8080/index.html` |
| Module 5 — Stakeholder intelligence | `http://localhost:8080/people.html` |
| Module 6 — Electoral arithmetic | `http://localhost:8080/electoral.html` |
| Module 7 — Evidence library | `http://localhost:8080/comparison.html` |
| Module 8 — Campaign intelligence | `http://localhost:8080/intelligence.html` |

---

### Step 9 — Verify everything is working

Check these four things:

1. **Map loads** — You should see a dark-themed Leaflet map centred on Naperville / District 21 with coloured precinct polygons visible.

2. **Overlays work** — Click the overlay toggle buttons (Voter Turnout, Vote Margin, Issue Density) and the map colours should change.

3. **NLP classifier works** — On the main dashboard, scroll to the Sentiment Analysis panel, paste any text into the textarea, and click "Run NLP Sentiment Classification". A JSON result should appear within 2 seconds.

4. **Walk list works** — Click the "Draw Zone" button on the map, draw a rectangle on the map, and a walk list panel should appear with mock voter records.

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `postgresql://postgres:postgres@localhost:5432/vikvox_campaign` | PostgreSQL connection string |
| `GEMINI_API_KEY` | No | None | Google Gemini 2.5 Flash API key for live NLP classification |
| `PORT` | No | `8080` | Node.js server port |

---

## Database setup (PostGIS)

### Schema overview

```sql
-- Five core tables, all with spatial geometry columns

districts        -- District boundary (MultiPolygon)
  └── precincts  -- Precinct boundaries (MultiPolygon)
       └── voters -- Individual voter points (Point)
            └── canvassing_logs -- Contact results per voter (Point)

crm_contacts     -- Constituent contacts geocoded to a Point
```

### Key spatial queries

The system uses three core PostGIS operations:

**1. Voter-to-precinct assignment** — runs on data load to populate `precinct_code` on each voter record:
```sql
UPDATE voters v
SET precinct_code = p.precinct_code
FROM precincts p
WHERE ST_Contains(p.geom, v.geom)
  AND v.precinct_code IS NULL;
```

**2. Walk list extraction** — runs when a user draws a polygon on the map:
```sql
SELECT id, concat(last_name, ', ', first_name), street_address,
       ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
       estimated_party_lean, persuadability_score
FROM voters
WHERE ST_Contains(ST_GeomFromText(:drawn_polygon_wkt, 4326), geom)
ORDER BY persuadability_score DESC;
```

**3. Canvassing coverage per precinct** — runs to colour the canvassing overlay:
```sql
SELECT p.precinct_code, p.name,
       count(DISTINCT cl.voter_id) AS voters_canvassed,
       round(count(DISTINCT cl.voter_id)::NUMERIC / p.registered_voters * 100, 2) AS coverage_pct
FROM precincts p
LEFT JOIN voters v ON ST_Contains(p.geom, v.geom)
LEFT JOIN canvassing_logs cl ON cl.voter_id = v.id
WHERE p.district_code = 'SD21'
GROUP BY p.id, p.precinct_code, p.name, p.registered_voters;
```

### GIST spatial indexes

All geometry columns have GIST indexes for fast spatial queries:
```sql
CREATE INDEX idx_districts_geom   ON districts       USING GIST (geom);
CREATE INDEX idx_precincts_geom   ON precincts        USING GIST (geom);
CREATE INDEX idx_voters_geom      ON voters           USING GIST (geom);
CREATE INDEX idx_crm_geom         ON crm_contacts     USING GIST (geom);
CREATE INDEX idx_canvassing_geom  ON canvassing_logs  USING GIST (geom);
```

Without these indexes, `ST_Contains` on 180,000 voter points takes ~45 seconds. With them it runs in under 1ms.

---

## Running the servers

### Both servers must run simultaneously

The frontend calls both servers at the same time:
- Port 8080 (Node.js) — map data, walk list, CRM density
- Port 8081 (Python) — NLP classifier, stakeholder graph, compliance alerts

### Starting both with one command (optional)

Install `concurrently`:
```bash
npm install -g concurrently
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "start:node": "node server.js",
    "start:python": "python sentiment_server.py",
    "start": "concurrently \"npm run start:node\" \"npm run start:python\""
  }
}
```

Then start both with:
```bash
npm start
```

### Stopping the servers

In each terminal window press `Ctrl + C`.

---

## API reference

### Node.js server — PORT 8080

#### `GET /api/precincts`
Returns a GeoJSON FeatureCollection of all precincts in District 21 with turnout, margin, and demographic properties.

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [...] },
      "properties": {
        "id": "P01",
        "name": "Naperville Ward 1 - PCT 12",
        "registered_voters": 3450,
        "turnout_2022": 67.8,
        "vote_margin_2022": 4.8,
        "is_swing": true,
        "demographics": "High Income / Families"
      }
    }
  ]
}
```

#### `POST /api/walklist`
Accepts a drawn GeoJSON polygon and returns voters inside that boundary sorted by persuadability score.

**Request body:**
```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[-88.20, 41.78], [-88.15, 41.78], ...]]
  }
}
```

**Response:**
```json
{
  "source": "PostGIS Spatial ST_Contains Query",
  "count": 47,
  "voters": [
    {
      "voter_id": "V-001",
      "full_name": "Johnson, Mary",
      "street_address": "456 Washington St",
      "latitude": 41.79,
      "longitude": -88.18,
      "estimated_party_lean": "I",
      "persuadability_score": 72.8
    }
  ]
}
```

#### `GET /api/crm-density`
Returns geocoded constituent contact points for issue heat map overlay.

**Response:**
```json
[
  { "latitude": 41.78, "longitude": -88.19, "issue_category": "Healthcare" },
  { "latitude": 41.79, "longitude": -88.18, "issue_category": "Property Taxes" }
]
```

---

### Python server — PORT 5001

#### `POST /api/sentiment/classify`
Classifies a constituent text using Gemini 2.5 Flash API or local fallback classifier.

**Request body:**
```json
{ "text": "I cannot afford my prescription medications on a fixed income." }
```

**Response:**
```json
{
  "sentiment": -0.75,
  "primary_issue": "healthcare",
  "secondary_issues": ["economy"],
  "urgency": "high",
  "engine": "Gemini 2.5 API"
}
```

#### `GET /api/sentiment/data`
Returns pre-computed rolling sentiment scores and active alerts.

**Response:**
```json
{
  "rolling_scores": {
    "healthcare": 0.32,
    "taxes": -0.65,
    "education": 0.25
  },
  "alerts": [
    { "type": "red", "text": "Negative viral thread regarding property tax assessments (+3.4 SD)" }
  ]
}
```

#### `GET /api/people/stakeholders`
Returns the stakeholder network graph data for D3.js force-directed rendering.

**Response:**
```json
{
  "nodes": [
    { "id": "IL AFL-CIO", "role": "Union", "group": 1, "influence": 9, "alignment": "aligned" }
  ],
  "links": [
    { "source": "Senator", "target": "IL AFL-CIO" }
  ]
}
```

#### `GET /api/people/compliance`
Returns active donor compliance flags.

**Response:**
```json
[
  { "name": "Richard DeVos", "amount": "$5,900", "badge": "LIMIT EXCEEDED", "badgeClass": "limit-met" },
  { "name": "Sinopec Energy Ltd", "amount": "$12,000", "badge": "PROHIBITED FOREIGN", "badgeClass": "prohibited" }
]
```

---

## Mock mode

Both servers are designed to work without a live database or external API keys. This makes local development and demos possible with zero infrastructure.

### How mock mode works

**Node.js server:** If the PostgreSQL connection fails on startup, all API routes return hardcoded mock GeoJSON and voter data. The map fully renders with mock precinct polygons, mock walk list data, and mock CRM density points.

**Python server:** If `GEMINI_API_KEY` is not set, the `/api/sentiment/classify` endpoint runs a local keyword-based rule classifier instead of calling the Gemini API. The classifier checks for healthcare, tax, education, infrastructure, and public safety keywords and returns appropriate sentiment scores and urgency levels.

**Sample data file:** `sample_sentiment_data.json` provides the baseline rolling sentiment scores and alert data that the dashboard uses on load. Edit this file to change the mock sentiment state.

### To force mock mode regardless of environment

Remove or rename `DATABASE_URL` from your environment. The Node.js server logs:
```
[Database] Server will operate in MOCK MODE for developmental sandbox testing.
```

---

## Data sources

In a production deployment, the platform integrates with these real data sources:

| Source | Data type | Integration method |
|--------|-----------|-------------------|
| Illinois State Board of Elections (ILSBE) | Voter rolls, precinct boundaries, election results | Weekly batch file download → ETL → PostgreSQL |
| US Census Bureau ACS 5-year | Demographics by ZIP and tract | Annual batch download → BigQuery |
| NGP VAN MiniVAN API | Canvassing contacts, supporter IDs | Live API → `canvassing_logs` table |
| FEC public data API | Federal campaign finance filings | Daily API pull → compliance check |
| ILSBE campaign finance portal | State contribution records | Periodic file download → ETL |
| Meltwater / Cision | Media monitoring | API → sentiment pipeline |
| Twitter/X API v2 | Social media mentions | OAuth2 → sentiment pipeline |
| Facebook Graph API | Public page mentions | OAuth2 → sentiment pipeline |
| Google Gemini 2.5 Flash | NLP classification | REST API → `sentiment_server.py` |
| Census TIGER/Line shapefiles | Precinct and municipal boundaries | Annual file download → PostGIS |

For development and demo purposes, all of these are replaced by the mock data described in the [Mock mode](#mock-mode) section above.

---

## Troubleshooting

### "Site cannot be reached" in browser
1. Confirm the Node.js server is running — check the terminal for `Listening on PORT: 8080`
2. Make sure you typed `http://localhost:8080` not `https://localhost:8080`
3. Do not close the terminal running `node server.js`
4. If port 8080 is taken, change `const PORT = 8081` in `server.js` and visit `http://localhost:5001`

### NLP classifier returns error
1. Check the Python server is running on port 5001
2. If you set `GEMINI_API_KEY`, verify it is valid at [aistudio.google.com](https://aistudio.google.com)
3. Without an API key the local fallback classifier runs automatically — this is expected behaviour

### Map shows but precincts do not appear
1. Open browser developer tools (F12) → Console tab
2. Look for network errors on `/api/precincts`
3. Confirm the Node.js server is running — it serves the precinct GeoJSON
4. If the database is offline, mock precincts load automatically from the fallback data in `server.js`

### PostGIS install issues on Windows
Use the PostGIS bundle installer from [postgis.net](https://postgis.net/windows_downloads) which includes the correct PostgreSQL version. Run `CREATE EXTENSION postgis;` inside psql after connecting to your database.

### Python `ModuleNotFoundError`
You are in the wrong Python environment or packages were not installed. Run:
```bash
pip install flask flask-cors requests
```
On Anaconda, ensure you opened the Anaconda Prompt (not the Windows system terminal) so you are in the `(base)` environment.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add walk list CSV export"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Code conventions
- JavaScript: vanilla ES6+, no build step required
- Python: PEP 8, type hints on new functions
- SQL: uppercase keywords, snake_case identifiers
- All new API routes must include a mock fallback response

---*
