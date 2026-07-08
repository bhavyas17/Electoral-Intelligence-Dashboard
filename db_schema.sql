-- PostGIS database schema for Electoral Intelligence Dashboard - Module 1 (Constituency Overview)
-- Target Database: PostgreSQL with PostGIS extension enabled

-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- -------------------------------------------------------------
-- 1. DISTRICTS BOUNDARY SCHEMA
-- -------------------------------------------------------------
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    district_code VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'SD21'
    chamber VARCHAR(20) NOT NULL,            -- e.g., 'Senate'
    senator_name VARCHAR(100),                -- e.g., 'Laura Ellman'
    geom GEOMETRY(MultiPolygon, 4326),        -- MultiPolygon boundary SRID 4326 (WGS 84)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on District boundaries
CREATE INDEX idx_districts_geom ON districts USING GIST (geom);

-- -------------------------------------------------------------
-- 2. PRECINCTS SCHEMA
-- -------------------------------------------------------------
CREATE TABLE precincts (
    id SERIAL PRIMARY KEY,
    precinct_code VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'NP-12' (Naperville PCT 12)
    name VARCHAR(150) NOT NULL,
    district_code VARCHAR(10) REFERENCES districts(district_code) ON DELETE CASCADE,
    geom GEOMETRY(MultiPolygon, 4326),          -- Precinct boundary SRID 4326
    registered_voters INT DEFAULT 0,
    turnout_2022 NUMERIC(5,2),                  -- Percentage e.g., 67.80
    vote_margin_2022 NUMERIC(5,2),              -- Percentage lean: D is positive, R is negative
    is_swing_precinct BOOLEAN DEFAULT FALSE,
    dominant_demographic VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on Precinct boundaries
CREATE INDEX idx_precincts_geom ON precincts USING GIST (geom);

-- -------------------------------------------------------------
-- 3. VOTERS SCHEMA (ILSBE Voter File Integration)
-- -------------------------------------------------------------
CREATE TABLE voters (
    id VARCHAR(50) PRIMARY KEY,                -- State voter registration ID (ILSBE ID)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    geom GEOMETRY(Point, 4326),                 -- Geo-coded household coordinates (lat/lng point)
    estimated_party_lean CHAR(1),               -- 'D' (Democrat), 'R' (Republican), 'I' (Independent)
    persuadability_score NUMERIC(5,2),          -- Estimate percentage of persuasion potential
    precinct_code VARCHAR(20) REFERENCES precincts(precinct_code),
    last_voted_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on Voter point coordinates
CREATE INDEX idx_voters_geom ON voters USING GIST (geom);
-- Standard B-Tree index on Estimated Party Lean and Precinct mappings
CREATE INDEX idx_voters_party ON voters(estimated_party_lean);
CREATE INDEX idx_voters_precinct ON voters(precinct_code);

-- -------------------------------------------------------------
-- 4. CRM CONTACTS (Constituent Interactions / Issue Density)
-- -------------------------------------------------------------
CREATE TABLE crm_contacts (
    id SERIAL PRIMARY KEY,
    voter_id VARCHAR(50) REFERENCES voters(id) ON DELETE SET NULL,
    issue_category VARCHAR(100) NOT NULL,       -- e.g., 'Healthcare', 'Property Taxes', 'Climate'
    notes TEXT,
    contact_date DATE DEFAULT CURRENT_DATE,
    geom GEOMETRY(Point, 4326)                  -- Lat/lng coordinates of the issue contact location
);

-- Spatial index on CRM contact locations
CREATE INDEX idx_crm_geom ON crm_contacts USING GIST (geom);

-- -------------------------------------------------------------
-- 5. CANVASSING LOGS (NGP VAN Integration)
-- -------------------------------------------------------------
CREATE TABLE canvassing_logs (
    id SERIAL PRIMARY KEY,
    voter_id VARCHAR(50) REFERENCES voters(id) ON DELETE CASCADE,
    canvassed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    contact_method VARCHAR(50) NOT NULL,        -- 'Walk', 'Phone', 'Text'
    is_reached BOOLEAN DEFAULT FALSE,
    lean_verified CHAR(1),                      -- ID'd party affiliation
    geom GEOMETRY(Point, 4326)                  -- Geo-point where canvassing interaction was logged
);

-- Spatial index on canvassing interaction points
CREATE INDEX idx_canvassing_geom ON canvassing_logs USING GIST (geom);


-- =============================================================
-- GEOSPATIAL POSTGIS QUERIES & UTILITIES
-- =============================================================

-- QUERY A: Resolve Voter Coordinates to Precincts (Spatial Join on Insert/Update)
-- Demonstrates updating the voter file table dynamically mapping voter points to precinct polygons
UPDATE voters v
SET precinct_code = p.precinct_code
FROM precincts p
WHERE ST_Contains(p.geom, v.geom)
  AND v.precinct_code IS NULL;


-- QUERY B: Fetch Voters Within a User-Drawn Polygon (Level 4 Walk List Extraction)
-- This is the core spatial query that maps the drawn geoJSON shape from the frontend to the database
-- Parameter :drawn_polygon_wkt is the Well-Known Text (WKT) string from the drawn shape (e.g. POLYGON((...)))
-- EXPLAIN ANALYZE SELECT ... (to verify indexing efficiency)
SELECT 
    id AS voter_id,
    concat(last_name, ', ', first_name) AS full_name,
    street_address,
    ST_Y(geom) AS latitude,
    ST_X(geom) AS longitude,
    estimated_party_lean,
    persuadability_score
FROM voters
WHERE ST_Contains(
    ST_GeomFromText('POLYGON((-88.20 41.78, -88.15 41.78, -88.15 41.75, -88.20 41.75, -88.20 41.78))', 4326), 
    geom
)
ORDER BY persuadability_score DESC;


-- QUERY C: Calculate Aggregated Canvassing Coverage per Precinct
-- Performs a spatial join to calculate the percentage of registered voters canvassed in each precinct boundary
SELECT 
    p.precinct_code,
    p.name,
    p.registered_voters,
    count(DISTINCT cl.voter_id) AS voters_canvassed,
    round((count(DISTINCT cl.voter_id)::NUMERIC / NULLIF(p.registered_voters, 0) * 100), 2) AS canvass_coverage_percent
FROM precincts p
LEFT JOIN voters v ON ST_Contains(p.geom, v.geom)
LEFT JOIN canvassing_logs cl ON cl.voter_id = v.id
WHERE p.district_code = 'SD21'
GROUP BY p.id, p.precinct_code, p.name, p.registered_voters
ORDER BY canvass_coverage_percent DESC;


-- QUERY D: Issue Category Density Breakdown by Precinct (CRM Integration)
-- Resolves the counts of top concerns per precinct polygon to feed into the Issue Density overlay
WITH precinct_issues AS (
    SELECT 
        p.precinct_code,
        c.issue_category,
        count(*) as contact_count,
        ROW_NUMBER() OVER (PARTITION BY p.precinct_code ORDER BY count(*) DESC) as rank
    FROM precincts p
    JOIN crm_contacts c ON ST_Contains(p.geom, c.geom)
    GROUP BY p.precinct_code, c.issue_category
)
SELECT 
    precinct_code,
    issue_category AS dominant_issue,
    contact_count AS report_count
FROM precinct_issues
WHERE rank = 1;
