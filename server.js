// Node.js Backend Server for VikVox Campaign Platform - Module 1 (Constituency Overview)
// Tech Stack: Node.js, Express, pg (PostgreSQL Client with PostGIS support)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing of JSON payloads
app.use(cors());
app.use(express.json());

// Serve frontend static assets out-of-the-box
app.use(express.static(path.join(__dirname, './')));

// --- PostgreSQL Pool Setup (PostGIS Target) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vikvox_campaign',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.query('SELECT postgis_version();')
  .then(res => console.log(`[Database] Connected to PostgreSQL with PostGIS: ${res.rows[0].postgis_version}`))
  .catch(err => {
    console.warn(`[Database] WARNING: Could not connect to real PostgreSQL/PostGIS: ${err.message}`);
    console.warn(`[Database] Server will operate in MOCK MODE for developmental sandbox testing.`);
  });

// --- Helper: Convert GeoJSON Polygon to WKT (Well-Known Text) ---
function geojsonToWkt(geojsonGeometry) {
  if (!geojsonGeometry || geojsonGeometry.type !== 'Polygon') {
    throw new Error('Invalid GeoJSON geometry. Must be a Polygon.');
  }
  const coords = geojsonGeometry.coordinates[0];
  const wktCoords = coords.map(p => `${p[0]} ${p[1]}`).join(', ');
  return `POLYGON((${wktCoords}))`;
}

// =============================================================
// API ROUTE HANDLERS
// =============================================================

/**
 * 1. GET /api/precincts
 * Fetches geoJSON features of all precincts styled with turnout and vote margins
 */
app.get('/api/precincts', async (req, res) => {
  const query = `
    SELECT jsonb_build_object(
      'type',     'FeatureCollection',
      'features', jsonb_agg(features.feature)
    ) AS geojson
    FROM (
      SELECT jsonb_build_object(
        'type',       'Feature',
        'id',         id,
        'geometry',   ST_AsGeoJSON(geom)::jsonb,
        'properties', json_build_object(
          'id', precinct_code,
          'name', name,
          'registered_voters', registered_voters,
          'turnout_2022', turnout_2022,
          'vote_margin_2022', vote_margin_2022,
          'is_swing', is_swing_precinct,
          'demographics', dominant_demographic
        )
      ) AS feature
      FROM precincts
      WHERE district_code = 'SD21'
    ) features;
  `;

  try {
    const dbRes = await pool.query(query);
    if (dbRes.rows[0] && dbRes.rows[0].geojson) {
      return res.json(dbRes.rows[0].geojson);
    }
    throw new Error("No data returned from DB");
  } catch (err) {
    console.log(`[API] Fetching mock precincts fallback (DB disconnected/offline)`);
    
    // Fallback Mock GeoJSON Response
    const mockGeojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 1,
          geometry: {
            type: "Polygon",
            coordinates: [[[-88.22, 41.81], [-88.17, 41.81], [-88.17, 41.77], [-88.22, 41.77], [-88.22, 41.81]]]
          },
          properties: {
            id: "P01",
            name: "Naperville Ward 1 - PCT 12",
            registered_voters: 3450,
            turnout_2022: 67.8,
            vote_margin_2022: 4.8,
            is_swing: true,
            demographics: "High Income / Families"
          }
        },
        {
          type: "Feature",
          id: 2,
          geometry: {
            type: "Polygon",
            coordinates: [[[-88.17, 41.81], [-88.12, 41.81], [-88.12, 41.77], [-88.17, 41.77], [-88.17, 41.81]]]
          },
          properties: {
            id: "P02",
            name: "Naperville Ward 1 - PCT 15",
            registered_voters: 4120,
            turnout_2022: 71.2,
            vote_margin_2022: 12.4,
            is_swing: false,
            demographics: "Suburban Families / Tech Professionals"
          }
        }
      ]
    };
    res.json(mockGeojson);
  }
});

/**
 * 2. POST /api/walklist
 * Receives a drawn polygon (GeoJSON format), runs a PostGIS ST_Contains query,
 * and extracts the list of matching voters inside the shape for walk list exports.
 */
app.post('/api/walklist', async (req, res) => {
  const { geometry } = req.body;
  
  if (!geometry) {
    return res.status(400).json({ error: "Missing 'geometry' parameter in request body." });
  }

  try {
    // Convert GeoJSON geometry to WKT
    const wktPolygon = geojsonToWkt(geometry);
    
    // Query using PostGIS spatial ST_Contains check
    const query = `
      SELECT 
        id AS voter_id,
        concat(last_name, ', ', first_name) AS full_name,
        street_address,
        ST_Y(geom) AS latitude,
        ST_X(geom) AS longitude,
        estimated_party_lean,
        persuadability_score
      FROM voters
      WHERE ST_Contains(ST_GeomFromText($1, 4326), geom)
      ORDER BY persuadability_score DESC;
    `;

    const dbRes = await pool.query(query, [wktPolygon]);
    res.json({
      source: "PostGIS Spatial ST_Contains Query",
      count: dbRes.rows.length,
      voters: dbRes.rows
    });

  } catch (err) {
    console.log(`[API] Processing mock walk list extraction fallback (DB disconnected/offline)`);
    
    // Simulate frontend PIP selection logic or return list of mock selected voters
    res.json({
      source: "Mock Fallback Engine",
      count: 3,
      voters: [
        { voter_id: "V-MOCK-1", full_name: "Smith, James", street_address: "123 Aurora Ave", latitude: 41.78, longitude: -88.19, estimated_party_lean: "D", persuadability_score: 24.5 },
        { voter_id: "V-MOCK-2", full_name: "Johnson, Mary", street_address: "456 Washington St", latitude: 41.79, longitude: -88.18, estimated_party_lean: "I", persuadability_score: 72.8 },
        { voter_id: "V-MOCK-3", full_name: "Williams, John", street_address: "789 Mill St", latitude: 41.78, longitude: -88.19, estimated_party_lean: "R", persuadability_score: 12.0 }
      ]
    });
  }
});

/**
 * 3. GET /api/crm-density
 * Fetches constituent issue coordinates to render issue heat maps
 */
app.get('/api/crm-density', async (req, res) => {
  const query = `
    SELECT 
      ST_Y(geom) AS latitude, 
      ST_X(geom) AS longitude, 
      issue_category 
    FROM crm_contacts;
  `;

  try {
    const dbRes = await pool.query(query);
    res.json(dbRes.rows);
  } catch (err) {
    console.log(`[API] Resolving mock CRM issue densities`);
    res.json([
      { latitude: 41.78, longitude: -88.19, issue_category: "Healthcare" },
      { latitude: 41.79, longitude: -88.18, issue_category: "Healthcare" },
      { latitude: 41.78, longitude: -88.15, issue_category: "Property Taxes" }
    ]);
  }
});

// Wildcard default route for HTML Page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Run server listener
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` VikVox Campaign Platform - Module 1 Active`);
  console.log(` Listening on PORT: ${PORT}`);
  console.log(` Server URL: http://localhost:${PORT}`);
  console.log(`================================================================`);
});
