# VikVox Kitchen: Campaign Platform - Module 1 (Constituency Overview)

An honors-quality, highly interactive legislative campaign dashboard built for **Illinois Senatorial District 21** operations. This module provides a single-pane-of-glass overview of constituency statistics, turnout projections, vote margins, issue density heat maps, and a walk list generator drawing workbench.

---

## 🏗️ Architectural Overview & Design Pattern

The system implements a clean separation of concerns:
1. **Frontend Presentation (`index.html`, `app.css`, `app.js`)**: 
   - Translucent glassmorphism dark theme designed with vanilla CSS variables and custom responsive grids.
   - GIS map interface using Leaflet.js, supporting multi-level drilldowns.
   - Canvas-based chart data visualization utilizing Chart.js.
   - Point-In-Polygon (PIP) ray-casting search algorithm written in vanilla JavaScript for instant offline boundary walk list extracts.
2. **Database Integration Schema (`db_schema.sql`)**: 
   - Target database: PostgreSQL + PostGIS.
   - Defines physical table models for legislative boundaries, precincts, registered voter files (ILSBE), canvassing records (NGP VAN), and constituent CRM interactions.
   - Utilizes GIST spatial indexes for sub-millisecond bounding container queries.
3. **Backend Middleware API (`server.js`)**: 
   - Built on Node.js/Express.
   - Restful endpoints fetching precinct polygons, checking spatial parameters using `ST_Contains` (translating GeoJSON coordinates to Well-Known Text), and returning structured dataset results.
   - Built-in sandboxed mock engine fallback if database connection parameters are absent.

---

## 📂 Codebase Directory Structure

```text
VikVox Kitchen/
├── index.html       # Primary UI dashboard grid structure & static CDN imports
├── app.css          # Glassmorphic dark styling design variables & animation tokens
├── app.js           # Leaflet layers, toolbars, chart controls, and PIP ray-cast engine
├── db_schema.sql    # PostGIS table definitions, spatial indices, and aggregates
├── server.js        # Node.js/Express REST server and SQL query controller
└── README.md        # Comprehensive technical documentation & run instructions
```

---

## 🗺️ Multi-Level Drilldowns (Levels 1 - 4)

- **Level 1: State View (Zoom < 9)**: Centered on Illinois state bounds. Displays aggregated state context counters.
- **Level 2: District View (Zoom 9-11)**: Zooms in to DuPage/Will county District 21 boundaries. Displays combined district metrics.
- **Level 3: Precinct View (Zoom 12-15)**: Renders precinct boundary polygons. Toggles 5 distinct overlays:
  1. *Turnout*: Scales polygons Red to Green based on 2022 voter turnout rates.
  2. *Vote Margin*: Flags base mobilization areas vs persuasion targets, highlighting swing precincts in Amber.
  3. *Issue Density*: Overlays a heat map showing the density of constituent CRM contacts.
  4. *Canvassing Coverage*: Color-codes precincts by NGP VAN canvassing percentages.
  5. *Demographics*: Maps dominant socio-economic profiling categories.
- **Level 4: Household View (Zoom >= 16)**: Reveals individual household voter dots color-coded by estimated party lean (Blue: Democrat, Red: Republican, Yellow: Independent).
  - *Walk List Drawing Control*: Activates drawing controls allowing users to outline custom boundaries around household clusters.
  - *PIP Filter Engine*: The system extracts voters residing inside the shape, previews name details in the sidebar panel, and compiles a downloadable CSV walk file containing coordinates, address details, and estimate leans.

---

## 🗄️ Database Setup (PostgreSQL + PostGIS)

To mount the database architecture and test spatial indexes:

1. **Install PostgreSQL and PostGIS**:
   ```bash
   # On macOS using Homebrew
   brew install postgresql postgis
   ```
2. **Create the Database**:
   ```sql
   CREATE DATABASE vikvox_campaign;
   \c vikvox_campaign;
   ```
3. **Run the Database Schema**:
   ```bash
   psql -d vikvox_campaign -f db_schema.sql
   ```

---

## 🚀 Running the Project

### Option A: Local Sandbox Mode (No Node.js/DB dependencies required)
Since the frontend has built-in mockup generators, you can run a local HTTP server using Python:

```bash
# In the project directory, spin up a Python web server
python3 -m http.server 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option B: Node.js Express Mode
1. Install Express and PostgreSQL packages:
   ```bash
   npm install express cors pg
   ```
2. Run the server:
   ```bash
   node server.js
   ```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.
# Electoral-Intelligence-Dashboard
# Electoral-Intelligence-Dashboard
