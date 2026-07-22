// Electoral Intelligence Dashboard - Module 1 (Constituency Overview) Map Logic

// --- Global Variables & Leaflet Setup ---
let map;
let baseTileLayer;
let districtBoundaryLayer;
let precinctPolygonsLayer;
let householdDotsLayer = L.layerGroup();
let heatmapLayer;
let drawControl;
let drawnItems = new L.FeatureGroup();

let activeOverlay = 'turnout'; // 'turnout', 'margin', 'density', 'canvass', 'demographics'
let activeDrilldownLevel = 1; // 1: State, 2: District, 3: Precinct, 4: Household
let partyChart = null;
let peopleDonorChartInstance = null;
let activeDistrictCode = 'sd-21'; // Track active selected district code for dynamic naming

// Bounding Center for Illinois State
const ILLINOIS_CENTER = [40.0, -89.0];
const ILLINOIS_ZOOM = 7;

// Bounding Center for District 21 (Naperville/Lisle, IL)
const DISTRICT_CENTER = [41.77, -88.15];
const DISTRICT_ZOOM = 12;

// Bounding Centers for filterable regions
const DISTRICT_CENTERS = {
  'sd-21': [41.77, -88.15],
  'sd-22': [42.03, -88.28], // Elgin area
  'sd-41': [41.69, -88.11], // Bolingbrook/Naperville South
  'sd-42': [41.76, -88.31]  // Aurora/Batavia
};
let currentDistrictCenter = [...DISTRICT_CENTERS['sd-21']];

// --- Mock Data Generation ---

// Generate district boundary coordinates
const DISTRICT_BOUNDS_COORDS = [
  [41.84, -88.25],
  [41.84, -88.05],
  [41.70, -88.05],
  [41.70, -88.25],
  [41.84, -88.25]
];

// Mock Precinct Polygons (Naperville/Lisle area)
const PRECINCTS_DATA = [
  {
    id: "P01",
    name: "Naperville Ward 1 - PCT 12",
    bounds: [[41.81, -88.22], [41.81, -88.17], [41.77, -88.17], [41.77, -88.22], [41.81, -88.22]],
    stats: {
      voters: 3450,
      turnout2022: 67.8,
      margin2022: 4.8, // Swing (D+4.8)
      marginType: 'democrat',
      topIssue: "Healthcare & Senior Care",
      canvassCoverage: 62.4,
      demographics: "High Income / Families",
      dominantAge: "45-64",
      leanD: 51, leanR: 41, leanI: 8,
      isSwing: true
    }
  },
  {
    id: "P02",
    name: "Naperville Ward 1 - PCT 15",
    bounds: [[41.81, -88.17], [41.81, -88.12], [41.77, -88.12], [41.77, -88.17], [41.81, -88.17]],
    stats: {
      voters: 4120,
      turnout2022: 71.2,
      margin2022: 12.4, // Solid D
      marginType: 'democrat',
      topIssue: "Education Funding",
      canvassCoverage: 51.8,
      demographics: "Suburban Families / Tech Professionals",
      dominantAge: "35-50",
      leanD: 54, leanR: 36, leanI: 10,
      isSwing: false
    }
  },
  {
    id: "P03",
    name: "Lisle PCT 4",
    bounds: [[41.81, -88.12], [41.81, -88.07], [41.77, -88.07], [41.77, -88.12], [41.81, -88.12]],
    stats: {
      voters: 2890,
      turnout2022: 58.4,
      margin2022: -1.2, // Swing (R+1.2)
      marginType: 'republican',
      topIssue: "Property Taxes & Infrastructure",
      canvassCoverage: 34.2,
      demographics: "Mixed Suburban / Middle Class",
      dominantAge: "50-65",
      leanD: 46, leanR: 48, leanI: 6,
      isSwing: true
    }
  },
  {
    id: "P04",
    name: "Warrenville PCT 2",
    bounds: [[41.84, -88.22], [41.84, -88.17], [41.81, -88.17], [41.81, -88.22], [41.84, -88.22]],
    stats: {
      voters: 3900,
      turnout2022: 52.1,
      margin2022: 3.1, // Swing (D+3.1)
      marginType: 'democrat',
      topIssue: "Jobs & Clean Energy",
      canvassCoverage: 28.9,
      demographics: "Working Class / Diverse Profile",
      dominantAge: "25-40",
      leanD: 49, leanR: 44, leanI: 7,
      isSwing: true
    }
  },
  {
    id: "P05",
    name: "Lisle PCT 8",
    bounds: [[41.77, -88.12], [41.77, -88.07], [41.73, -88.07], [41.73, -88.12], [41.77, -88.12]],
    stats: {
      voters: 3100,
      turnout2022: 63.5,
      margin2022: -8.4, // Solid R
      marginType: 'republican',
      topIssue: "Inflation & Public Safety",
      canvassCoverage: 41.5,
      demographics: "Older Demographics / Retirees",
      dominantAge: "60+",
      leanD: 41, leanR: 53, leanI: 6,
      isSwing: false
    }
  },
  {
    id: "P06",
    name: "Naperville Ward 2 - PCT 8",
    bounds: [[41.77, -88.17], [41.77, -88.12], [41.73, -88.12], [41.73, -88.17], [41.77, -88.17]],
    stats: {
      voters: 4500,
      turnout2022: 68.2,
      margin2022: 8.9, // Lean D
      marginType: 'democrat',
      topIssue: "Climate Action",
      canvassCoverage: 55.0,
      demographics: "Affluent Professionals / High Degree Holders",
      dominantAge: "30-45",
      leanD: 53, leanR: 39, leanI: 8,
      isSwing: false
    }
  },
  {
    id: "P07",
    name: "Naperville Ward 2 - PCT 19",
    bounds: [[41.77, -88.22], [41.77, -88.17], [41.73, -88.17], [41.73, -88.22], [41.77, -88.22]],
    stats: {
      voters: 2980,
      turnout2022: 60.1,
      margin2022: -3.8, // Swing (R+3.8)
      marginType: 'republican',
      topIssue: "Property Taxes",
      canvassCoverage: 44.2,
      demographics: "Mixed Families / Long-time Residents",
      dominantAge: "45-60",
      leanD: 45, leanR: 49, leanI: 6,
      isSwing: true
    }
  },
  {
    id: "P08",
    name: "Bolingbrook PCT 3",
    bounds: [[41.73, -88.12], [41.73, -88.07], [41.70, -88.07], [41.70, -88.12], [41.73, -88.12]],
    stats: {
      voters: 3670,
      turnout2022: 54.3,
      margin2022: 14.5, // Solid D
      marginType: 'democrat',
      topIssue: "Mental Health Programs",
      canvassCoverage: 31.8,
      demographics: "Highly Diverse / Middle-Income Families",
      dominantAge: "25-38",
      leanD: 59, leanR: 31, leanI: 10,
      isSwing: false
    }
  }
];

// Generate voters details list (household points)
const VOTER_LASTNAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const VOTER_FIRSTNAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const STREETS = ["Washington St", "Aurora Ave", "Ogden Ave", "Lisle Pl", "Warrenville Rd", "Diehl Rd", "Naperville Rd", "Jefferson Ave", "Mill St", "75th St"];

const MOCK_VOTERS = [];
// Generate mock voter points inside the precinct boundaries
PRECINCTS_DATA.forEach(precinct => {
  const [[n, w], [n2, e], [s, e2], [s2, w2]] = precinct.bounds;
  const latMin = Math.min(n, s);
  const latMax = Math.max(n, s);
  const lngMin = Math.min(w, e);
  const lngMax = Math.max(w, e);

  for (let i = 0; i < 20; i++) {
    // Scatter coordinates within the box
    const lat = latMin + Math.random() * (latMax - latMin);
    const lng = lngMin + Math.random() * (lngMax - lngMin);
    
    // Set Estimated Party Lean based on precinct lean
    let lean = 'I';
    const rand = Math.random() * 100;
    if (rand < precinct.stats.leanD) {
      lean = 'D';
    } else if (rand < precinct.stats.leanD + precinct.stats.leanR) {
      lean = 'R';
    }

    const first = VOTER_FIRSTNAMES[Math.floor(Math.random() * VOTER_FIRSTNAMES.length)];
    const last = VOTER_LASTNAMES[Math.floor(Math.random() * VOTER_LASTNAMES.length)];
    const address = `${Math.floor(Math.random() * 2000) + 100} ${STREETS[Math.floor(Math.random() * STREETS.length)]}`;
    const persuadability = Math.floor(Math.random() * 60) + (lean === 'I' ? 30 : 10); // independents are more persuadable

    MOCK_VOTERS.push({
      id: `V-${precinct.id}-${i}`,
      name: `${last}, ${first}`,
      address: address,
      lat: lat,
      lng: lng,
      lean: lean,
      persuadability: persuadability,
      precinctId: precinct.id
    });
  }
});

// Generate CRM Issue contacts for Heatmap Density (lat, lng, weight)
const MOCK_CRM_CONTACTS = MOCK_VOTERS.map(v => {
  return [v.lat, v.lng, Math.random() * 1.5]; // coordinate and weight
});

// --- Page & Map Control Handlers ---

document.addEventListener("DOMContentLoaded", () => {
  // Only initialize map dashboard features if the map element exists
  if (document.getElementById("map")) {
    initMap();
    initChart();
    setupEventListeners();
    updateSidebarGlobal();
    initDemographicsModule();
    initIssuesTrackerModule();
    initSentimentModule();
  }
  
  // Always initialize People Module if its controls or views are present
  if (document.getElementById("btn-people-tracker") || document.getElementById("people-district-btn")) {
    initPeopleModule();
  }

  // Always bind the Electoral Tracker button if present
  const elecBtn = document.getElementById("btn-electoral-tracker");
  if (elecBtn) {
    elecBtn.addEventListener("click", () => {
      window.open("electoral.html", "_blank");
    });
  }

  // Always bind the Comparison Tracker button if present
  const compBtn = document.getElementById("btn-comparison-tracker");
  if (compBtn) {
    compBtn.addEventListener("click", () => {
      window.open("comparison.html", "_blank");
    });
  }

  // Always bind the Intelligence Tracker button if present
  const intelBtn = document.getElementById("btn-intelligence-tracker");
  if (intelBtn) {
    intelBtn.addEventListener("click", () => {
      window.open("intelligence.html", "_blank");
    });
  }
});

function updateDistrictBoundaryLayer() {
  if (map && districtBoundaryLayer && map.hasLayer(districtBoundaryLayer)) {
    map.removeLayer(districtBoundaryLayer);
  }
  
  const latDiff = currentDistrictCenter[0] - DISTRICT_CENTER[0];
  const lngDiff = currentDistrictCenter[1] - DISTRICT_CENTER[1];
  
  const shiftedDistrictCoords = DISTRICT_BOUNDS_COORDS.map(pt => [pt[0] + latDiff, pt[1] + lngDiff]);
  districtBoundaryLayer = L.polygon(shiftedDistrictCoords, {
    color: '#6366f1',
    weight: 3,
    fillColor: 'rgba(99, 102, 241, 0.03)',
    fillOpacity: 0.1,
    dashArray: '5, 8'
  });
  
  if (activeDrilldownLevel === 2 && map) {
    districtBoundaryLayer.addTo(map);
  }
}

// Initialize Leaflet Map
function initMap() {
  map = L.map('map', {
    zoomControl: true,
    minZoom: 6,
    maxZoom: 19
  }).setView(ILLINOIS_CENTER, ILLINOIS_ZOOM);

  // Use light-mode style map tiles (CartoDB Positron - light / white background)
  baseTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // 1. Level 2 District boundary outline
  updateDistrictBoundaryLayer();

  // Add drawn items layer to map
  map.addLayer(drawnItems);

  // Set up L.Control.Draw tools
  drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
      remove: true
    },
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
        drawError: {
          color: '#ef4444',
          message: '<strong>Intersection error!</strong> Polygons cannot overlap.'
        },
        shapeOptions: {
          color: '#6366f1',
          fillColor: 'rgba(99, 102, 241, 0.2)',
          weight: 2
        }
      },
      // Disable other shapes to focus on walk list polygon outlines
      polyline: false,
      circle: false,
      rectangle: false,
      marker: false,
      circlemarker: false
    }
  });

  // Capture when user draws a polygon
  map.on(L.Draw.Event.CREATED, (e) => {
    drawnItems.clearLayers(); // support one active walking list selection at a time
    const layer = e.layer;
    drawnItems.addLayer(layer);
    
    // Execute PIP extraction
    extractVotersInPolygon(layer);
  });

  map.on(L.Draw.Event.DELETED, () => {
    clearWalklistSelection();
  });

  // Watch zoom level to trigger drill-downs
  map.on('zoomend', () => {
    handleZoomDrilldown();
  });

  // Run initial zoom drill-down setting
  handleZoomDrilldown();
}

// Handle zoom based drilldowns
function handleZoomDrilldown() {
  const currentZoom = map.getZoom();
  let nextLevel = 1;

  if (currentZoom < 9) {
    nextLevel = 1; // State View
  } else if (currentZoom >= 9 && currentZoom < 12) {
    nextLevel = 2; // District View
  } else if (currentZoom >= 12 && currentZoom < 16) {
    nextLevel = 3; // Precinct View
  } else if (currentZoom >= 16) {
    nextLevel = 4; // Household View
  }

  if (nextLevel !== activeDrilldownLevel) {
    activeDrilldownLevel = nextLevel;
    updateDrilldownUI();
  }

  // Handle geographic items showing/hiding on zoom
  if (activeDrilldownLevel === 1) {
    // State View
    if (map.hasLayer(districtBoundaryLayer)) map.removeLayer(districtBoundaryLayer);
    if (precinctPolygonsLayer) map.removeLayer(precinctPolygonsLayer);
    hideHouseholdDots();
    if (heatmapLayer) map.removeLayer(heatmapLayer);
    
    // Remove drawing tools
    map.removeControl(drawControl);
  } 
  else if (activeDrilldownLevel === 2) {
    // District View
    districtBoundaryLayer.addTo(map);
    renderPrecinctLayers();
    hideHouseholdDots();
    if (heatmapLayer) map.removeLayer(heatmapLayer);
    
    // Remove drawing tools
    map.removeControl(drawControl);
  } 
  else if (activeDrilldownLevel === 3) {
    // Precinct View
    if (map.hasLayer(districtBoundaryLayer)) map.removeLayer(districtBoundaryLayer);
    renderPrecinctLayers();
    hideHouseholdDots();
    
    // Remove drawing tools
    map.removeControl(drawControl);
  } 
  else if (activeDrilldownLevel === 4) {
    // Household View
    if (map.hasLayer(districtBoundaryLayer)) map.removeLayer(districtBoundaryLayer);
    // Keep precinct polygons faint in background
    renderPrecinctLayers();
    showHouseholdDots();
 
    // Enable drawing tools
    map.addControl(drawControl);
  }
}

// Update the Top Navigation and Sidebar Header based on drilldown state
function updateDrilldownUI() {
  const names = {
    1: "Level 1: State View",
    2: "Level 2: District View",
    3: "Level 3: Precinct View",
    4: "Level 4: Household Walk List"
  };
  
  document.getElementById("drilldown-level-name").innerText = names[activeDrilldownLevel];
  
  // If user zoomed out, clear clicked precinct selections
  if (activeDrilldownLevel < 3) {
    selectedPrecinctId = null;
    updateSidebarGlobal();
  }
}

// --- Precinct Render Layers and Overlays ---

function renderPrecinctLayers() {
  // If layer group already exists, remove it first
  if (precinctPolygonsLayer) {
    map.removeLayer(precinctPolygonsLayer);
  }

  if (heatmapLayer) {
    map.removeLayer(heatmapLayer);
  }

  const latDiff = currentDistrictCenter[0] - DISTRICT_CENTER[0];
  const lngDiff = currentDistrictCenter[1] - DISTRICT_CENTER[1];

  // Render issue density as a heat map if it's the active overlay
  if (activeOverlay === 'density' && activeDrilldownLevel >= 3) {
    const shiftedContacts = MOCK_CRM_CONTACTS.map(c => [c[0] + latDiff, c[1] + lngDiff, c[2]]);
    heatmapLayer = L.heatLayer(shiftedContacts, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);
  }

  const layers = PRECINCTS_DATA.map(precinct => {
    const style = getOverlayStyle(precinct);
    const shiftedBounds = precinct.bounds.map(pt => [pt[0] + latDiff, pt[1] + lngDiff]);
    const polygon = L.polygon(shiftedBounds, style);

    // Bind clean HTML tooltip
    polygon.bindTooltip(`
      <div style="font-size: 0.75rem; font-weight: 600;">${getLocalizedPrecinctName(precinct.id)}</div>
      <div style="font-size: 0.7rem; color: #a1a1aa; margin-top: 2px;">
        Voters: ${precinct.stats.voters.toLocaleString()}<br/>
        Turnout: ${precinct.stats.turnout2022}%<br/>
        Margin: ${precinct.stats.margin2022 > 0 ? '+' : ''}${precinct.stats.margin2022}% D
      </div>
    `, {
      className: 'tooltip-custom',
      direction: 'top',
      sticky: true
    });

    // Handle clicks
    polygon.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      selectPrecinct(precinct);
    });

    // Glow border on hover
    polygon.on('mouseover', function() {
      this.setStyle({
        weight: 3,
        color: '#6366f1',
        fillOpacity: style.fillOpacity + 0.15
      });
    });

    polygon.on('mouseout', function() {
      if (selectedPrecinctId !== precinct.id) {
        this.setStyle(style);
      }
    });

    // Retain selected precinct border state
    if (selectedPrecinctId === precinct.id) {
      polygon.setStyle({
        weight: 4,
        color: '#ffffff',
        dashArray: ''
      });
    }

    return polygon;
  });

  precinctPolygonsLayer = L.featureGroup(layers).addTo(map);
}

// Compute dynamic polygon styling depending on active toolbar overlay
function getOverlayStyle(precinct) {
  let fillColor = '#ffffff';
  let fillOpacity = 0.55;

  // Level 4 zooms precincts out into thin background guidelines
  if (activeDrilldownLevel === 4) {
    return {
      color: 'rgba(255, 255, 255, 0.15)',
      weight: 1,
      fillColor: 'transparent',
      fillOpacity: 0
    };
  }

  switch(activeOverlay) {
    case 'turnout':
      // Turnout scales from red (low) to green (high)
      const to = precinct.stats.turnout2022;
      if (to >= 70) fillColor = '#10b981'; // Green
      else if (to >= 60) fillColor = '#84cc16'; // Lime
      else if (to >= 55) fillColor = '#eab308'; // Yellow
      else fillColor = '#ef4444'; // Red
      break;

    case 'margin':
      // Swing precincts are Amber. Mobilization (High D/R lean) are deep blue/red.
      if (precinct.stats.isSwing) {
        fillColor = '#f59e0b'; // Amber warning
      } else {
        fillColor = precinct.stats.margin2022 > 0 ? '#1e3a8a' : '#7f1d1d'; // Indigo vs crimson mobilizations
      }
      break;

    case 'density':
      // Density uses heatmap in background, keep polygons semi-translucent boundary lines
      fillColor = 'transparent';
      fillOpacity = 0.15;
      break;

    case 'canvass':
      // Canvassing percentage overlay
      const canv = precinct.stats.canvassCoverage;
      if (canv >= 50) fillColor = '#6366f1'; // Indigo (fully focused)
      else if (canv >= 35) fillColor = '#818cf8'; // Soft purple
      else fillColor = '#312e81'; // Dark Navy (needs canvass)
      break;

    case 'demographics':
      // Predominant Demographics Color Toggles
      const dem = precinct.stats.demographics;
      if (dem.includes("High Income")) fillColor = '#14b8a6'; // Teal
      else if (dem.includes("Suburban")) fillColor = '#a855f7'; // Purple
      else if (dem.includes("Older")) fillColor = '#f43f5e'; // Rose
      else fillColor = '#3b82f6'; // Blue
      break;
  }

  return {
    color: 'rgba(15, 23, 42, 0.3)',
    weight: 1.5,
    fillColor: fillColor,
    fillOpacity: fillOpacity
  };
}

// Render Level 4 Voter dots
function showHouseholdDots() {
  householdDotsLayer.clearLayers();
  
  const latDiff = currentDistrictCenter[0] - DISTRICT_CENTER[0];
  const lngDiff = currentDistrictCenter[1] - DISTRICT_CENTER[1];
  
  MOCK_VOTERS.forEach(voter => {
    let dotClass = 'voter-dot-i';
    if (voter.lean === 'D') dotClass = 'voter-dot-d';
    if (voter.lean === 'R') dotClass = 'voter-dot-r';

    // Create custom leaf node dot divIcon
    const icon = L.divIcon({
      className: `voter-dot ${dotClass}`,
      iconSize: [8, 8],
      iconAnchor: [4, 4]
    });

    const marker = L.marker([voter.lat + latDiff, voter.lng + lngDiff], { icon: icon });
    
    marker.bindTooltip(`
      <div style="font-size: 0.75rem; font-weight: 600;">${voter.name}</div>
      <div style="font-size: 0.7rem; color: #cbd5e1; margin-top: 2px;">
        Address: ${getLocalizedAddress(voter.address, voter.precinctId)}<br/>
        Est. Lean: ${voter.lean === 'D' ? 'Democrat' : (voter.lean === 'R' ? 'Republican' : 'Independent')}<br/>
        Persuadability: ${voter.persuadability}%
      </div>
    `, {
      className: 'tooltip-custom',
      direction: 'top',
      sticky: true
    });

    householdDotsLayer.addLayer(marker);
  });

  householdDotsLayer.addTo(map);
}

function hideHouseholdDots() {
  if (map.hasLayer(householdDotsLayer)) {
    map.removeLayer(householdDotsLayer);
  }
}

// --- Precinct Details Panel Interaction ---

function selectPrecinct(precinct) {
  selectedPrecinctId = precinct.id;
  renderPrecinctLayers(); // repaint selected outlines
  
  // Update detail panel with precinct statistics
  document.getElementById("panel-title").innerText = getLocalizedPrecinctName(precinct.id);
  
  const badge = document.getElementById("panel-subtitle-badge");
  if (precinct.stats.isSwing) {
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }

  document.getElementById("label-stat-1").innerText = "Precinct Voters";
  document.getElementById("val-stat-1").innerText = precinct.stats.voters.toLocaleString();

  document.getElementById("label-stat-2").innerText = "2022 Turnout %";
  document.getElementById("val-stat-2").innerText = `${precinct.stats.turnout2022}%`;
  
  // Style turnout value
  const tBox = document.getElementById("val-stat-2");
  tBox.className = "stat-value";
  if (precinct.stats.turnout2022 >= 65) tBox.classList.add("success");
  else if (precinct.stats.turnout2022 >= 55) tBox.classList.add("warning");
  else tBox.classList.add("danger");

  document.getElementById("label-stat-3").innerText = "2022 Vote Margin";
  const marginStr = `${precinct.stats.margin2022 > 0 ? '+' : ''}${precinct.stats.margin2022}% ${precinct.stats.margin2022 > 0 ? 'D' : 'R'}`;
  document.getElementById("val-stat-3").innerText = marginStr;
  document.getElementById("val-stat-3").style.color = precinct.stats.margin2022 > 0 ? 'var(--color-democrat)' : 'var(--color-republican)';

  document.getElementById("label-stat-4").innerText = "Canvass Rate";
  document.getElementById("val-stat-4").innerText = `${precinct.stats.canvassCoverage}%`;

  // Reveal extra stats
  document.getElementById("val-top-issue").innerText = precinct.stats.topIssue;
  document.getElementById("val-voter-density").innerText = `${Math.round(precinct.stats.voters / 0.75)} / sq mi`;
  document.getElementById("extra-precinct-data").style.display = "block";

  // Re-render chart for selected precinct
  updateChart(precinct.stats);
}

// Reset panel to show global district overview
function updateSidebarGlobal() {
  document.getElementById("panel-title").innerText = "District Overview";
  document.getElementById("panel-subtitle-badge").style.display = 'none';

  document.getElementById("label-stat-1").innerText = "Registered Voters";
  document.getElementById("val-stat-1").innerText = "94,300";

  document.getElementById("label-stat-2").innerText = "2022 Turnout %";
  document.getElementById("val-stat-2").innerText = "64.2%";
  document.getElementById("val-stat-2").className = "stat-value success";

  document.getElementById("label-stat-3").innerText = "Average Margin";
  document.getElementById("val-stat-3").innerText = "+2.4% D";
  document.getElementById("val-stat-3").style.color = "#60a5fa";

  document.getElementById("label-stat-4").innerText = "Canvassing Coverage";
  document.getElementById("val-stat-4").innerText = "42.8%";

  document.getElementById("extra-precinct-data").style.display = "none";

  // Global Lean statistics
  const globalLean = {
    leanD: 50.8,
    leanR: 42.1,
    leanI: 7.1
  };
  updateChart(globalLean);
}

// --- Chart.js Visualization Builder ---

function initChart() {
  const ctx = document.getElementById('precinct-chart').getContext('2d');
  
  partyChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['D Lean', 'R Lean', 'Independent'],
      datasets: [{
        data: [50.8, 42.1, 7.1],
        backgroundColor: ['#2563eb', '#dc2626', '#eab308'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: {
              family: 'Outfit',
              size: 10
            },
            boxWidth: 10
          }
        }
      },
      cutout: '65%'
    }
  });
}

function updateChart(stats) {
  if (!partyChart) return;
  
  partyChart.data.datasets[0].data = [stats.leanD, stats.leanR, stats.leanI];
  partyChart.update();
}

// --- Walk List Ray-Casting PIP Engine ---

let selectedVotersList = [];

// JS Ray-Casting Point-in-Polygon logic
function pointInPolygon(x, y, vs) {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lng, yi = vs[i].lat;
    const xj = vs[j].lng, yj = vs[j].lat;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function extractVotersInPolygon(leafletPolygon) {
  // Get boundary latLng coordinates array
  const latLngs = leafletPolygon.getLatLngs()[0];
  
  const latDiff = currentDistrictCenter[0] - DISTRICT_CENTER[0];
  const lngDiff = currentDistrictCenter[1] - DISTRICT_CENTER[1];
  
  // Filter mock voters using shifted coordinates
  selectedVotersList = MOCK_VOTERS.map(v => ({
    ...v,
    lat: v.lat + latDiff,
    lng: v.lng + lngDiff
  })).filter(voter => {
    return pointInPolygon(voter.lng, voter.lat, latLngs);
  });

  // Calculate stats
  const count = selectedVotersList.length;
  let avgPersuade = 0;
  if (count > 0) {
    const sum = selectedVotersList.reduce((acc, curr) => acc + curr.persuadability, 0);
    avgPersuade = Math.round(sum / count);
  }

  // Update UI Elements
  document.getElementById("voters-selected-count").innerText = count.toLocaleString();
  document.getElementById("avg-persuadability").innerText = count > 0 ? `${avgPersuade}%` : '-';
  
  const dlBtn = document.getElementById("download-walklist-btn");
  const tableWrapper = document.getElementById("walklist-table-wrapper");
  const tbody = document.getElementById("walklist-tbody");

  if (count > 0) {
    dlBtn.disabled = false;
    tableWrapper.style.display = 'block';
    
    // Populate table preview rows
    tbody.innerHTML = selectedVotersList.slice(0, 10).map(v => `
      <tr>
        <td>${v.name}</td>
        <td>${getLocalizedAddress(v.address, v.precinctId)}</td>
        <td><span style="color: ${v.lean === 'D' ? 'var(--color-democrat)' : (v.lean === 'R' ? 'var(--color-republican)' : 'var(--color-independent)')}">${v.lean}</span></td>
        <td>${v.persuadability}%</td>
      </tr>
    `).join('') + (count > 10 ? `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">+ ${count - 10} more voters selected</td></tr>` : '');
    
  } else {
    dlBtn.disabled = true;
    tableWrapper.style.display = 'none';
  }
}

function clearWalklistSelection() {
  selectedVotersList = [];
  document.getElementById("voters-selected-count").innerText = "0";
  document.getElementById("avg-persuadability").innerText = "-";
  document.getElementById("download-walklist-btn").disabled = true;
  document.getElementById("walklist-table-wrapper").style.display = 'none';
  drawnItems.clearLayers();
}

// Download action for exporting selected walk list rows to CSV format
function downloadCSV() {
  if (selectedVotersList.length === 0) return;

  const headers = ["Voter_ID", "Voter_Name", "Address", "Latitude", "Longitude", "Est_Party_Lean", "Persuadability_Score"];
  const rows = selectedVotersList.map(v => [
    v.id,
    v.name,
    getLocalizedAddress(v.address, v.precinctId),
    v.lat,
    v.lng,
    v.lean,
    `${v.persuadability}%`
  ]);

  const csvRows = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))];
  const csvContent = csvRows.join("\n");
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `walk_list_${activeDistrictCode.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// --- Event Listeners and Sub-Controllers ---

function setupEventListeners() {
  // Toggle overlay controls
  const buttons = document.querySelectorAll("#overlay-toolbar button");
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      // Remove active state from current buttons
      buttons.forEach(b => b.classList.remove("active"));
      
      const target = e.currentTarget;
      target.classList.add("active");
      
      activeOverlay = target.dataset.overlay;
      renderPrecinctLayers();
      updateLegend();
    });
  });

  // Register Walk List Export trigger
  document.getElementById("download-walklist-btn").addEventListener("click", downloadCSV);

  // Dropdown menu toggle
  const dropdownTrigger = document.getElementById("active-district-btn");
  const dropdownMenu = document.getElementById("district-dropdown-menu");

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
    });

    // Handle selection clicks on items
    const items = dropdownMenu.querySelectorAll(".dropdown-item");
    items.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        items.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        dropdownMenu.classList.remove("show");

        const val = item.dataset.value;
        const text = item.innerText;
        dropdownTrigger.innerHTML = `${text} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

        handleRegionSelection(val);
      });
    });
  }

  // Knowledge Base dropdown menu toggle
  const kbTrigger = document.getElementById("btn-knowledge-base");
  const kbMenu = document.getElementById("knowledge-base-dropdown-menu");
  if (kbTrigger && kbMenu) {
    kbTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      kbMenu.classList.toggle("show");
    });
    document.addEventListener("click", () => {
      kbMenu.classList.remove("show");
    });
  }
  const kbModal = document.getElementById("kb-modal");
  const kbTitle = document.getElementById("kb-modal-title");
  const kbContent = document.getElementById("kb-modal-content");
  const kbClose = document.getElementById("btn-close-kb-modal");
  const kbOptFederal = document.getElementById("kb-opt-federal");
  const kbOptState = document.getElementById("kb-opt-state");
  if (kbOptFederal) {
    kbOptFederal.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      kbMenu.classList.remove("show");
      if (kbModal && kbTitle && kbContent) {
        kbTitle.innerText = "Federal Knowledge Base";
        kbContent.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div>
              <h4 style="color: #14b8a6; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Active US Senate Appropriations</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">Tracks active federal grant opportunities, community development funds, and infrastructure capital initiatives available for application in Illinois.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>USDA Rural Development Cooperative Grants</li>
                <li>HUD Community Development Block Grants (CDBG)</li>
                <li>Department of Transportation Safe Streets for All (SS4A)</li>
              </ul>
            </div>
            <div>
              <h4 style="color: #14b8a6; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Bipartisan Infrastructure Law (BIL) Tracker</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">Highlights allocations, matching requirements, and timeline trackers for federal infrastructure grants designated for collar counties.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>IIJA Bridge Investment Program ($4.2M Local Pool)</li>
                <li>EPA Clean Water State Revolving Fund</li>
                <li>Federal Transit Administration Bus & Bus Facilities Program</li>
              </ul>
            </div>
            <div>
              <h4 style="color: #14b8a6; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Federal Agency Policy Guidelines</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">Reference compliance rules, regulatory guidelines, and standard operating procedures published by federal executive agencies.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>EPA Lead and Copper Rule Improvements (LCRI)</li>
                <li>HHS Medicare Part D Local Reimbursement Baselines</li>
                <li>Federal Highway Administration Environmental Impact Frameworks</li>
              </ul>
            </div>
            <div>
              <h4 style="color: #14b8a6; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Congressional Hearing Summaries</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">Briefings and executive summaries of testimonies, statements, and reports relevant to collar county economic and transit networks.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>Senate Committee on Commerce Transportation Updates</li>
                <li>Joint Economic Committee Local Job Growth Briefs</li>
                <li>House Committee on Ways and Means Tax Credit Analysis</li>
              </ul>
            </div>
          </div>
        `;
        kbModal.style.display = "flex";
      }
    });
  }
  if (kbOptState) {
    kbOptState.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      kbMenu.classList.remove("show");
      if (kbModal && kbTitle && kbContent) {
        kbTitle.innerText = "State Knowledge Base";
        kbContent.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div>
              <h4 style="color: #38bdf8; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Illinois General Assembly (ILGA) Bill Tracker</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">Tracks current progress, sponsor lists, and committee deadlines for sponsored bills in Springfield.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>SB-1142: Cost-of-Living Pension Adjustment</li>
                <li>SB-2241: Comprehensive School Healthcare Coverage</li>
                <li>HB-3042: Collar County Infrastructure Grant Incentives</li>
              </ul>
            </div>
            <div>
              <h4 style="color: #38bdf8; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Illinois Appropriations & Education Funding</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">Reference materials on Evidence-Based Funding (EBF) state distribution tiers and IDOT transportation formulas.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>ISBE EBF Funding Tier 1 vs Tier 2 Baselines</li>
                <li>IDOT Motor Fuel Tax (MFT) County Distribution Formulas</li>
                <li>IDPH Local Health Department Infrastructure Grants</li>
              </ul>
            </div>
            <div>
              <h4 style="color: #38bdf8; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Collar County Playbook</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">Reference case studies of successful legislative implementations and local appropriations templates in peer districts.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>SD-29 Mobile Health Units Grant Application Package</li>
                <li>SD-30 Municipal Water Main Replacement Cooperative Agreements</li>
                <li>SD-28 Local Business Enterprise (LBE) Tax Incentive Guidelines</li>
              </ul>
            </div>
            <div>
              <h4 style="color: #38bdf8; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem; margin-top: 0; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600;">Illinois Environmental Protection Agency (IEPA) Options</h4>
              <p style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;">State-level environmental matching grants, lead line replacement revolving loans, and water treatment assistance.</p>
              <ul style="font-size: 0.72rem; padding-left: 1.2rem; color: #cbd5e1; line-height: 1.4;">
                <li>IEPA State Revolving Fund Lead Service Line Replacement Loans</li>
                <li>Illinois Clean Water Initiative Municipal Grants</li>
                <li>IEPA Wastewater Infrastructure Optimization Assistance</li>
              </ul>
            </div>
          </div>
        `;
        kbModal.style.display = "flex";
      }
    });
  }
  if (kbClose && kbModal) {
    kbClose.addEventListener("click", () => {
      kbModal.style.display = "none";
    });
    kbModal.addEventListener("click", (e) => {
      if (e.target === kbModal) {
        kbModal.style.display = "none";
      }
    });
  }
  // Initialize Legend scale display
  updateLegend();
}

// Coordinate updates when a different state or district region filter is chosen
function handleRegionSelection(val) {
  clearWalklistSelection(); // reset active drawn walking lists
  selectedPrecinctId = null;
  activeDistrictCode = val;

  // Sync demographics dropdown UI if present
  const demoTrigger = document.getElementById("demo-district-btn");
  if (demoTrigger) {
    const names = {
      'state-il': 'Illinois (Statewide)',
      'sd-21': 'Illinois District 21',
      'sd-22': 'Illinois District 22',
      'sd-41': 'Illinois District 41',
      'sd-42': 'Illinois District 42'
    };
    demoTrigger.innerHTML = `${names[val] || val} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    
    const demoItems = document.querySelectorAll(".demo-dropdown-item");
    demoItems.forEach(item => {
      if (item.getAttribute("data-value") === val) {
        demoItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
      }
    });
    
    // Refresh demographics if visible
    const demoOverlay = document.getElementById("demographics-dashboard-overlay");
    if (typeof activeDemographicsTab !== 'undefined' && demoOverlay && demoOverlay.style.display === "flex") {
      updateDemographicsDashboard(activeDemographicsTab);
    }
  }

  // Sync issues tracker dropdown UI if present
  const issuesTrigger = document.getElementById("issues-district-btn");
  if (issuesTrigger) {
    const names = {
      'state-il': 'Illinois (Statewide)',
      'sd-21': 'Illinois District 21',
      'sd-22': 'Illinois District 22',
      'sd-41': 'Illinois District 41',
      'sd-42': 'Illinois District 42'
    };
    issuesTrigger.innerHTML = `${names[val] || val} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    
    const issuesItems = document.querySelectorAll(".issues-dropdown-item");
    issuesItems.forEach(item => {
      if (item.getAttribute("data-value") === val) {
        issuesItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
      }
    });
    
    // Refresh issues dashboard values if visible
    const issuesOverlay = document.getElementById("issues-tracker-overlay");
    if (typeof activeSelectedIssue !== 'undefined' && issuesOverlay && issuesOverlay.style.display === "flex") {
      updateIssuesDashboard(activeSelectedIssue);
    }
  }

  // Sync sentiment dropdown UI if present
  const sentimentTrigger = document.getElementById("sentiment-district-btn");
  if (sentimentTrigger) {
    const names = {
      'state-il': 'Illinois (Statewide)',
      'sd-21': 'Illinois District 21',
      'sd-22': 'Illinois District 22',
      'sd-41': 'Illinois District 41',
      'sd-42': 'Illinois District 42'
    };
    sentimentTrigger.innerHTML = `${names[val] || val} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    
    const sentimentItems = document.querySelectorAll(".sentiment-dropdown-item");
    sentimentItems.forEach(item => {
      if (item.getAttribute("data-value") === val) {
        sentimentItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
      }
    });
    
    // Refresh sentiment values if visible
    const sentimentOverlay = document.getElementById("sentiment-analysis-overlay");
    if (sentimentOverlay && sentimentOverlay.style.display === "flex") {
      renderSentimentDashboard();
    }
  }

  // Sync people dropdown UI if present
  const peopleTrigger = document.getElementById("people-district-btn");
  if (peopleTrigger) {
    const names = {
      'state-il': 'Illinois (Statewide)',
      'sd-21': 'Illinois District 21',
      'sd-22': 'Illinois District 22',
      'sd-41': 'Illinois District 41',
      'sd-42': 'Illinois District 42'
    };
    peopleTrigger.innerHTML = `${names[val] || val} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    
    const peopleItems = document.querySelectorAll(".people-dropdown-item");
    peopleItems.forEach(item => {
      if (item.getAttribute("data-value") === val) {
        peopleItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
      }
    });
    
    // Refresh people values if visible
    const peopleOverlay = document.getElementById("people-tracker-overlay");
    if (peopleOverlay && peopleOverlay.style.display === "flex") {
      renderPeopleDashboard();
    }
  }

  if (document.getElementById("map")) {
    if (val === 'state-il') {
      // Zoom out to State level (Level 1)
      map.setView(ILLINOIS_CENTER, ILLINOIS_ZOOM);
      
      // Update global header stats to State context
      document.getElementById("global-total-voters").innerText = "8.1M";
      document.getElementById("global-target-margin").innerText = "+4.0% D";

      // Reset details stats to state context
      document.getElementById("val-stat-1").innerText = "8.1M";
      document.getElementById("val-stat-2").innerText = "61.5%";
      document.getElementById("val-stat-3").innerText = "+4.0% D";
      document.getElementById("val-stat-3").style.color = "var(--color-democrat)";
      document.getElementById("val-stat-4").innerText = "28.5%";

      updateChart({ leanD: 53.0, leanR: 41.0, leanI: 6.0 });

      // Trigger zoom level update logic
      handleZoomDrilldown();
    } else {
      // District Selection
      const center = DISTRICT_CENTERS[val];
      if (center) {
        currentDistrictCenter = [...center];
        
        // Update boundaries outline coordinates dynamically
        updateDistrictBoundaryLayer();

        // Pan map to new area center
        map.setView(currentDistrictCenter, DISTRICT_ZOOM);

        // Update global headers and sidebars stats with mockup data
        let voters = "94,300";
        let margin = "+2.4% D";
        let turnout = "64.2%";
        let canvass = "42.8%";
        let stats = { leanD: 50.8, leanR: 42.1, leanI: 7.1 };

        if (val === 'sd-22') {
          voters = "89,200";
          margin = "-4.8% R";
          turnout = "58.6%";
          canvass = "31.4%";
          stats = { leanD: 44.5, leanR: 49.3, leanI: 6.2 };
        } else if (val === 'sd-41') {
          voters = "101,400";
          margin = "+8.2% D";
          turnout = "66.8%";
          canvass = "53.1%";
          stats = { leanD: 54.1, leanR: 38.4, leanI: 7.5 };
        } else if (val === 'sd-42') {
          voters = "97,100";
          margin = "+1.5% D";
          turnout = "61.2%";
          canvass = "38.5%";
          stats = { leanD: 48.7, leanR: 44.2, leanI: 7.1 };
        }

        document.getElementById("global-total-voters").innerText = voters;
        document.getElementById("global-target-margin").innerText = margin;

        // Update Sidebar details
        document.getElementById("val-stat-1").innerText = voters;
        document.getElementById("val-stat-2").innerText = turnout;
        document.getElementById("val-stat-3").innerText = margin;
        document.getElementById("val-stat-3").style.color = margin.includes("D") ? 'var(--color-democrat)' : 'var(--color-republican)';
        document.getElementById("val-stat-4").innerText = canvass;

        // Update chart estimates
        updateChart(stats);

        // Trigger zoom level update logic & repaint geometries
        handleZoomDrilldown();
        renderPrecinctLayers();
      }
    }
  }
}

// Legend updates depending on selected overlay view
function updateLegend() {
  const legendScale = document.getElementById("legend-scale-items");
  const legendTitle = document.getElementById("legend-label");

  let items = [];

  switch(activeOverlay) {
    case 'turnout':
      legendTitle.innerText = "2022 Turnout Rate";
      items = [
        { label: "High (70%+)", color: "#10b981" },
        { label: "Above Avg (60-70%)", color: "#84cc16" },
        { label: "Avg / Moderate (55-60%)", color: "#eab308" },
        { label: "Low (Under 55%)", color: "#ef4444" }
      ];
      break;

    case 'margin':
      legendTitle.innerText = "Precinct Margins";
      items = [
        { label: "Base Mobilization (D)", color: "#1e3a8a" },
        { label: "Base Mobilization (R)", color: "#7f1d1d" },
        { label: "Swing Precinct (<5% Marg.)", color: "#f59e0b" }
      ];
      break;

    case 'density':
      legendTitle.innerText = "Issue密度 (Contacts)";
      items = [
        { label: "Critical High density", color: "rgba(239, 68, 68, 0.7)" },
        { label: "Moderate density", color: "rgba(16, 185, 129, 0.5)" },
        { label: "Low contact volume", color: "rgba(30, 58, 138, 0.3)" }
      ];
      break;

    case 'canvass':
      legendTitle.innerText = "Canvassing Coverage";
      items = [
        { label: "High coverage (50%+)", color: "#6366f1" },
        { label: "Mid coverage (35-50%)", color: "#818cf8" },
        { label: "Unexplored (Under 35%)", color: "#312e81" }
      ];
      break;

    case 'demographics':
      legendTitle.innerText = "Dominant Demographics";
      items = [
        { label: "High Income / Families", color: "#14b8a6" },
        { label: "Suburban Families", color: "#a855f7" },
        { label: "Older Demographics / Retiree", color: "#f43f5e" },
        { label: "Diverse Profiles", color: "#3b82f6" }
      ];
      break;
  }

  legendScale.innerHTML = items.map(item => `
    <div class="legend-item">
      <span class="legend-color" style="background-color: ${item.color}"></span>
      <span>${item.label}</span>
    </div>
  `).join('');
}

// --- Dynamic Regional Localization Engines ---

function getLocalizedPrecinctName(precinctId) {
  const names21 = {
    'P01': "Naperville Ward 1 - PCT 12",
    'P02': "Naperville Ward 1 - PCT 15",
    'P03': "Lisle PCT 4",
    'P04': "Warrenville PCT 2",
    'P05': "Lisle PCT 8",
    'P06': "Naperville Ward 2 - PCT 8"
  };
  const names22 = {
    'P01': "Elgin Ward 2 - PCT 4",
    'P02': "Elgin Ward 4 - PCT 1",
    'P03': "South Elgin PCT 1",
    'P04': "Elgin Ward 1 - PCT 6",
    'P05': "South Elgin PCT 3",
    'P06': "Elgin Ward 3 - PCT 12"
  };
  const names41 = {
    'P01': "Bolingbrook Ward 1 - PCT 3",
    'P02': "Bolingbrook Ward 2 - PCT 8",
    'P03': "Woodridge PCT 15",
    'P04': "Bolingbrook Ward 4 - PCT 2",
    'P05': "Woodridge PCT 18",
    'P06': "Naperville Ward 5 - PCT 21"
  };
  const names42 = {
    'P01': "Aurora Ward 3 - PCT 2",
    'P02': "Aurora Ward 5 - PCT 1",
    'P03': "Batavia PCT 14",
    'P04': "Aurora Ward 1 - PCT 8",
    'P05': "Batavia PCT 16",
    'P06': "Aurora Ward 2 - PCT 11"
  };

  if (activeDistrictCode === 'sd-22') return names22[precinctId] || precinctId;
  if (activeDistrictCode === 'sd-41') return names41[precinctId] || precinctId;
  if (activeDistrictCode === 'sd-42') return names42[precinctId] || precinctId;
  return names21[precinctId] || precinctId;
}

function getLocalizedAddress(voterAddress, precinctId) {
  const num = voterAddress.split(" ")[0]; // Get address number (e.g. 145)
  
  const streets21 = ["Washington St", "Aurora Ave", "Ogden Ave", "Lisle Pl", "Warrenville Rd", "Diehl Rd", "Naperville Rd", "Jefferson Ave", "Mill St", "75th St"];
  const streets22 = ["McLean Blvd", "Larkin Ave", "Dundee Ave", "State St", "Bowes Rd", "Summit St", "Villa St", "Chicago St", "Shales Pkwy", "Randall Rd"];
  const streets41 = ["Boughton Rd", "Lily Cache Ln", "Weber Rd", "Joliet Rd", "Schmidt Rd", "Briarcliff Rd", "Royce Rd", "Woodward Ave", "75th St", "Hassert Blvd"];
  const streets42 = ["Eola Rd", "New York St", "Galena Blvd", "McCarty Rd", "Indian Trail", "Illinois Ave", "Lake St", "Farnsworth Ave", "Batavia Ave", "Main St"];

  let activeStreets = streets21;
  if (activeDistrictCode === 'sd-22') activeStreets = streets22;
  else if (activeDistrictCode === 'sd-41') activeStreets = streets41;
  else if (activeDistrictCode === 'sd-42') activeStreets = streets42;

  // Pick street deterministically based on voter address length and precinct ASCII character code values
  const index = (voterAddress.length + (precinctId ? precinctId.charCodeAt(precinctId.length - 1) : 0)) % activeStreets.length;
  return `${num} ${activeStreets[index]}`;
}

// ==========================================================================
// Voter Demographics Dashboard Controllers (Module 2)
// ==========================================================================

let demographicsChart = null;
let activeDemographicsTab = 'race';

// Demographic datasets dictionary
const DEMOGRAPHICS_DATASETS = {
  race: {
    title: 'Race & Ethnicity: Census ACS Baseline vs. Voter Rolls',
    labels: ['Hispanic/Latino', 'White (Non-Hispanic)', 'Black/African American', 'Asian American', 'Other/Multi-race'],
    census: [42, 38, 12, 6, 2],
    voter: [24, 52, 14, 8, 2],
    insightTitle: 'Registration Deficit Target',
    insightBody: 'District is 42% Hispanic, but they are under-represented by 18 points on voter rolls. The UI must highlight this registration gap as a primary mobilization target.',
    cohort: 'Hispanic Voters (Primary Mobilization Target)'
  },
  age: {
    title: 'Age & Generation: Turnout Rate vs. Census Baseline',
    labels: ['Seniors (65+)', 'Gen X (50-64)', 'Millennials (26-49)', 'Gen Z (18-25)'],
    census: [18, 24, 38, 20],
    voter: [74, 58, 42, 21], // turnout rates
    insightTitle: 'Age-Based Turnout Disparity',
    insightBody: 'Massive turnout gaps exist: Seniors cast ballots at 74% efficiency, whereas Gen Z sits at 21% and Millennials range from 36% to 48%. Guide mobilization vs. persuasion spending.',
    cohort: 'Seniors (Persuasion) vs Gen Z / Millennials (Mobilization)'
  },
  income: {
    title: 'Household Income: Census Median Baselines ($k)',
    labels: ['Buffalo Grove Median', 'District Average', 'State Median', 'North Chicago Median'],
    census: [105, 78, 72, 55],
    voter: [105, 78, 72, 55], // simple comparison
    insightTitle: 'Median Household Income Variance',
    insightBody: 'Highlight the $50k median HHI gap between North Chicago and Buffalo Grove to drive segmented messaging. Frame financial relief vs. structural tax frames.',
    cohort: 'Lower-Income Renters ($50k Gap Messaging)'
  },
  gender: {
    title: 'Gender Distribution: Turnout vs. Census Baselines',
    labels: ['Suburban Women (35-64)', 'Suburban Men (35-64)', 'Younger Women (18-34)', 'Younger Men (18-34)'],
    census: [26, 25, 25, 24],
    voter: [38, 22, 22, 18], // actual share of cast ballots
    insightTitle: 'Suburban Women Turnout Dominance',
    insightBody: 'Suburban women aged 35-64 cast approximately 57% of all local ballots. Flag this cohort as the primary swing bloc and lead with localized education and healthcare messaging.',
    cohort: 'Suburban Women Swing Cohort (57% Ballots)'
  },
  housing: {
    title: 'Housing Tenure: Homeowners vs. Renters Share %',
    labels: ['Homeowners', 'Renters (Leasehold)', 'Alternative Tenure'],
    census: [52, 45, 3],
    voter: [72, 26, 2],
    insightTitle: 'Tenancy Registration Deficit',
    insightBody: 'Nearly 50% of the host district residents are renters (younger, diverse, under-registered). Track tenant protection issue density to capture high-density voter blocks.',
    cohort: 'Renters & Tenant Associations (High-Density Targets)'
  },
  education: {
    title: 'Education Attainment: Degrees Share % by Zone',
    labels: ['High School / less', 'Some College / Assoc', 'Bachelors Degree', 'Graduate Degree'],
    census: [28, 30, 26, 16],
    voter: [18, 24, 38, 20],
    insightTitle: 'Educational Attainment Discrepancy',
    insightBody: 'Correlate degree % with ZIP codes to formulate messaging frames (focus on vocational training / workforce in lower-degree zones, vs. research funding/climate in high-degree zones).',
    cohort: 'Bachelors/Graduate Cohort (Zonal Framing)'
  }
};

const REGIONAL_DEMOGRAPHICS = {
  'state-il': {
    race: {
      census: [18, 59, 14, 6, 3],
      voter: [12, 68, 13, 5, 2]
    },
    age: {
      census: [16, 25, 39, 20],
      voter: [70, 56, 40, 18]
    },
    income: {
      census: [72, 72, 72, 72],
      voter: [72, 72, 72, 72]
    },
    gender: {
      census: [25, 25, 25, 25],
      voter: [32, 28, 22, 18]
    },
    housing: {
      census: [66, 31, 3],
      voter: [80, 18, 2]
    },
    education: {
      census: [24, 29, 31, 16],
      voter: [16, 22, 42, 20]
    }
  },
  'sd-21': {
    race: {
      census: [12, 65, 8, 13, 2],
      voter: [8, 74, 7, 10, 1]
    },
    age: {
      census: [18, 24, 38, 20],
      voter: [74, 58, 42, 21]
    },
    income: {
      census: [105, 78, 72, 55],
      voter: [105, 78, 72, 55]
    },
    gender: {
      census: [26, 25, 25, 24],
      voter: [38, 22, 22, 18]
    },
    housing: {
      census: [52, 45, 3],
      voter: [72, 26, 2]
    },
    education: {
      census: [15, 20, 42, 23],
      voter: [8, 14, 50, 28]
    }
  },
  'sd-22': {
    race: {
      census: [42, 38, 12, 6, 2],
      voter: [24, 52, 14, 8, 2]
    },
    age: {
      census: [14, 22, 41, 23],
      voter: [66, 52, 34, 18]
    },
    income: {
      census: [90, 72, 72, 52],
      voter: [90, 72, 72, 52]
    },
    gender: {
      census: [25, 25, 25, 25],
      voter: [36, 24, 21, 19]
    },
    housing: {
      census: [48, 49, 3],
      voter: [65, 32, 3]
    },
    education: {
      census: [30, 32, 24, 14],
      voter: [20, 26, 36, 18]
    }
  },
  'sd-41': {
    race: {
      census: [25, 45, 18, 9, 3],
      voter: [16, 56, 17, 9, 2]
    },
    age: {
      census: [15, 26, 40, 19],
      voter: [68, 54, 38, 20]
    },
    income: {
      census: [98, 80, 72, 60],
      voter: [98, 80, 72, 60]
    },
    gender: {
      census: [25, 25, 25, 25],
      voter: [35, 25, 22, 18]
    },
    housing: {
      census: [60, 37, 3],
      voter: [78, 20, 2]
    },
    education: {
      census: [20, 28, 35, 17],
      voter: [12, 22, 44, 22]
    }
  },
  'sd-42': {
    race: {
      census: [38, 42, 10, 8, 2],
      voter: [21, 56, 12, 9, 2]
    },
    age: {
      census: [15, 23, 42, 20],
      voter: [65, 50, 38, 17]
    },
    income: {
      census: [92, 75, 72, 54],
      voter: [92, 75, 72, 54]
    },
    gender: {
      census: [25, 25, 25, 25],
      voter: [37, 23, 22, 18]
    },
    housing: {
      census: [50, 47, 3],
      voter: [68, 29, 3]
    },
    education: {
      census: [25, 30, 30, 15],
      voter: [15, 24, 40, 21]
    }
  }
};

function initDemographicsModule() {
  const panelBtn = document.getElementById("btn-demographic-panel");
  const closeBtn = document.getElementById("btn-close-demographics");
  const overlay = document.getElementById("demographics-dashboard-overlay");
  
  if (panelBtn && overlay) {
    panelBtn.addEventListener("click", () => {
      overlay.style.display = "flex";
      setTimeout(() => {
        renderDemographicsChart();
      }, 50);
    });
  }
  
  if (closeBtn && overlay) {
    closeBtn.addEventListener("click", () => {
      overlay.style.display = "none";
    });
  }
  
  // Set up tab switching listeners
  const tabs = document.querySelectorAll(".demographics-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const tabName = tab.getAttribute("data-tab");
      activeDemographicsTab = tabName;
      updateDemographicsDashboard(tabName);
    });
  });

  // Handle dropdown menu toggle
  const demoTrigger = document.getElementById("demo-district-btn");
  const demoMenu = document.getElementById("demo-district-dropdown-menu");
  
  if (demoTrigger && demoMenu) {
    demoTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = demoMenu.style.display === "block";
      demoMenu.style.display = isVisible ? "none" : "block";
    });
  }
  
  // Close menu when clicking outside
  document.addEventListener("click", () => {
    if (demoMenu) demoMenu.style.display = "none";
  });
  
  // Handle item click inside demographics dropdown
  const demoItems = document.querySelectorAll(".demo-dropdown-item");
  demoItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      demoItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const regionVal = item.getAttribute("data-value");
      const regionText = item.innerText;
      
      if (demoTrigger) {
        demoTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      
      if (demoMenu) demoMenu.style.display = "none";
      
      // Update global selected region
      activeDistrictCode = regionVal;
      
      // Sync to main map dropdown (triggers map zoom and stat updates)
      handleRegionSelection(regionVal);
      
      // Sync main dropdown trigger text and active class
      const mainTrigger = document.getElementById("active-district-btn");
      if (mainTrigger) {
        mainTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      const mainItems = document.querySelectorAll("#district-dropdown-menu .dropdown-item");
      mainItems.forEach(mi => {
        if (mi.getAttribute("data-value") === regionVal) {
          mainItems.forEach(x => x.classList.remove("active"));
          mi.classList.add("active");
        }
      });
      
      // Refresh current graph and insights
      updateDemographicsDashboard(activeDemographicsTab);
    });
  });
}

function renderDemographicsChart() {
  const canvas = document.getElementById("demographics-chart");
  if (!canvas) return;
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const ctx = canvas.getContext("2d");
  const dataConfig = DEMOGRAPHICS_DATASETS[activeDemographicsTab];

  // Fetch data dynamically based on active selected district
  const regionKey = activeDistrictCode || 'sd-21';
  const regionConfig = REGIONAL_DEMOGRAPHICS[regionKey] || REGIONAL_DEMOGRAPHICS['sd-21'];
  const activeCensusData = regionConfig[activeDemographicsTab].census;
  const activeVoterData = regionConfig[activeDemographicsTab].voter;
  
  // Setup horizontal comparison datasets
  const isIncome = activeDemographicsTab === 'income';
  const datasets = [
    {
      label: isIncome ? 'Income Baseline ($k)' : 'Census ACS Baseline %',
      data: activeCensusData,
      backgroundColor: '#6366f1', // Indigo
      borderWidth: 0,
      borderRadius: 4
    }
  ];
  
  if (!isIncome) {
    datasets.push({
      label: activeDemographicsTab === 'age' || activeDemographicsTab === 'gender' ? 'Voter Turnout Rate %' : 'Voter File Registration %',
      data: activeVoterData,
      backgroundColor: '#10b981', // Emerald / Success green
      borderWidth: 0,
      borderRadius: 4
    });
  }
  
  demographicsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dataConfig.labels,
      datasets: datasets
    },
    options: {
      indexAxis: 'y', // Makes it a horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#94a3b8',
            font: { family: 'Outfit', size: 11 }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#cbd5e1',
            font: { family: 'Outfit', size: 11, weight: '500' }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { family: 'Outfit', size: 11 },
            boxWidth: 12
          }
        }
      }
    }
  });
  
  updateDemographicsTexts(dataConfig);
}

function updateDemographicsDashboard(tabName) {
  const dataConfig = DEMOGRAPHICS_DATASETS[tabName];
  document.getElementById("demographics-chart-title").innerText = dataConfig.title;
  renderDemographicsChart();
}

function updateDemographicsTexts(dataConfig) {
  document.getElementById("demographics-insight-title").innerText = dataConfig.insightTitle;
  document.getElementById("demographics-insight-body").innerText = dataConfig.insightBody;
  document.getElementById("demographics-insight-cohort").innerText = dataConfig.cohort;
}

// ==========================================================================
// Key Issues Tracker Dashboard Controllers (Module 3/4)
// ==========================================================================

let activeSelectedIssue = 'healthcare';
let issuesTrendChart = null;
let issuesJurisdictionChart = null;

const ISSUES_REGIONAL_DATA = {
  'state-il': {
    healthcare: { mentions: 2450, urgency: 8.5, feasibility: 9.0, trend: '+14%', trendArrow: '▲', color: '#10b981', trendData: [2100, 2250, 2380, 2450] },
    taxes: { mentions: 1980, urgency: 9.0, feasibility: 6.5, trend: '-2%', trendArrow: '▼', color: '#ef4444', trendData: [2050, 2010, 1990, 1980] },
    education: { mentions: 1650, urgency: 7.8, feasibility: 8.2, trend: '+8%', trendArrow: '▲', color: '#6366f1', trendData: [1500, 1550, 1600, 1650] },
    infrastructure: { mentions: 1200, urgency: 6.0, feasibility: 7.5, trend: '+3%', trendArrow: '▲', color: '#3b82f6', trendData: [1150, 1170, 1190, 1200] },
    safety: { mentions: 1100, urgency: 7.5, feasibility: 5.0, trend: '+1%', trendArrow: '▲', color: '#eab308', trendData: [1080, 1090, 1095, 1100] }
  },
  'sd-21': {
    healthcare: { mentions: 95, urgency: 9.0, feasibility: 9.9, trend: '+12%', trendArrow: '▲', color: '#10b981', trendData: [78, 85, 91, 95] },
    taxes: { mentions: 85, urgency: 8.0, feasibility: 6.0, trend: '-4%', trendArrow: '▼', color: '#ef4444', trendData: [92, 89, 87, 85] },
    education: { mentions: 60, urgency: 7.0, feasibility: 8.0, trend: '+8%', trendArrow: '▲', color: '#6366f1', trendData: [52, 55, 58, 60] },
    infrastructure: { mentions: 40, urgency: 5.0, feasibility: 4.0, trend: '-2%', trendArrow: '▼', color: '#3b82f6', trendData: [42, 41, 41, 40] },
    safety: { mentions: 35, urgency: 6.0, feasibility: 3.0, trend: '+1%', trendArrow: '▲', color: '#eab308', trendData: [34, 34, 35, 35] }
  },
  'sd-22': {
    healthcare: { mentions: 130, urgency: 9.2, feasibility: 9.5, trend: '+15%', trendArrow: '▲', color: '#10b981', trendData: [100, 112, 124, 130] },
    taxes: { mentions: 70, urgency: 7.5, feasibility: 5.5, trend: '-5%', trendArrow: '▼', color: '#ef4444', trendData: [78, 75, 72, 70] },
    education: { mentions: 90, urgency: 8.5, feasibility: 8.5, trend: '+10%', trendArrow: '▲', color: '#6366f1', trendData: [75, 82, 87, 90] },
    infrastructure: { mentions: 65, urgency: 7.0, feasibility: 6.5, trend: '+4%', trendArrow: '▲', color: '#3b82f6', trendData: [60, 62, 63, 65] },
    safety: { mentions: 55, urgency: 8.0, feasibility: 4.5, trend: '+6%', trendArrow: '▲', color: '#eab308', trendData: [50, 52, 53, 55] }
  },
  'sd-41': {
    healthcare: { mentions: 110, urgency: 8.8, feasibility: 9.2, trend: '+10%', trendArrow: '▲', color: '#10b981', trendData: [95, 102, 107, 110] },
    taxes: { mentions: 75, urgency: 8.5, feasibility: 5.8, trend: '-3%', trendArrow: '▼', color: '#ef4444', trendData: [80, 78, 76, 75] },
    education: { mentions: 80, urgency: 7.8, feasibility: 8.0, trend: '+6%', trendArrow: '▲', color: '#6366f1', trendData: [72, 75, 78, 80] },
    infrastructure: { mentions: 50, urgency: 6.5, feasibility: 5.5, trend: '+2%', trendArrow: '▲', color: '#3b82f6', trendData: [48, 49, 49, 50] },
    safety: { mentions: 45, urgency: 7.2, feasibility: 4.0, trend: '+3%', trendArrow: '▲', color: '#eab308', trendData: [42, 43, 44, 45] }
  },
  'sd-42': {
    healthcare: { mentions: 120, urgency: 9.0, feasibility: 9.4, trend: '+12%', trendArrow: '▲', color: '#10b981', trendData: [102, 110, 115, 120] },
    taxes: { mentions: 65, urgency: 8.0, feasibility: 5.6, trend: '-4%', trendArrow: '▼', color: '#ef4444', trendData: [70, 68, 66, 65] },
    education: { mentions: 85, urgency: 8.2, feasibility: 8.2, trend: '+9%', trendArrow: '▲', color: '#6366f1', trendData: [74, 78, 82, 85] },
    infrastructure: { mentions: 55, urgency: 6.8, feasibility: 6.0, trend: '+3%', trendArrow: '▲', color: '#3b82f6', trendData: [51, 53, 54, 55] },
    safety: { mentions: 50, urgency: 7.8, feasibility: 4.2, trend: '+5%', trendArrow: '▲', color: '#eab308', trendData: [45, 47, 48, 50] }
  }
};

const ISSUES_CATEGORY_DETAILS = {
  healthcare: {
    briefingTitle: 'Healthcare Access & Medicaid Rates Briefing',
    briefingText: 'Healthcare Medicaid reimbursement rates hearing was held on Medicaid expansion. Driven by new constituent contacts in local Waukegan ZIP codes.',
    briefingAction: 'Issue a statement supporting SB-1402 (Medicaid Reimbursement Extension) and schedule a community health forum in Waukegan prior to the upcoming Health Committee vote.',
    bills: [
      { id: 'SB-1402', name: 'Medicaid Reimbursement Rate Extension', status: 'In Committee', statusClass: 'in-committee', impact: 'High Impact (142 contacts)' },
      { id: 'SB-0985', name: 'Prescription Drug Affordability Board Act', status: 'Passed Chamber 1', statusClass: 'passed', impact: 'Moderate Impact (67 contacts)' },
      { id: 'SB-1204', name: 'Rural Health Clinic Network Funding', status: 'Introduced', statusClass: 'introduced', impact: 'Low Impact (24 contacts)' }
    ],
    jurisdiction: [12, 68, 20], // Federal 12%, State 68%, Local 20%
    escalations: [
      { title: 'Waukegan Clinic Transit Connection', tag: 'Local Infrastructure', desc: 'Constituents report difficulty accessing the county health clinic via public transit. High volume of complaints regarding Route 564 schedules.', path: 'Escalation Recommendation: Send letter to PACE Suburban Bus Board requesting route adjustments.' }
    ]
  },
  taxes: {
    briefingTitle: 'Property Tax Relief & Assessment Transparency',
    briefingText: 'Property taxes continue to register high mentions. Residents are reporting significant tax bill increases following new quadrennial township assessments. Feasibility remains moderate due to legislative deadlock on local government consolidation.',
    briefingAction: 'Co-sponsor SB-2245 (Senior Citizens Assessment Freeze Expansion) and coordinate a joint property tax appeal workshop with the County Assessor.',
    bills: [
      { id: 'SB-2245', name: 'Senior Assessment Homestead Freeze Act', status: 'In Committee', statusClass: 'in-committee', impact: 'High Impact (110 contacts)' },
      { id: 'SB-1102', name: 'Commercial Tax Assessment Transparency', status: 'Introduced', statusClass: 'introduced', impact: 'Moderate Impact (45 contacts)' }
    ],
    jurisdiction: [5, 45, 50], // Federal 5%, State 45%, Local 50%
    escalations: [
      { title: 'Township Assessment Appeal Backlog', tag: 'Local Assessment', desc: 'Over 300 property owners have filed assessment appeals, leading to a 6-month resolution backlog at the county Board of Review.', path: 'Escalation Recommendation: Introduce legislation capping appeal review delays at 90 days.' }
    ]
  },
  education: {
    briefingTitle: 'School Funding Formulas & Teacher Shortages',
    briefingText: 'School funding mentions are rising, driven by discussions on local district budgetary deficits and special education staffing shortages. Strong legislative feasibility as the Education Committee is actively vetting state funding allocation overrides.',
    briefingAction: 'Advocate for funding parity under the Evidence-Based Funding formula and meet with local school boards to address retention incentives.',
    bills: [
      { id: 'SB-1560', name: 'Evidence-Based Funding Parity Amendment', status: 'Passed Chamber 1', statusClass: 'passed', impact: 'High Impact (98 contacts)' },
      { id: 'SB-1890', name: 'Special Education Staff Retention Grants', status: 'In Committee', statusClass: 'in-committee', impact: 'High Impact (85 contacts)' }
    ],
    jurisdiction: [10, 70, 20], // Federal 10%, State 70%, Local 20%
    escalations: [
      { title: 'Local Bilingual Program Deficits', tag: 'School Board Ordinance', desc: 'Bilingual education class sizes exceed state standards due to local staffing reallocations.', path: 'Escalation Recommendation: Request ISBE compliance review and emergency state funding overrides.' }
    ]
  },
  infrastructure: {
    briefingTitle: 'Metra Transit Delays & Clean Water Infrastructure',
    briefingText: 'Moderate mention volume focusing on Metra Union Pacific Northwest service delays and lead pipe service lines replacement. High feasibility for water lines funding under federal matching grants.',
    briefingAction: 'Release press statement detailing state matching grants for municipal lead water service line replacement programs.',
    bills: [
      { id: 'SB-0850', name: 'Lead Service Line Replacement Grant Act', status: 'Passed Chamber 1', statusClass: 'passed', impact: 'High Impact (92 contacts)' },
      { id: 'SB-1033', name: 'Transit Board Consolidation Study Commission', status: 'Introduced', statusClass: 'introduced', impact: 'Low Impact (18 contacts)' }
    ],
    jurisdiction: [30, 40, 30], // Federal 30%, State 40%, Local 30%
    escalations: [
      { title: 'Municipal Pothole Emergency Funding', tag: 'Local Paving', desc: 'Pothole complaints are up 140% along major county corridors, but local municipalities report insufficient maintenance funds.', path: 'Escalation Recommendation: Introduce Senate Bill designating IDOT matching funds for arterial road repairs.' }
    ]
  },
  safety: {
    briefingTitle: 'Community Safety & Violence Prevention Grants',
    briefingText: 'Constituent contact focuses on community-based violence prevention funding and property crime concerns. Feasibility is limited by bipartisan disagreements on judicial detention statutes.',
    briefingAction: 'Advance funding for the Reimagine Public Safety Act and coordinate a community safety briefing with the local Chief of Police.',
    bills: [
      { id: 'SB-2104', name: 'Community Violence Prevention Grants Act', status: 'In Committee', statusClass: 'in-committee', impact: 'High Impact (88 contacts)' }
    ],
    jurisdiction: [15, 60, 25], // Federal 15%, State 60%, Local 25%
    escalations: [
      { title: 'Host Precinct Safe Passage Program', tag: 'Local Policing', desc: 'Parents raise safety concerns regarding middle school routes near high-incidence street corners.', path: 'Escalation Recommendation: Sponsor RPSA grant application to fund volunteer Safe Passage coordinators.' }
    ]
  }
};

function initIssuesTrackerModule() {
  const panelBtn = document.getElementById("btn-issues-tracker");
  const closeBtn = document.getElementById("btn-close-issues");
  const overlay = document.getElementById("issues-tracker-overlay");
  
  if (panelBtn && overlay) {
    panelBtn.addEventListener("click", () => {
      overlay.style.display = "flex";
      setTimeout(() => {
        renderIssuesDashboard();
      }, 50);
    });
  }
  
  if (closeBtn && overlay) {
    closeBtn.addEventListener("click", () => {
      overlay.style.display = "none";
    });
  }
  
  // Set up dropdown selectors
  const demoTrigger = document.getElementById("issues-district-btn");
  const demoMenu = document.getElementById("issues-district-dropdown-menu");
  
  if (demoTrigger && demoMenu) {
    demoTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = demoMenu.style.display === "block";
      demoMenu.style.display = isVisible ? "none" : "block";
    });
  }
  
  // Close menu when clicking outside
  document.addEventListener("click", () => {
    if (demoMenu) demoMenu.style.display = "none";
  });
  
  // Handle items click inside issues tracker dropdown
  const demoItems = document.querySelectorAll(".issues-dropdown-item");
  demoItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      demoItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const regionVal = item.getAttribute("data-value");
      const regionText = item.innerText;
      
      if (demoTrigger) {
        demoTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      
      if (demoMenu) demoMenu.style.display = "none";
      
      // Update global active region
      activeDistrictCode = regionVal;
      
      // Sync back to main map dropdown (triggers map zoom and stats update)
      handleRegionSelection(regionVal);
      
      // Sync main dropdown trigger text and active class
      const mainTrigger = document.getElementById("active-district-btn");
      if (mainTrigger) {
        mainTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      const mainItems = document.querySelectorAll("#district-dropdown-menu .dropdown-item");
      mainItems.forEach(mi => {
        if (mi.getAttribute("data-value") === regionVal) {
          mainItems.forEach(x => x.classList.remove("active"));
          mi.classList.add("active");
        }
      });
      
      // Refresh current dashboard values
      renderIssuesDashboard();
    });
  });
}

function renderIssuesDashboard() {
  const regionKey = activeDistrictCode || 'sd-21';
  const regionalData = ISSUES_REGIONAL_DATA[regionKey] || ISSUES_REGIONAL_DATA['sd-21'];
  
  // Populate Priority Matrix Table
  const tbody = document.getElementById("matrix-tbody");
  if (tbody) {
    tbody.innerHTML = Object.keys(regionalData).map(key => {
      const issue = regionalData[key];
      const categoryLabel = key.charAt(0).toUpperCase() + key.slice(1);
      
      // Calculate Priority Score = mentions * urgency * feasibility
      const score = Math.round(issue.mentions * issue.urgency * issue.feasibility);
      const isSelected = key === activeSelectedIssue;
      
      return `
        <tr class="${isSelected ? 'selected-row' : ''}" onclick="selectIssueCategory('${key}')">
          <td style="font-weight: 600;">${categoryLabel}</td>
          <td style="text-align: center;">${issue.mentions.toLocaleString()}</td>
          <td style="text-align: center;">${issue.urgency.toFixed(1)}</td>
          <td style="text-align: center;">${issue.feasibility.toFixed(1)}</td>
          <td style="text-align: center; font-weight: 700; color: ${isSelected ? '#fde047' : '#fff'};">${score.toLocaleString()}</td>
          <td style="text-align: center; color: ${issue.trendArrow === '▲' ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 600;">
            ${issue.trendArrow} ${issue.trend}
          </td>
        </tr>
      `;
    }).join('');
  }
  
  // Populate active issue details (AI strategic briefing, Bill tracker, Trend chart, Jurisdiction, Escalations)
  updateIssuesDashboard(activeSelectedIssue);
}

function selectIssueCategory(categoryKey) {
  activeSelectedIssue = categoryKey;
  
  // Highlight row immediately
  const rows = document.querySelectorAll("#matrix-tbody tr");
  const regionalData = ISSUES_REGIONAL_DATA[activeDistrictCode || 'sd-21'];
  const keys = Object.keys(regionalData);
  
  rows.forEach((row, i) => {
    if (keys[i] === categoryKey) {
      row.classList.add("selected-row");
    } else {
      row.classList.remove("selected-row");
    }
  });
  
  updateIssuesDashboard(categoryKey);
}

function updateIssuesDashboard(categoryKey) {
  const details = ISSUES_CATEGORY_DETAILS[categoryKey] || ISSUES_CATEGORY_DETAILS['healthcare'];
  const regionKey = activeDistrictCode || 'sd-21';
  const regionalData = ISSUES_REGIONAL_DATA[regionKey] || ISSUES_REGIONAL_DATA['sd-21'];
  const issue = regionalData[categoryKey];
  
  // Update AI Briefing Card
  const briefingTitle = document.getElementById("issues-briefing-title");
  if (briefingTitle) briefingTitle.innerText = details.briefingTitle;
  
  // Synthesize dynamic paragraph with regional totals
  const categoryLabel = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
  const totalScore = Math.round(issue.mentions * issue.urgency * issue.feasibility);
  const districtName = regionKey === 'state-il' ? 'Illinois Statewide' : `Senatorial District ${regionKey.split('-')[1]}`;
  const customText = `${categoryLabel} mentions priority score is ${totalScore.toLocaleString()} (${issue.trendArrow} ${issue.trend} change) in ${districtName}. Inbound contact count is ${issue.mentions} this week. Urgency score is ${issue.urgency.toFixed(1)} / 10 based on local media tracking, and legislative feasibility is ${issue.feasibility.toFixed(1)} / 10. ` + details.briefingText;
  
  const briefingTextElement = document.getElementById("issues-briefing-text");
  if (briefingTextElement) briefingTextElement.innerText = customText;
  
  const briefingActionElement = document.getElementById("issues-briefing-action");
  if (briefingActionElement) briefingActionElement.innerText = details.briefingAction;
  
  // Populate Bill Tracker Cards
  const billList = document.getElementById("bill-tracker-list");
  if (billList) {
    billList.innerHTML = details.bills.map(bill => `
      <div class="bill-card">
        <div class="bill-header-row">
          <span class="bill-id">${bill.id}</span>
          <span class="bill-impact">${bill.impact}</span>
        </div>
        <h5 class="bill-name">${bill.name}</h5>
        <span class="bill-status-badge ${bill.statusClass}">${bill.status}</span>
      </div>
    `).join('');
  }
  
  // Populate Escalation Cards
  const escList = document.getElementById("issues-escalation-list");
  if (escList) {
    escList.innerHTML = details.escalations.map(esc => `
      <div class="escalation-card">
        <div class="escalation-title-row">
          <h5 class="escalation-title">${esc.title}</h5>
          <span class="escalation-tag">${esc.tag}</span>
        </div>
        <p class="escalation-desc">${esc.desc}</p>
        <span class="escalation-path">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align: middle;"><polyline points="9 18 15 12 9 6"></polyline></svg>
          ${esc.path}
        </span>
      </div>
    `).join('');
  }
  
  // Render Trend line Chart
  renderIssuesTrendChart(categoryKey, issue);
  
  // Render Jurisdiction Breakdown Chart
  renderIssuesJurisdictionChart(details.jurisdiction);
}

function renderIssuesTrendChart(categoryKey, issue) {
  const canvas = document.getElementById("issues-trend-chart");
  if (!canvas) return;
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const ctx = canvas.getContext("2d");
  
  const labels = ['30 Days Ago', '20 Days Ago', '10 Days Ago', 'Current Week'];
  
  issuesTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${categoryKey.toUpperCase()} Mentions`,
        data: issue.trendData,
        borderColor: issue.color || '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: issue.color || '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderIssuesJurisdictionChart(jurisdictionData) {
  const canvas = document.getElementById("issues-jurisdiction-chart");
  if (!canvas) return;
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const ctx = canvas.getContext("2d");
  
  issuesJurisdictionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Federal Concerns', 'State-Level Concerns', 'Municipal Concerns'],
      datasets: [{
        data: jurisdictionData,
        backgroundColor: ['#f472b6', '#6366f1', '#10b981'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { family: 'Outfit', size: 9 },
            boxWidth: 10
          }
        }
      },
      cutout: '70%'
    }
  });
}

// ==========================================================================
// Sentiment Analysis Dashboard Controllers (Module 4)
// ==========================================================================

let activeCrosstabTab = 'age';
let sentimentSocialChart = null;
let sentimentPollingChart = null;
let sentimentInboundChart = null;

const SENTIMENT_REGIONAL_DATA = {
  'state-il': {
    alert: 'Yellow Alert: Public mentions spike detected in Healthcare (+2.2 SD)',
    alertClass: 'yellow',
    socialScore: '+0.32',
    approval: '54.2%',
    nps: '+14 NPS',
    inboundChange: '+42% spike',
    townhallAttendance: '148 constituents',
    townhallRating: '4.7 / 5.0',
    briefing: 'Social media monitoring flags a sharp negative sentiment shift regarding Medicaid reimbursement rates, concentrated in Waukegan ZIP codes. Private emails and calls spiked by 42% on healthcare access concern templates. Polling averages show a strong Net Promoter Score (+14) driven by suburban female cohorts over 45, though approval lags among younger male segments under 35. Town hall attendees raised direct questions regarding local bilingual program allocations, diverging from the broader online trend lines.',
    qaList: [
      { text: "When will the Medicaid rate cuts be halted for rural health networks?", category: "Healthcare", sentiment: "Negative" },
      { text: "What is the timeline for lead service water pipe replacement?", category: "Infrastructure", sentiment: "Neutral" },
      { text: "We need state grants to address special education teacher shortages.", category: "Education", sentiment: "Positive" }
    ],
    socialTimeline: [0.15, 0.22, 0.28, 0.32],
    inboundVolume: [310, 450, 480, 520],
    crosstabs: {
      age: { labels: ['Gen Z', 'Millennials', 'Gen X', 'Seniors'], values: [38, 48, 56, 68] },
      race: { labels: ['White', 'Black', 'Hispanic', 'Asian'], values: [55, 72, 45, 60] },
      income: { labels: ['< $50k', '$50k-$100k', '> $100k'], values: [42, 54, 62] },
      gender: { labels: ['Male', 'Female', 'Non-Binary'], values: [46, 62, 50] }
    }
  },
  'sd-21': {
    alert: 'Green Baseline: All tracked mentions within normal standard deviation limits',
    alertClass: 'green',
    socialScore: '+0.48',
    approval: '58.5%',
    nps: '+21 NPS',
    inboundChange: '+12% baseline',
    townhallAttendance: '85 constituents',
    townhallRating: '4.9 / 5.0',
    briefing: 'Voter sentiment in District 21 remains highly favorable, with social media net sentiment peaking at +0.48. Inbound contact remains stable (+12% WoW). Net Promoter Score is strong (+21), anchored by solid approvals across Gen X and Senior homeowner brackets in Naperville. Q&A records from the Lisle community center show positive feedback on the Evidence-Based Funding formula amendment.',
    qaList: [
      { text: "Lisle park district path connections are looking great. Thank you.", category: "Infrastructure", sentiment: "Positive" },
      { text: "Property tax hikes are forcing seniors out of their Naperville homes.", category: "Taxes", sentiment: "Negative" }
    ],
    socialTimeline: [0.35, 0.40, 0.45, 0.48],
    inboundVolume: [45, 48, 50, 52],
    crosstabs: {
      age: { labels: ['Gen Z', 'Millennials', 'Gen X', 'Seniors'], values: [42, 52, 60, 74] },
      race: { labels: ['White', 'Black', 'Hispanic', 'Asian'], values: [58, 68, 50, 62] },
      income: { labels: ['< $50k', '$50k-$100k', '> $100k'], values: [45, 58, 66] },
      gender: { labels: ['Male', 'Female', 'Non-Binary'], values: [50, 65, 52] }
    }
  },
  'sd-22': {
    alert: 'Red Alert: Negative viral thread regarding property tax assessments (+3.4 SD)',
    alertClass: 'red',
    socialScore: '-0.15',
    approval: '46.8%',
    nps: '-5 NPS',
    inboundChange: '+98% surge',
    townhallAttendance: '110 constituents',
    townhallRating: '3.8 / 5.0',
    briefing: 'A sharp negative sentiment spike (-0.15 net score) is active across Elgin and Elgin township forums regarding local property tax hikes. Inbound casework emails doubled this week, causing a major bottleneck. The Net Promoter Score dipped to -5. Staff recommend prioritizing joint taxpayer transparency workshops with the County Assessor to mitigate approval drops among Middle-income suburban groups.',
    qaList: [
      { text: "Why did my commercial property assessment double without warning?", category: "Taxes", sentiment: "Negative" },
      { text: "Metra Union Pacific delays are making commute impossible.", category: "Infrastructure", sentiment: "Negative" }
    ],
    socialTimeline: [0.10, 0.02, -0.08, -0.15],
    inboundVolume: [80, 110, 140, 198],
    crosstabs: {
      age: { labels: ['Gen Z', 'Millennials', 'Gen X', 'Seniors'], values: [30, 38, 44, 52] },
      race: { labels: ['White', 'Black', 'Hispanic', 'Asian'], values: [42, 58, 38, 48] },
      income: { labels: ['< $50k', '$50k-$100k', '> $100k'], values: [36, 46, 50] },
      gender: { labels: ['Male', 'Female', 'Non-Binary'], values: [38, 52, 40] }
    }
  },
  'sd-41': {
    alert: 'Yellow Alert: Spike in negative transit service delays (+2.1 SD)',
    alertClass: 'yellow',
    socialScore: '+0.18',
    approval: '52.4%',
    nps: '+8 NPS',
    inboundChange: '+32% elevated',
    townhallAttendance: '92 constituents',
    townhallRating: '4.5 / 5.0',
    briefing: 'Transit issues are dominating conversations in District 41, with Metra schedule delays driving a yellow baseline alert. Inbound email volume shifted up by 32%. Approvals remain moderate (+8 NPS overall), though demographic crosstabs show significant dissatisfaction among younger commuters under 35.',
    qaList: [
      { text: "Can we consolidate the regional transit boards to fix scheduling conflicts?", category: "Infrastructure", sentiment: "Neutral" },
      { text: "We need community safety patrols near our high school passages.", category: "Safety", sentiment: "Positive" }
    ],
    socialTimeline: [0.22, 0.20, 0.17, 0.18],
    inboundVolume: [65, 78, 85, 92],
    crosstabs: {
      age: { labels: ['Gen Z', 'Millennials', 'Gen X', 'Seniors'], values: [36, 45, 54, 66] },
      race: { labels: ['White', 'Black', 'Hispanic', 'Asian'], values: [52, 64, 42, 56] },
      income: { labels: ['< $50k', '$50k-$100k', '> $100k'], values: [40, 52, 58] },
      gender: { labels: ['Male', 'Female', 'Non-Binary'], values: [44, 58, 48] }
    }
  },
  'sd-42': {
    alert: 'Yellow Alert: elevated school funding queries (+2.3 SD)',
    alertClass: 'yellow',
    socialScore: '+0.25',
    approval: '51.0%',
    nps: '+6 NPS',
    inboundChange: '+28% elevated',
    townhallAttendance: '105 constituents',
    townhallRating: '4.6 / 5.0',
    briefing: 'District 42 registers high bilingual program deficit queries. Attendance at the Waukegan library town hall was strong (105 constituents). Approvals are stable but lean heavily on senior homestead cohorts, while lower-income demographics highlight concerns with special education program retention.',
    qaList: [
      { text: "Bilingual classroom ratios in our elementary schools are way too high.", category: "Education", sentiment: "Negative" },
      { text: "Waukegan health clinic needs transit connector routes.", category: "Healthcare", sentiment: "Neutral" }
    ],
    socialTimeline: [0.18, 0.22, 0.24, 0.25],
    inboundVolume: [55, 68, 72, 85],
    crosstabs: {
      age: { labels: ['Gen Z', 'Millennials', 'Gen X', 'Seniors'], values: [35, 44, 52, 64] },
      race: { labels: ['White', 'Black', 'Hispanic', 'Asian'], values: [48, 62, 40, 54] },
      income: { labels: ['< $50k', '$50k-$100k', '> $100k'], values: [38, 50, 56] },
      gender: { labels: ['Male', 'Female', 'Non-Binary'], values: [42, 56, 46] }
    }
  }
};

function initSentimentModule() {
  const panelBtn = document.getElementById("btn-sentiment-analysis");
  const closeBtn = document.getElementById("btn-close-sentiment");
  const overlay = document.getElementById("sentiment-analysis-overlay");
  
  if (panelBtn && overlay) {
    panelBtn.addEventListener("click", () => {
      overlay.style.display = "flex";
      setTimeout(() => {
        renderSentimentDashboard();
      }, 50);
    });
  }
  
  if (closeBtn && overlay) {
    closeBtn.addEventListener("click", () => {
      overlay.style.display = "none";
    });
  }
  
  // Set up dropdown selectors
  const demoTrigger = document.getElementById("sentiment-district-btn");
  const demoMenu = document.getElementById("sentiment-district-dropdown-menu");
  
  if (demoTrigger && demoMenu) {
    demoTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = demoMenu.style.display === "block";
      demoMenu.style.display = isVisible ? "none" : "block";
    });
  }
  
  document.addEventListener("click", () => {
    if (demoMenu) demoMenu.style.display = "none";
  });
  
  const demoItems = document.querySelectorAll(".sentiment-dropdown-item");
  demoItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      demoItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const regionVal = item.getAttribute("data-value");
      const regionText = item.innerText;
      
      if (demoTrigger) {
        demoTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      
      if (demoMenu) demoMenu.style.display = "none";
      
      activeDistrictCode = regionVal;
      handleRegionSelection(regionVal);
      
      const mainTrigger = document.getElementById("active-district-btn");
      if (mainTrigger) {
        mainTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      const mainItems = document.querySelectorAll("#district-dropdown-menu .dropdown-item");
      mainItems.forEach(mi => {
        if (mi.getAttribute("data-value") === regionVal) {
          mainItems.forEach(x => x.classList.remove("active"));
          mi.classList.add("active");
        }
      });
      
      renderSentimentDashboard();
    });
  });
  
  // Set up Crosstabs Toggles
  const crossTabs = document.querySelectorAll(".demographic-sub-tab");
  crossTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      crossTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      activeCrosstabTab = tab.getAttribute("data-sub");
      renderPollingChart();
    });
  });
  
  // Set up NLP Classifier click handler
  const classifyBtn = document.getElementById("btn-nlp-classify");
  if (classifyBtn) {
    classifyBtn.addEventListener("click", () => {
      executeNLPClassification();
    });
  }
}

function renderSentimentDashboard() {
  const regionKey = activeDistrictCode || 'sd-21';
  const data = SENTIMENT_REGIONAL_DATA[regionKey] || SENTIMENT_REGIONAL_DATA['sd-21'];
  
  // Update score labels
  const lblSocial = document.getElementById("lbl-social-sentiment-score");
  if (lblSocial) lblSocial.innerText = data.socialScore;
  
  const lblApproval = document.getElementById("lbl-polling-approval");
  if (lblApproval) lblApproval.innerText = data.approval;
  
  const lblNPS = document.getElementById("lbl-polling-nps");
  if (lblNPS) lblNPS.innerText = data.nps;
  
  const lblInbound = document.getElementById("lbl-inbound-change-pct");
  if (lblInbound) lblInbound.innerText = data.inboundChange;
  
  const lblAttendance = document.getElementById("lbl-townhall-attendance");
  if (lblAttendance) lblAttendance.innerText = data.townhallAttendance;
  
  const lblRating = document.getElementById("lbl-townhall-rating");
  if (lblRating) lblRating.innerText = data.townhallRating;
  
  const lblBriefing = document.getElementById("sentiment-weekly-briefing");
  if (lblBriefing) lblBriefing.innerText = data.briefing;
  
  // Update Alert Box
  const alertBox = document.getElementById("sentiment-social-alert");
  if (alertBox) {
    const indicator = alertBox.querySelector(".alert-indicator");
    const textNode = document.getElementById("social-alert-text");
    
    if (textNode) textNode.innerText = data.alert;
    alertBox.className = `sentiment-alert-banner ${data.alertClass}`;
    if (indicator) {
      indicator.className = `alert-indicator ${data.alertClass}`;
    }
  }
  
  // Render charts
  renderSocialPulseChart(data.socialTimeline);
  renderPollingChart();
  renderInboundVolumeChart(data.inboundVolume);
}

function renderSocialPulseChart(timelineData) {
  const canvas = document.getElementById("sentiment-social-chart");
  if (!canvas) return;
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const ctx = canvas.getContext("2d");
  sentimentSocialChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['24h Ago', '18h Ago', '12h Ago', 'Current Hour'],
      datasets: [{
        label: 'Net Social Sentiment',
        data: timelineData,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#f43f5e'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } }, min: -1, max: 1 }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderPollingChart() {
  const canvas = document.getElementById("sentiment-polling-chart");
  if (!canvas) return;
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const regionKey = activeDistrictCode || 'sd-21';
  const data = SENTIMENT_REGIONAL_DATA[regionKey] || SENTIMENT_REGIONAL_DATA['sd-21'];
  const tabConfig = data.crosstabs[activeCrosstabTab];
  
  const ctx = canvas.getContext("2d");
  sentimentPollingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tabConfig.labels,
      datasets: [{
        label: 'Approval %',
        data: tabConfig.values,
        backgroundColor: '#eab308',
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { family: 'Outfit', size: 10 } } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } }, min: 0, max: 100 }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderInboundVolumeChart(volumeData) {
  const canvas = document.getElementById("sentiment-inbound-chart");
  if (!canvas) return;
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const ctx = canvas.getContext("2d");
  sentimentInboundChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      datasets: [{
        label: 'Inbound Contacts Volume',
        data: volumeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
        tension: 0.2,
        fill: true,
        pointBackgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function executeNLPClassification() {
  const textInput = document.getElementById("nlp-input-text");
  const rawText = textInput ? textInput.value.trim() : "";
  if (!rawText) return;
  
  const outputDiv = document.getElementById("nlp-classification-output");
  const jsonPre = document.getElementById("nlp-output-json");
  const urgencyBadge = document.getElementById("nlp-urgency-badge");
  
  if (outputDiv) outputDiv.style.display = "block";
  if (jsonPre) jsonPre.innerText = "Analyzing text with Gemini NLP classifier...";
  
  // Call to local Python Flask classification endpoint
  fetch("http://localhost:5001/api/sentiment/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: rawText })
  })
  .then(res => {
    if (!res.ok) throw new Error("Flask classification endpoint not reachable");
    return res.json();
  })
  .then(payload => {
    displayClassificationResult(payload);
  })
  .catch(err => {
    console.warn("Fallback to local client classification due to:", err.message);
    const text = rawText.toLowerCase();
    let sentimentVal = -0.15;
    let primaryIssue = "other";
    let urgencyLevel = "medium";
    let secondaryIssues = [];
    
    if (text.includes("medicaid") || text.includes("drug") || text.includes("doctor") || text.includes("medication") || text.includes("health")) {
      primaryIssue = "healthcare";
      sentimentVal = -0.75;
      urgencyLevel = "high";
      secondaryIssues = ["economy"];
    } else if (text.includes("tax") || text.includes("taxes") || text.includes("property") || text.includes("homestead") || text.includes("valuation")) {
      primaryIssue = "taxes";
      sentimentVal = -0.65;
      urgencyLevel = "high";
      secondaryIssues = ["economy", "housing"];
    } else if (text.includes("school") || text.includes("teacher") || text.includes("education") || text.includes("bilingual") || text.includes("class")) {
      primaryIssue = "education";
      sentimentVal = -0.35;
      urgencyLevel = "medium";
      secondaryIssues = ["economy"];
    } else if (text.includes("pothole") || text.includes("metra") || text.includes("transit") || text.includes("road") || text.includes("bridge") || text.includes("water")) {
      primaryIssue = "infrastructure";
      sentimentVal = -0.25;
      urgencyLevel = "low";
      secondaryIssues = ["environment"];
    } else if (text.includes("crime") || text.includes("police") || text.includes("safety") || text.includes("shooting") || text.includes("gangs")) {
      primaryIssue = "public_safety";
      sentimentVal = -0.80;
      urgencyLevel = "high";
      secondaryIssues = ["education"];
    }
    
    const fallbackPayload = {
      sentiment: sentimentVal,
      primary_issue: primaryIssue,
      secondary_issues: secondaryIssues,
      urgency: urgencyLevel,
      engine: "Gemini 1.5 Client Fallback Matcher"
    };
    
    setTimeout(() => {
      displayClassificationResult(fallbackPayload);
    }, 400);
  });
}

function displayClassificationResult(payload) {
  const jsonPre = document.getElementById("nlp-output-json");
  const urgencyBadge = document.getElementById("nlp-urgency-badge");
  
  if (jsonPre) {
    jsonPre.innerText = JSON.stringify(payload, null, 2);
  }
  
  if (urgencyBadge) {
    urgencyBadge.innerText = `URGENCY: ${payload.urgency.toUpperCase()}`;
    urgencyBadge.className = `bill-status-badge ${payload.urgency === 'high' ? 'in-committee' : payload.urgency === 'medium' ? 'introduced' : 'passed'}`;
  }
}

// ==========================================================================
// People Intelligence Dashboard Controllers (Module 5)
// ==========================================================================

let activePeopleRole = 'manager';
let activePeoplePipelineTab = 'confirmed';
let peopleDonorChart = null;

const PEOPLE_REGIONAL_DATA = {
  'state-il': {
    confirmedCount: "28 confirmed",
    neutralCount: "12 targeted",
    cashOnHand: "$2,450,000",
    pressCount: "68 reports",
    pressSentiment: "+0.15 (Neutral)",
    densityHigh: "Precinct 4 (Naperville)",
    densityUntapped: "Precinct 24 (Waukegan)",
    briefingBullets: [
      "Endorsement warning: AFL-CIO liaison has not returned contact in 45 days; risk level elevated.",
      "Neutral target opportunity: Illinois Environmental Council alignment is at 88%. Outreach recommended.",
      "Campaign financing: Labor and healthcare sectors account for 62% of statewide funding density.",
      "Press tracking: Chicago Tribune suburban beat shifted negative following the recent water utility vote."
    ],
    complianceAlerts: [
      { name: "Richard DeVos", amount: "$5,900", badge: "LIMIT EXCEEDED", badgeClass: "limit-met" },
      { name: "Patricia Harris", amount: "$2,500", badge: "DUAL DONOR", badgeClass: "dual-donor" },
      { name: "Sinopec Energy Ltd", amount: "$12,000", badge: "PROHIBITED FOREIGN", badgeClass: "prohibited" }
    ],
    sectorBreakdown: [35, 25, 15, 10, 15], // Labor, Healthcare, Tech, Real Estate, Legal
    reporters: [
      { name: "Ray Long", beat: "State House", days: 12, dotClass: "green" },
      { name: "Dave McKinney", beat: "Suburban Policy", days: 42, dotClass: "yellow" },
      { name: "A. Gutierrez", beat: "Metro Transit", days: 75, dotClass: "red" },
      { name: "Noreen S.", beat: "Campaign Finance", days: 8, dotClass: "green" }
    ],
    pipeline: {
      confirmed: [
        { name: "Lake County Fed of Labor", influence: "9/10", alignment: "95%", last: "April 12" },
        { name: "Associated Builders & Contractors", influence: "8/10", alignment: "85%", last: "March 22" },
        { name: "Illinois Education Association", influence: "9/10", alignment: "90%", last: "May 1" }
      ],
      neutrals: [
        { name: "Illinois Environmental Council", influence: "8/10", alignment: "88%", last: "Jan 15" },
        { name: "Chamber of Commerce (Aurora)", influence: "6/10", alignment: "65%", last: "Dec 10" }
      ],
      lapsed: [
        { name: "Suburban Taxpayers Association", influence: "7/10", alignment: "40%", last: "Sept 12" }
      ]
    },
    graph: {
      nodes: [
        { id: "Senator", role: "Senator", group: 0, x: 200, y: 175, alignment: "self", influence: 10 },
        { id: "IL AFL-CIO", role: "Union", group: 1, alignment: "aligned", influence: 9, last: "April 12", asks: "Support SB-1402 prevailing wage clauses." },
        { id: "Chamber of Commerce", role: "Business", group: 2, alignment: "neutral", influence: 8, last: "May 5", asks: "Requests business assessment variance hearings." },
        { id: "Sierra Club IL", role: "Advocacy", group: 1, alignment: "aligned", influence: 7, last: "March 18", asks: "Advocates for clean water infrastructure grants." },
        { id: "Suburban Tax Alliance", role: "Advocacy", group: 3, alignment: "opposed", influence: 7, last: "Dec 10", asks: "Opposes state funding allocations without budget cuts." }
      ],
      links: [
        { source: "Senator", target: "IL AFL-CIO" },
        { source: "Senator", target: "Chamber of Commerce" },
        { source: "Senator", target: "Sierra Club IL" },
        { source: "Senator", target: "Suburban Tax Alliance" },
        { source: "IL AFL-CIO", target: "Sierra Club IL" }
      ]
    }
  },
  'sd-21': {
    confirmedCount: "18 confirmed",
    neutralCount: "8 targeted",
    cashOnHand: "$482,500",
    pressCount: "14 reports",
    pressSentiment: "+0.22 (Neutral-Positive)",
    densityHigh: "Precinct 4 (Naperville)",
    densityUntapped: "Precinct 12 (Aurora)",
    briefingBullets: [
      "Endorsement secured: DuPage County Building Trades formal support confirmed.",
      "Neutral target opportunity: Naperville Merchants Guild is at 74% alignment on tax issues.",
      "Casework escalation: 3 municipal escalations open on path extensions; need outreach.",
      "Reporter tracking: Local News-Sun beat writer scheduled for lunch briefing next Wednesday."
    ],
    complianceAlerts: [
      { name: "Richard DeVos", amount: "$5,900", badge: "LIMIT EXCEEDED", badgeClass: "limit-met" },
      { name: "Patricia Harris", amount: "$1,500", badge: "DUAL DONOR", badgeClass: "dual-donor" }
    ],
    sectorBreakdown: [25, 20, 20, 15, 20],
    reporters: [
      { name: "Sarah Taylor", beat: "Naperville Sun", days: 5, dotClass: "green" },
      { name: "Mark Miller", beat: "Daily Herald", days: 34, dotClass: "yellow" },
      { name: "E. Henderson", beat: "Tribune Metro", days: 65, dotClass: "red" },
      { name: "Lisa Wong", beat: "NCTV-17", days: 15, dotClass: "green" }
    ],
    pipeline: {
      confirmed: [
        { name: "DuPage Building Trades", influence: "8/10", alignment: "92%", last: "May 2" },
        { name: "Naperville Homeowners Coalition", influence: "7/10", alignment: "80%", last: "April 29" }
      ],
      neutrals: [
        { name: "Naperville Merchants Guild", influence: "6/10", alignment: "74%", last: "March 11" },
        { name: "West Suburban Realtors", influence: "7/10", alignment: "70%", last: "Feb 20" }
      ],
      lapsed: [
        { name: "Lisle Transit Advocates", influence: "5/10", alignment: "50%", last: "Oct 15" }
      ]
    },
    graph: {
      nodes: [
        { id: "Senator", role: "Senator", group: 0, x: 200, y: 175, alignment: "self", influence: 10 },
        { id: "DuPage Trades", role: "Union", group: 1, alignment: "aligned", influence: 8, last: "May 2", asks: "Requests capital infrastructure bill co-sponsorship." },
        { id: "Naperville Guild", role: "Business", group: 2, alignment: "neutral", influence: 6, last: "March 11", asks: "Seeks clarity on corporate franchise tax exclusions." },
        { id: "Lisle Transit Alliance", role: "Advocacy", group: 1, alignment: "neutral", influence: 5, last: "Oct 15", asks: "Requests state matching funds for trail connections." },
        { id: "DuPage Tax Group", role: "Advocacy", group: 3, alignment: "opposed", influence: 6, last: "Jan 12", asks: "Urges property tax homestead exemptions hikes." }
      ],
      links: [
        { source: "Senator", target: "DuPage Trades" },
        { source: "Senator", target: "Naperville Guild" },
        { source: "Senator", target: "Lisle Transit Alliance" },
        { source: "Senator", target: "DuPage Tax Group" }
      ]
    }
  },
  'sd-22': {
    confirmedCount: "12 confirmed",
    neutralCount: "10 targeted",
    cashOnHand: "$310,000",
    pressCount: "22 reports",
    pressSentiment: "-0.08 (Neutral-Negative)",
    densityHigh: "Precinct 14 (Elgin)",
    densityUntapped: "Precinct 8 (Streamwood)",
    briefingBullets: [
      "Stakeholder risk: Elgin Teachers Association voicing concern with school budget formulas.",
      "Donor monitoring: Property sector donations down by 45% this cycle.",
      "Compliance: Flagged prohibited contractor contribution of $2,000 held in escrow.",
      "Media focus: Courier-News editorial page ran negative opinion column on municipal taxes."
    ],
    complianceAlerts: [
      { name: "Vanguard Dev PAC", amount: "$5,000", badge: "DUAL DONOR", badgeClass: "dual-donor" },
      { name: "Helix Infrastructure", amount: "$2,000", badge: "PROHIBITED CONTRACTOR", badgeClass: "prohibited" }
    ],
    sectorBreakdown: [30, 15, 10, 30, 15],
    reporters: [
      { name: "Alex Cole", beat: "Courier-News", days: 3, dotClass: "green" },
      { name: "R. Jenkins", beat: "Daily Herald", days: 55, dotClass: "yellow" },
      { name: "T. Henderson", beat: "Elgin Observer", days: 92, dotClass: "red" }
    ],
    pipeline: {
      confirmed: [
        { name: "Elgin Firefighters Local", influence: "7/10", alignment: "88%", last: "April 15" }
      ],
      neutrals: [
        { name: "Elgin Teachers Association", influence: "8/10", alignment: "72%", last: "May 1" },
        { name: "Kane County Realtors", influence: "6/10", alignment: "68%", last: "March 3" }
      ],
      lapsed: [
        { name: "Streamwood Taxpayers", influence: "6/10", alignment: "45%", last: "Nov 12" }
      ]
    },
    graph: {
      nodes: [
        { id: "Senator", role: "Senator", group: 0, x: 200, y: 175, alignment: "self", influence: 10 },
        { id: "Elgin Firefighters", role: "Union", group: 1, alignment: "aligned", influence: 7, last: "April 15", asks: "Requests first-responder mental health support program." },
        { id: "Elgin Teachers", role: "Union", group: 1, alignment: "neutral", influence: 8, last: "May 1", asks: "Concerns over Tier 2 pension system reform plans." },
        { id: "Kane Realtors", role: "Business", group: 2, alignment: "neutral", influence: 6, last: "March 3", asks: "Opposes transfer tax increase proposals." }
      ],
      links: [
        { source: "Senator", target: "Elgin Firefighters" },
        { source: "Senator", target: "Elgin Teachers" },
        { source: "Senator", target: "Kane Realtors" }
      ]
    }
  },
  'sd-41': {
    confirmedCount: "16 confirmed",
    neutralCount: "6 targeted",
    cashOnHand: "$390,500",
    pressCount: "10 reports",
    pressSentiment: "+0.10 (Neutral)",
    densityHigh: "Precinct 18 (Lisle)",
    densityUntapped: "Precinct 2 (Woodridge)",
    briefingBullets: [
      "Outreach alert: Lisle Environmental Advocates has not been contacted for 85 days.",
      "Financial stability: Technology sector campaign contributions stable (+15%).",
      "Endorsement progress: West Suburban Teachers formal support confirmed."
    ],
    complianceAlerts: [
      { name: "Steve Wynn", amount: "$5,900", badge: "LIMIT EXCEEDED", badgeClass: "limit-met" }
    ],
    sectorBreakdown: [20, 20, 35, 10, 15],
    reporters: [
      { name: "John Smith", beat: "Lisle Bugle", days: 12, dotClass: "green" },
      { name: "Mary Davis", beat: "Suburban News", days: 70, dotClass: "red" }
    ],
    pipeline: {
      confirmed: [
        { name: "West Suburban Teachers", influence: "8/10", alignment: "90%", last: "April 28" }
      ],
      neutrals: [
        { name: "Lisle Chamber of Commerce", influence: "6/10", alignment: "72%", last: "Feb 10" },
        { name: "DuPage Environmental Club", influence: "5/10", alignment: "78%", last: "March 18" }
      ],
      lapsed: [
        { name: "Woodridge Tax Coalition", influence: "6/10", alignment: "50%", last: "Nov 5" }
      ]
    },
    graph: {
      nodes: [
        { id: "Senator", role: "Senator", group: 0, x: 200, y: 175, alignment: "self", influence: 10 },
        { id: "Woodridge Teachers", role: "Union", group: 1, alignment: "aligned", influence: 8, last: "April 28", asks: "Support school state matching facility grants." },
        { id: "Lisle Chamber", role: "Business", group: 2, alignment: "neutral", influence: 6, last: "Feb 10", asks: "Concerns on state commercial property tax assessments." }
      ],
      links: [
        { source: "Senator", target: "Woodridge Teachers" },
        { source: "Senator", target: "Lisle Chamber" }
      ]
    }
  },
  'sd-42': {
    confirmedCount: "14 confirmed",
    neutralCount: "8 targeted",
    cashOnHand: "$340,000",
    pressCount: "18 reports",
    pressSentiment: "+0.05 (Neutral)",
    densityHigh: "Precinct 10 (Waukegan)",
    densityUntapped: "Precinct 5 (North Chicago)",
    briefingBullets: [
      "Political strategy: Hispanic Merchants Guild alignment at 82%; prioritize outreach.",
      "Outreach gap: Lake County Legal Aid clinic has not been contacted for 90 days."
    ],
    complianceAlerts: [
      { name: "Manuel Rodriguez", amount: "$1,800", badge: "DUAL DONOR", badgeClass: "dual-donor" }
    ],
    sectorBreakdown: [40, 15, 10, 15, 20],
    reporters: [
      { name: "Laura Ramos", beat: "Waukegan Sun", days: 8, dotClass: "green" },
      { name: "Frank Miller", beat: "Lake County Digital", days: 38, dotClass: "yellow" },
      { name: "Juan Garcia", beat: "El Observador", days: 98, dotClass: "red" }
    ],
    pipeline: {
      confirmed: [
        { name: "Lake County Legal Aid", influence: "7/10", alignment: "85%", last: "Jan 12" }
      ],
      neutrals: [
        { name: "Hispanic Merchants Guild", influence: "7/10", alignment: "82%", last: "April 5" },
        { name: "Waukegan Environmental Group", influence: "6/10", alignment: "75%", last: "March 20" }
      ],
      lapsed: [
        { name: "North Chicago Taxpayers", influence: "5/10", alignment: "45%", last: "Oct 1" }
      ]
    },
    graph: {
      nodes: [
        { id: "Senator", role: "Senator", group: 0, x: 200, y: 175, alignment: "self", influence: 10 },
        { id: "Lake County Legal", role: "Advocacy", group: 1, alignment: "aligned", influence: 7, last: "Jan 12", asks: "Support legal clinics translation matching funds." },
        { id: "Hispanic Guild", role: "Business", group: 2, alignment: "neutral", influence: 7, last: "April 5", asks: "Requests minority-owned business development grant funding." }
      ],
      links: [
        { source: "Senator", target: "Lake County Legal" },
        { source: "Senator", target: "Hispanic Guild" }
      ]
    }
  }
};

function initPeopleModule() {
  const panelBtn = document.getElementById("btn-people-tracker");
  
  if (panelBtn) {
    panelBtn.addEventListener("click", () => {
      window.open("people.html", "_blank");
    });
  }
  
  // Role Access Control Dropdown Setup
  const roleTrigger = document.getElementById("people-role-btn");
  const roleMenu = document.getElementById("people-role-dropdown-menu");
  
  if (roleTrigger && roleMenu) {
    roleTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = roleMenu.style.display === "block";
      roleMenu.style.display = isVisible ? "none" : "block";
    });
  }
  
  const roleItems = document.querySelectorAll(".people-role-dropdown-item");
  roleItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      roleItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const roleVal = item.getAttribute("data-role");
      const roleText = item.innerText;
      
      activePeopleRole = roleVal;
      if (roleTrigger) {
        roleTrigger.innerHTML = `Role: ${roleText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      
      if (roleMenu) roleMenu.style.display = "none";
      applyRoleSecurity(roleVal);
    });
  });
  
  // Region Selector Dropdown Setup
  const distTrigger = document.getElementById("people-district-btn");
  const distMenu = document.getElementById("people-district-dropdown-menu");
  
  if (distTrigger && distMenu) {
    distTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = distMenu.style.display === "block";
      distMenu.style.display = isVisible ? "none" : "block";
    });
  }
  
  document.addEventListener("click", () => {
    if (roleMenu) roleMenu.style.display = "none";
    if (distMenu) distMenu.style.display = "none";
  });
  
  const distItems = document.querySelectorAll(".people-dropdown-item");
  distItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      distItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const regionVal = item.getAttribute("data-value");
      const regionText = item.innerText;
      
      if (distTrigger) {
        distTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      
      if (distMenu) distMenu.style.display = "none";
      
      activeDistrictCode = regionVal;
      handleRegionSelection(regionVal);
      
      const mainTrigger = document.getElementById("active-district-btn");
      if (mainTrigger) {
        mainTrigger.innerHTML = `${regionText} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left: 4px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      }
      const mainItems = document.querySelectorAll("#district-dropdown-menu .dropdown-item");
      mainItems.forEach(mi => {
        if (mi.getAttribute("data-value") === regionVal) {
          mainItems.forEach(x => x.classList.remove("active"));
          mi.classList.add("active");
        }
      });
      
      renderPeopleDashboard();
    });
  });
  
  // Pipeline tab triggers
  const pipelineTabs = document.querySelectorAll(".people-pipeline-tab");
  pipelineTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      pipelineTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      activePeoplePipelineTab = tab.id.replace("tab-pipeline-", "");
      renderPipelineList();
    });
  });
  
  // Close node profile drawer
  const closeDrawerBtn = document.getElementById("btn-close-drawer");
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener("click", () => {
      document.getElementById("people-stakeholder-drawer").style.display = "none";
    });
  }
}

function applyRoleSecurity(role) {
  const compliancePanel = document.getElementById("donor-compliance-panel");
  if (!compliancePanel) return;
  
  const maskOverlay = compliancePanel.querySelector(".rbac-masked-overlay");
  const activeWrapper = compliancePanel.querySelector(".compliance-active-wrapper");
  const financials = document.querySelectorAll(".maskable-financial");
  const names = document.querySelectorAll(".maskable-name");
  
  const regionKey = activeDistrictCode || 'sd-21';
  const data = PEOPLE_REGIONAL_DATA[regionKey] || PEOPLE_REGIONAL_DATA['sd-21'];
  
  if (role === 'field') {
    // Mask EVERYTHING in financials
    if (maskOverlay) maskOverlay.style.display = "flex";
    if (activeWrapper) activeWrapper.style.opacity = "0.08";
    
    financials.forEach(f => f.innerText = "[RESTRICTED]");
    names.forEach(n => {
      const parts = n.innerText.split(" ");
      if (parts.length >= 2) {
        n.innerText = `${parts[0][0]}. ${parts[1][0]}.`;
      } else {
        n.innerText = "[HIDDEN]";
      }
    });
  } else if (role === 'director') {
    // Mask financial amounts only, allow compliance list and names
    if (maskOverlay) maskOverlay.style.display = "none";
    if (activeWrapper) activeWrapper.style.opacity = "1";
    
    financials.forEach(f => f.innerText = "[RESTRICTED]");
    renderComplianceAlertsList(data.complianceAlerts, true); // True to mask amounts in list
  } else {
    // Campaign Manager has full access
    if (maskOverlay) maskOverlay.style.display = "none";
    if (activeWrapper) activeWrapper.style.opacity = "1";
    
    financials.forEach(f => f.innerText = data.cashOnHand);
    renderComplianceAlertsList(data.complianceAlerts, false);
  }
}

function renderPeopleDashboard() {
  const regionKey = activeDistrictCode || 'sd-21';
  const data = PEOPLE_REGIONAL_DATA[regionKey] || PEOPLE_REGIONAL_DATA['sd-21'];
  
  // Set labels
  document.getElementById("lbl-people-confirmed-count").innerText = data.confirmedCount;
  document.getElementById("lbl-people-neutral-count").innerText = data.neutralCount;
  document.getElementById("lbl-press-count").innerText = data.pressCount;
  document.getElementById("lbl-press-sentiment").innerText = data.pressSentiment;
  
  // Render Briefing Bullets
  const briefUl = document.getElementById("people-weekly-bullet-brief");
  if (briefUl) {
    briefUl.innerHTML = data.briefingBullets.map(b => `<li>${b}</li>`).join("");
  }
  
  // Draw Graph
  renderStakeholderGraph(data.graph);
  
  // Draw Pipeline List
  renderPipelineList();
  
  // Draw Donor Sector Chart
  renderDonorSectorChart(data.sectorBreakdown);
  
  // Draw Compliance Alerts list
  applyRoleSecurity(activePeopleRole);
  
  // Draw Reporter Tiles
  renderReporterHeatmap(data.reporters);
}

function renderStakeholderGraph(graphData) {
  const svg = document.getElementById("people-graph-svg");
  if (!svg) return;
  svg.innerHTML = ""; // Clear existing elements
  
  // Physics force layout parameters
  const width = svg.clientWidth || 380;
  const height = svg.clientHeight || 350;
  
  // Position nodes initially in a ring around the center Senator
  const nodes = JSON.parse(JSON.stringify(graphData.nodes));
  const links = JSON.parse(JSON.stringify(graphData.links));
  
  nodes.forEach((n, index) => {
    if (n.id === "Senator") {
      n.x = width / 2;
      n.y = height / 2;
    } else {
      const angle = (index / (nodes.length - 1)) * Math.PI * 2;
      n.x = (width / 2) + Math.cos(angle) * 110;
      n.y = (height / 2) + Math.sin(angle) * 110;
    }
  });
  
  // Run a tiny vector math force simulation loop (50 iterations)
  const steps = 50;
  const k = Math.sqrt((width * height) / nodes.length);
  
  for (let step = 0; step < steps; step++) {
    // 1. Repulsion force between all nodes
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      if (n1.id === "Senator") continue; // Anchor center
      
      let fx = 0, fy = 0;
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const n2 = nodes[j];
        
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        
        if (dist < 180) {
          const force = (k * k) / dist * 0.2;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }
      n1.x += fx;
      n1.y += fy;
    }
    
    // 2. Attraction spring force between connected links
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        
        // Target length of spring is 100px
        const force = (dist - 100) * 0.08;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (sourceNode.id !== "Senator") {
          sourceNode.x += fx;
          sourceNode.y += fy;
        }
        if (targetNode.id !== "Senator") {
          targetNode.x -= fx;
          targetNode.y -= fy;
        }
      }
    });
    
    // 3. Contain within bounds
    nodes.forEach(n => {
      if (n.id === "Senator") return;
      n.x = Math.max(25, Math.min(width - 25, n.x));
      n.y = Math.max(25, Math.min(height - 25, n.y));
    });
  }
  
  // Render Links
  links.forEach(link => {
    const sourceNode = nodes.find(n => n.id === link.source);
    const targetNode = nodes.find(n => n.id === link.target);
    
    if (sourceNode && targetNode) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", sourceNode.x);
      line.setAttribute("y1", sourceNode.y);
      line.setAttribute("x2", targetNode.x);
      line.setAttribute("y2", targetNode.y);
      
      // Color link based on nodes relationship
      const relClass = targetNode.alignment === 'aligned' ? 'aligned' : targetNode.alignment === 'opposed' ? 'conflict' : '';
      line.setAttribute("class", `graph-edge ${relClass}`);
      svg.appendChild(line);
    }
  });
  
  // Render Nodes
  nodes.forEach(n => {
    // Create Circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", n.x);
    circle.setAttribute("cy", n.y);
    
    const rVal = n.id === 'Senator' ? 14 : 9;
    circle.setAttribute("r", rVal);
    circle.setAttribute("class", "node-circle");
    
    // Node Color based on alignment
    let color = "#e2e8f0"; // default
    if (n.id === 'Senator') color = "#8b5cf6";
    else if (n.alignment === 'aligned') color = "#10b981";
    else if (n.alignment === 'neutral') color = "#f59e0b";
    else if (n.alignment === 'opposed') color = "#ef4444";
    
    circle.setAttribute("fill", color);
    svg.appendChild(circle);
    
    // Create Text Label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", n.x);
    text.setAttribute("y", n.y - (rVal + 4));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "node-label");
    text.textContent = n.id;
    svg.appendChild(text);
    
    // Click Handler for detail drawer
    if (n.id !== 'Senator') {
      circle.addEventListener("click", (e) => {
        e.stopPropagation();
        showStakeholderDetail(n);
      });
    }
  });
}

function showStakeholderDetail(node) {
  const drawer = document.getElementById("people-stakeholder-drawer");
  if (!drawer) return;
  
  drawer.style.display = "block";
  document.getElementById("drawer-node-name").innerText = node.id;
  document.getElementById("drawer-node-influence").innerText = `${node.influence} / 10`;
  
  const alignNode = document.getElementById("drawer-node-alignment");
  alignNode.innerText = node.alignment === 'aligned' ? 'High Match' : node.alignment === 'neutral' ? 'Moderate Neutral' : 'Low Divergent';
  alignNode.className = node.alignment === 'aligned' ? 'passed' : node.alignment === 'neutral' ? 'introduced' : 'in-committee';
  
  document.getElementById("drawer-node-lastmeeting").innerText = node.last || 'N/A';
  
  const statusNode = document.getElementById("drawer-node-status");
  statusNode.innerText = node.alignment === 'aligned' ? 'Confirmed Endorsement' : node.alignment === 'neutral' ? 'Neutral Target' : 'Opposed';
  statusNode.className = `bill-status-badge ${node.alignment === 'aligned' ? 'passed' : node.alignment === 'neutral' ? 'introduced' : 'in-committee'}`;
  
  document.getElementById("drawer-node-asks").innerText = node.asks || "No commitments recorded in CRM log.";
}

function renderPipelineList() {
  const regionKey = activeDistrictCode || 'sd-21';
  const data = PEOPLE_REGIONAL_DATA[regionKey] || PEOPLE_REGIONAL_DATA['sd-21'];
  const listContainer = document.getElementById("people-pipeline-list");
  
  if (!listContainer) return;
  listContainer.innerHTML = "";
  
  const list = data.pipeline[activePeoplePipelineTab] || [];
  if (list.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 0.72rem; color: var(--text-secondary); text-align: center; margin-top: 1rem;">No stakeholders in this category.</div>`;
    return;
  }
  
  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "compliance-alert-item";
    card.style.background = "rgba(255, 255, 255, 0.01)";
    card.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 0.72rem; color: white;">${item.name}</div>
        <div style="font-size: 0.65rem; color: var(--text-secondary);">Last contact: ${item.last}</div>
      </div>
      <div style="display: flex; gap: 0.35rem; align-items: center;">
        <span style="font-size: 0.65rem; color: var(--text-secondary);">Align: <strong style="color: white;">${item.alignment}</strong></span>
        <span class="compliance-badge limit-met" style="font-size: 0.6rem; background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.25); color: #c084fc;">Infl: ${item.influence}</span>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function renderDonorSectorChart(sectorData) {
  const canvas = document.getElementById("people-donor-chart");
  if (!canvas) return;
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const ctx = canvas.getContext("2d");
  peopleDonorChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Labor', 'Healthcare', 'Tech', 'Real Estate', 'Legal'],
      datasets: [{
        data: sectorData,
        backgroundColor: ['#a78bfa', '#10b981', '#60a5fa', '#f59e0b', '#f472b6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { family: 'Outfit', size: 9 },
            boxWidth: 8
          }
        }
      }
    }
  });
}

function renderComplianceAlertsList(alerts, maskAmounts) {
  const alertsList = document.getElementById("people-compliance-alerts-list");
  if (!alertsList) return;
  alertsList.innerHTML = "";
  
  alerts.forEach(a => {
    const div = document.createElement("div");
    div.className = "compliance-alert-item";
    
    // Mask name for Field Staff if that condition is active
    let nameText = a.name;
    if (activePeopleRole === 'field') {
      const parts = a.name.split(" ");
      nameText = parts.length >= 2 ? `${parts[0][0]}. ${parts[1][0]}.` : "[RESTRICTED]";
    }
    
    const amountText = maskAmounts ? "[RESTRICTED]" : a.amount;
    
    div.innerHTML = `
      <span>Donor: <strong style="color: white;">${nameText}</strong></span>
      <span>Amount: <strong style="color: #fda4af;">${amountText}</strong></span>
      <span class="compliance-badge ${a.badgeClass}">${a.badge}</span>
    `;
    alertsList.appendChild(div);
  });
}

function renderReporterHeatmap(reporters) {
  const container = document.getElementById("people-reporter-heatmap");
  if (!container) return;
  container.innerHTML = "";
  
  reporters.forEach(r => {
    const tile = document.createElement("div");
    tile.className = "reporter-tile";
    tile.innerHTML = `
      <div class="reporter-header">
        <span class="reporter-name">${r.name}</span>
        <span class="reporter-dot ${r.dotClass}"></span>
      </div>
      <div class="reporter-beat">${r.beat}</div>
      <div class="reporter-timer">Last contact: ${r.days} days ago</div>
    `;
    container.appendChild(tile);
  });
}

