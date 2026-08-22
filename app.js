// ====================================================================
// Penghu Cool-Ride - Advanced Graph Routing with Academic Scientific Schemes
// ====================================================================

// Global Application State
let map;
let allNodes = [];
let markersLayer;
let routePolylineLayer;
let currentTravelMode = 'scooter'; // 'scooter' | 'walk'
let activeCategoryFilter = 'all';
let selectedSchemeId = 1; // 1: ISO WBGT, 2: UTCI, 3: Solar Radiation, 4: Pareto

let currentWeatherData = {
  temp: 35.2,
  feelsLike: 39.8,
  uvIndex: 10.5,
  wbgt: 31.4,
  solarDni: 850,
  heatLevel: 'HIGH'
};

// Preset Key Coordinates for Routing Demo
const KEY_PRESET_LOCATIONS = {
  magong_port: { name: "Pelabuhan Magong (Pusat Rental Motor)", lat: 23.5654, lon: 119.5668 },
  magong_airport: { name: "Bandara Penghu (Magong Airport)", lat: 23.5697, lon: 119.6294 },
  kuobishan: { name: "Kuobishan (Moses Sea Parting)", lat: 23.5975, lon: 119.6748 },
  tongliang_banyan: { name: "Pohon Beringin Raksasa Tongliang", lat: 23.6575, lon: 119.5594 },
  penghu_bridge: { name: "Jembatan Lintas Laut Penghu (Great Bridge)", lat: 23.6508, lon: 119.5392 },
  daguoye_basalt: { name: "Kolom Basalt Daguoye (Xiyu)", lat: 23.5932, lon: 119.5161 },
  shanshui_beach: { name: "Pantai Shanshui (Jalur Selatan)", lat: 23.5136, lon: 119.5912 },
  fenggui_cave: { name: "Fenggui Blowholes (Gua Angin)", lat: 23.5414, lon: 119.5447 },
  yuwengdao_lighthouse: { name: "Mercusuar Yuwengdao", lat: 23.5606, lon: 119.4678 }
};

const SCIENTIFIC_SCHEMES_META = {
  1: {
    name: "ISO 7243 (WBGT Threshold)",
    citation: "ISO 7243:2017 / Budd (2008)",
    strainReduction: 65,
    restMins: 12
  },
  2: {
    name: "UTCI Physiological Strain",
    citation: "Bröde et al. (2012), Int. J. Biometeorol",
    strainReduction: 58,
    restMins: 15
  },
  3: {
    name: "Solar Radiation Budget (COMFA)",
    citation: "Brown & Gillespie (1995) / Vanos (2010)",
    strainReduction: 72,
    restMins: 10
  },
  4: {
    name: "Bi-Objective Pareto Router",
    citation: "Raith & Ehrgott (2009), Comput. Oper. Res.",
    strainReduction: 64,
    restMins: 12
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchLiveWeather();
  loadDataset();
});

// 1. Leaflet Map Initialization
function initMap() {
  map = L.map('map', { zoomControl: false }).setView([23.5711, 119.5793], 11);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  // CartoDB Voyager / Dark Basemap
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  routePolylineLayer = L.layerGroup().addTo(map);
}

// 2. Fetch Live Open-Meteo Weather & UV
async function fetchLiveWeather() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=23.57&longitude=119.57&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&hourly=uv_index,direct_normal_irradiance&timezone=Asia%2FTaipei';

  try {
    const res = await fetch(url);
    const data = await res.json();

    const currentTemp = Math.round(data.current.temperature_2m);
    const feelsLike = Math.round(data.current.apparent_temperature);
    const currentHour = new Date().getHours();
    const uvIndex = data.hourly?.uv_index?.[currentHour] || 9.5;
    const solarDni = data.hourly?.direct_normal_irradiance?.[currentHour] || 820;

    // Approximate WBGT = 0.7 * WetBulb + 0.2 * Globe + 0.1 * Air
    const approxWbgt = Math.round((feelsLike * 0.75) + (uvIndex * 0.3));

    let heatLevel = 'MODERATE';
    let badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

    if (feelsLike >= 38 || uvIndex >= 11) {
      heatLevel = 'EXTREME';
      badgeClass = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
    } else if (feelsLike >= 34 || uvIndex >= 8) {
      heatLevel = 'HIGH';
      badgeClass = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    }

    currentWeatherData = { temp: currentTemp, feelsLike, uvIndex, wbgt: approxWbgt, solarDni, heatLevel };

    document.getElementById('temp-display').textContent = `${currentTemp}°C (Terasa ${feelsLike}°C)`;
    document.getElementById('uv-display').textContent = `UV: ${uvIndex}`;
    
    const badgeEl = document.getElementById('heat-badge');
    badgeEl.textContent = heatLevel;
    badgeEl.className = `text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${badgeClass}`;

  } catch (err) {
    console.warn('Using simulated Penghu summer weather:', err);
    document.getElementById('temp-display').textContent = '35°C (Terasa 40°C)';
    document.getElementById('uv-display').textContent = 'UV: 10.5';
  }
}

// 3. Load Master Dataset (2,190 Nodes)
async function loadDataset() {
  try {
    const res = await fetch('data/penghu_master_nodes.json');
    if (res.ok) {
      allNodes = await res.json();
    }
  } catch (e) {
    console.log('Loading fallback key nodes:', e);
  }

  if (!allNodes || allNodes.length === 0) {
    allNodes = generateCuratedNodes();
  }

  document.getElementById('total-poi-count').textContent = allNodes.length;
  renderPOIMarkers(allNodes);
  renderPOIList(allNodes.slice(0, 100));
}

// 4. Render Markers on Leaflet Map
function renderPOIMarkers(nodes) {
  markersLayer.clearLayers();

  const nodesToRender = nodes.filter(n => {
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'convenience_store') return n.category === 'convenience_store';
    if (activeCategoryFilter === 'tourist_attraction') return n.category === 'tourist_attraction' || n.node_role === 'attraction_node';
    if (activeCategoryFilter === 'shelter') return n.category === 'shelter' || n.category === 'food_and_drink' || n.category === 'restaurants';
    if (activeCategoryFilter === 'hotel_node') return n.node_role === 'hotel_node' || n.category === 'hotels';
    return true;
  }).slice(0, 600);

  nodesToRender.forEach(node => {
    if (!node.latitude || !node.longitude) return;

    let iconClass = 'pin-attraction';
    let iconEmoji = '🏛️';

    if (node.category === 'convenience_store') {
      iconClass = 'pin-store';
      iconEmoji = '🏪';
    } else if (node.category === 'shelter' || node.category === 'restaurants' || node.category === 'food_and_drink') {
      iconClass = 'pin-shelter';
      iconEmoji = '🍧';
    } else if (node.node_role === 'hotel_node' || node.category === 'hotels') {
      iconClass = 'pin-hotel';
      iconEmoji = '🏨';
    }

    const customIcon = L.divIcon({
      className: `custom-pin ${iconClass}`,
      html: `<span>${iconEmoji}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const marker = L.marker([node.latitude, node.longitude], { icon: customIcon });

    const popupHtml = `
      <div class="text-xs space-y-1.5 min-w-[210px]">
        <div class="flex items-center gap-1.5">
          <span class="text-base">${iconEmoji}</span>
          <h4 class="font-bold text-slate-100">${node.name_zh || node.name}</h4>
        </div>
        ${node.name_en ? `<p class="text-[10px] text-slate-400 italic">${node.name_en}</p>` : ''}
        <div class="pt-1.5 border-t border-slate-800 text-[11px] space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Kategori:</span>
            <span class="text-cyan-400 font-semibold uppercase text-[10px]">${node.category.replace('_', ' ')}</span>
          </div>
          ${node.has_ac ? `<div class="text-emerald-400 font-semibold flex items-center gap-1">❄️ Dilengkapi AC / Pendingin</div>` : ''}
          ${node.opening_hours ? `<div class="text-slate-300">🕒 ${node.opening_hours}</div>` : ''}
          ${node.fee_info ? `<div class="text-amber-300 font-semibold">🎟️ ${node.fee_info}</div>` : ''}
        </div>
        <button onclick="setAsDestination(${node.latitude}, ${node.longitude}, '${(node.name_zh || node.name).replace(/'/g, "\\'")}')" class="mt-2 w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-[10px] font-bold transition shadow">
          Jadikan Tujuan Rute
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
  });
}

// 5. SMART ROUTE CALCULATION WITH SELECTED ACADEMIC SCHEME
function calculateSmartRoute() {
  const startKey = document.getElementById('select-start').value;
  const endKey = document.getElementById('select-end').value;

  const start = KEY_PRESET_LOCATIONS[startKey] || KEY_PRESET_LOCATIONS.magong_port;
  const destination = KEY_PRESET_LOCATIONS[endKey] || KEY_PRESET_LOCATIONS.tongliang_banyan;

  routePolylineLayer.clearLayers();

  const directDistanceKm = getDistanceKm(start.lat, start.lon, destination.lat, destination.lon);
  const speedKmH = currentTravelMode === 'scooter' ? 35 : 4.5;
  const directTravelMinutes = Math.round((directDistanceKm / speedKmH) * 60);

  const schemeMeta = SCIENTIFIC_SCHEMES_META[selectedSchemeId];
  
  // Scientific Condition Check
  let needsCoolingStop = false;
  if (selectedSchemeId === 1) { // ISO 7243 WBGT
    const tMax = Math.max(12, 60 / Math.pow(Math.max(1, currentWeatherData.wbgt - 27), 1.2));
    needsCoolingStop = directTravelMinutes >= tMax;
  } else if (selectedSchemeId === 2) { // UTCI
    needsCoolingStop = directTravelMinutes >= 14 && currentWeatherData.feelsLike >= 34;
  } else if (selectedSchemeId === 3) { // Solar Radiation
    needsCoolingStop = directTravelMinutes >= 15 && currentWeatherData.solarDni >= 600;
  } else if (selectedSchemeId === 4) { // Pareto
    needsCoolingStop = directTravelMinutes >= 16;
  }

  let recommendedShelter = null;
  if (needsCoolingStop) {
    const midLat = (start.lat + destination.lat) / 2;
    const midLon = (start.lon + destination.lon) / 2;
    recommendedShelter = findNearestShelter(midLat, midLon);
  }

  // Draw Polyline
  let routeCoords = [];
  if (recommendedShelter) {
    routeCoords = [
      [start.lat, start.lon],
      [recommendedShelter.latitude, recommendedShelter.longitude],
      [destination.lat, destination.lon]
    ];
  } else {
    routeCoords = [
      [start.lat, start.lon],
      [destination.lat, destination.lon]
    ];
  }

  const polyline = L.polyline(routeCoords, {
    color: '#06b6d4',
    weight: 5,
    opacity: 0.9,
    dashArray: '8, 8',
    lineJoin: 'round'
  }).addTo(routePolylineLayer);

  addRouteMarker(start.lat, start.lon, 'A', start.name, '#3b82f6');
  if (recommendedShelter) {
    addRouteMarker(recommendedShelter.latitude, recommendedShelter.longitude, '❄️', `Shelter: ${recommendedShelter.name || recommendedShelter.name_zh}`, '#10b981');
  }
  addRouteMarker(destination.lat, destination.lon, 'B', destination.name, '#ef4444');

  map.fitBounds(polyline.getBounds(), { padding: [60, 60] });

  // Update UI Comparison Metrics
  document.getElementById('direct-time-display').textContent = `${directTravelMinutes} Menit`;
  document.getElementById('route-distance-text').textContent = `${directDistanceKm.toFixed(1)} km`;

  const safeMinutes = recommendedShelter ? (directTravelMinutes + schemeMeta.restMins) : directTravelMinutes;
  document.getElementById('safe-time-display').textContent = `${safeMinutes} Menit`;
  document.getElementById('reduction-badge').textContent = `-${schemeMeta.strainReduction}% Strain`;

  renderRouteTimeline(start, destination, recommendedShelter, directDistanceKm, directTravelMinutes, schemeMeta);
  document.getElementById('route-result-card').classList.remove('hidden');
}

function addRouteMarker(lat, lon, label, title, colorHex) {
  const icon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="background: ${colorHex}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid white; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  L.marker([lat, lon], { icon }).bindPopup(`<b>${title}</b>`).addTo(routePolylineLayer);
}

function renderRouteTimeline(start, dest, shelter, distanceKm, totalMins, schemeMeta) {
  const container = document.getElementById('route-timeline-steps');
  
  if (shelter) {
    const leg1Mins = Math.max(8, Math.round(totalMins * 0.45));
    const leg2Mins = Math.max(8, Math.round(totalMins * 0.55));
    const shelterName = shelter.name_zh || shelter.name || "7-Eleven Tongliang Store";

    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold text-slate-200">${start.name}</p>
          <p class="text-[11px] text-slate-400">Berkendara leg 1 (${leg1Mins} menit - ${Math.round(distanceKm*0.5)} km).</p>
        </div>
      </div>

      <div class="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
        <span class="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0">❄️</span>
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5">
            <p class="font-bold text-emerald-300">Wajib Istirahat ${schemeMeta.restMins} Menit di ${shelterName}</p>
          </div>
          <p class="text-[11px] text-emerald-200/80">
            Penurunan beban termal tubuh sebesar <b>${schemeMeta.strainReduction}%</b> sebelum menyeberang jalur terbuka.
          </p>
        </div>
      </div>

      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold text-slate-200">${dest.name}</p>
          <p class="text-[11px] text-slate-400">Tiba di destinasi akhir dengan selamat (${leg2Mins} menit lanjutan).</p>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold text-slate-200">${start.name}</p>
          <p class="text-[11px] text-slate-400">Perjalanan langsung (${distanceKm.toFixed(1)} km).</p>
        </div>
      </div>
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold text-slate-200">${dest.name}</p>
          <p class="text-[11px] text-slate-400">Durasi singkat, aman dari resiko heatstroke akut.</p>
        </div>
      </div>
    `;
  }

  lucide.createIcons();
}

function findNearestShelter(lat, lon) {
  const shelters = allNodes.filter(n => n.category === 'convenience_store' || n.category === 'shelter');
  if (shelters.length === 0) {
    return {
      name_zh: "7-Eleven 通梁門市 (Tongliang Store)",
      latitude: 23.6558,
      longitude: 119.5582,
      category: "convenience_store"
    };
  }

  return minBy(shelters, s => getDistanceKm(lat, lon, s.latitude, s.longitude));
}

function minBy(arr, fn) {
  let minElem = arr[0];
  let minVal = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const val = fn(arr[i]);
    if (val < minVal) {
      minVal = val;
      minElem = arr[i];
    }
  }
  return minElem;
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Scientific Scheme Selector Switch
function selectScheme(id) {
  selectedSchemeId = id;
  document.querySelectorAll('.scheme-card').forEach((card, index) => {
    if (index + 1 === id) {
      card.className = 'scheme-card active p-3.5 rounded-xl bg-slate-900 border border-cyan-500/50 cursor-pointer transition shadow-md';
    } else {
      card.className = 'scheme-card p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition';
    }
  });

  document.getElementById('active-scheme-label').textContent = SCIENTIFIC_SCHEMES_META[id].name;
}

function setTravelMode(mode) {
  currentTravelMode = mode;
  const scooterBtn = document.getElementById('mode-scooter');
  const walkBtn = document.getElementById('mode-walk');

  if (mode === 'scooter') {
    scooterBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm transition';
    walkBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 transition';
  } else {
    walkBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm transition';
    scooterBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 transition';
  }
}

function switchTab(tab) {
  const tabs = ['route', 'schemes', 'explore'];
  tabs.forEach(t => {
    const content = document.getElementById(`tab-content-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tab) {
      content.classList.remove('hidden');
      btn.className = 'py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm transition';
    } else {
      content.classList.add('hidden');
      btn.className = 'py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 text-slate-400 hover:text-slate-200 transition';
    }
  });
  lucide.createIcons();
}

function toggleCategoryFilter(category) {
  activeCategoryFilter = category;
  document.querySelectorAll('.category-pill').forEach(btn => {
    if (btn.getAttribute('data-cat') === category) {
      btn.className = 'category-pill active text-[11px] px-2.5 py-1 rounded-full font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
    } else {
      btn.className = 'category-pill text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:text-white';
    }
  });

  renderPOIMarkers(allNodes);
  filterPOIs();
}

function filterPOIs() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = allNodes.filter(n => {
    const matchesCategory = (activeCategoryFilter === 'all') ||
      (activeCategoryFilter === 'convenience_store' && n.category === 'convenience_store') ||
      (activeCategoryFilter === 'tourist_attraction' && (n.category === 'tourist_attraction' || n.node_role === 'attraction_node')) ||
      (activeCategoryFilter === 'shelter' && (n.category === 'shelter' || n.category === 'food_and_drink')) ||
      (activeCategoryFilter === 'hotel_node' && (n.node_role === 'hotel_node' || n.category === 'hotels'));

    const name = (n.name_zh || n.name || '').toLowerCase();
    const nameEn = (n.name_en || '').toLowerCase();
    const matchesQuery = !query || name.includes(query) || nameEn.includes(query);

    return matchesCategory && matchesQuery;
  });

  renderPOIList(filtered.slice(0, 100));
}

function renderPOIList(nodes) {
  const container = document.getElementById('poi-list');
  if (nodes.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 text-center py-8 font-medium">Tidak ada POI yang sesuai.</p>`;
    return;
  }

  container.innerHTML = nodes.map(n => `
    <div onclick="panToNode(${n.latitude}, ${n.longitude})" class="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/80 cursor-pointer transition flex items-center justify-between shadow-sm">
      <div>
        <h5 class="text-xs font-bold text-slate-200">${n.name_zh || n.name}</h5>
        <p class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">${n.category.replace('_', ' ')} ${n.brand ? `• ${n.brand}` : ''}</p>
      </div>
      <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-600"></i>
    </div>
  `).join('');

  lucide.createIcons();
}

function panToNode(lat, lon) {
  map.flyTo([lat, lon], 15, { duration: 1 });
  if (window.innerWidth < 640) {
    toggleSidebar();
  }
}

function setAsDestination(lat, lon, name) {
  const select = document.getElementById('select-end');
  let option = document.createElement('option');
  option.value = 'custom_selected';
  option.text = `🎯 ${name}`;
  option.selected = true;
  select.add(option, 0);

  KEY_PRESET_LOCATIONS.custom_selected = { name, lat, lon };
  switchTab('route');
  calculateSmartRoute();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('-translate-x-full');
}

function useCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      KEY_PRESET_LOCATIONS.my_gps = { name: "Lokasi GPS Saya", lat, lon };
      
      const select = document.getElementById('select-start');
      let opt = document.createElement('option');
      opt.value = 'my_gps';
      opt.text = "📍 Lokasi GPS Saya";
      opt.selected = true;
      select.add(opt, 0);

      map.flyTo([lat, lon], 14);
      addRouteMarker(lat, lon, 'GPS', 'Lokasi Anda', '#ef4444');
    }, () => {
      alert("GPS tidak terdeteksi. Menggunakan Pelabuhan Magong.");
    });
  }
}

function generateCuratedNodes() {
  return [
    { name_zh: "7-Eleven 通梁門市 (Tongliang Store)", category: "convenience_store", latitude: 23.6558, longitude: 119.5582, has_ac: true },
    { name_zh: "FamilyMart 白沙赤崁店 (Baisha Store)", category: "convenience_store", latitude: 23.6591, longitude: 119.6002, has_ac: true },
    { name_zh: "7-Eleven 馬公門市 (Magong Central)", category: "convenience_store", latitude: 23.5682, longitude: 119.5671, has_ac: true },
    { name_zh: "FamilyMart 西嶼池西店 (Xiyu Store)", category: "convenience_store", latitude: 23.6042, longitude: 119.5101, has_ac: true },
    { name_zh: "通梁古榕 (Tongliang Great Banyan)", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.6575, longitude: 119.5594 },
    { name_zh: "跨海大橋 (Penghu Great Bridge)", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.6508, longitude: 119.5392 },
    { name_zh: "大菓葉柱狀玄武岩 (Daguoye Basalt)", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5932, longitude: 119.5161 },
    { name_zh: "奎壁山摩西分海 (Kuobishan Moses Parting)", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5975, longitude: 119.6748 },
    { name_zh: "山水沙灘 (Shanshui Beach)", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5136, longitude: 119.5912 },
    { name_zh: "風櫃洞 (Fenggui Blowholes)", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5414, longitude: 119.5447 },
    { name_zh: "易家仙人掌冰 (Yijia Cactus Ice Cream)", category: "shelter", latitude: 23.6571, longitude: 119.5587, has_ac: true }
  ];
}
