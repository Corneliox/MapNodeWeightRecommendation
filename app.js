// ====================================================================
// Penghu Cool-Ride - Core Application Logic
// ====================================================================

// Global State
let map;
let allNodes = [];
let markersLayer;
let routePolylineLayer;
let currentTravelMode = 'scooter'; // 'scooter' | 'walk'
let activeCategoryFilter = 'all';
let currentWeatherData = {
  temp: 34.5,
  feelsLike: 39.2,
  uvIndex: 9.8,
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

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchLiveWeather();
  loadDataset();
});

// 1. Initialize Leaflet Map
function initMap() {
  // Center on Penghu Archipelago
  map = L.map('map', {
    zoomControl: false
  }).setView([23.5711, 119.5793], 11);

  // Add Zoom Control to bottom-left
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  // Dark Map Tiles (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  routePolylineLayer = L.layerGroup().addTo(map);
}

// 2. Fetch Live Weather & UV from Open-Meteo API
async function fetchLiveWeather() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=23.57&longitude=119.57&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&hourly=uv_index&timezone=Asia%2FTaipei';

  try {
    const res = await fetch(url);
    const data = await res.json();

    const currentTemp = Math.round(data.current.temperature_2m);
    const feelsLike = Math.round(data.current.apparent_temperature);
    
    // Get current hour UV Index
    const currentHour = new Date().getHours();
    const uvIndex = data.hourly?.uv_index?.[currentHour] || 8.5;

    // Calculate Heat Danger Level
    let heatLevel = 'MODERATE';
    let badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    let warningText = `Suhu terasa di Penghu mencapai ${feelsLike}°C (UV: ${uvIndex}). Rute motor > 15 menit otomatis disisipi titik singgah minimarket ber-AC & hidrasi.`;

    if (feelsLike >= 38 || uvIndex >= 11) {
      heatLevel = 'EXTREME';
      badgeClass = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
      warningText = `BAHAYA HEATSTROKE: Suhu terasa ${feelsLike}°C & UV ${uvIndex}! Sangat disarankan beristirahat di minimarket setiap 10-15 menit berkendara.`;
    } else if (feelsLike >= 34 || uvIndex >= 8) {
      heatLevel = 'HIGH';
      badgeClass = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    } else if (feelsLike < 29) {
      heatLevel = 'LOW';
      badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      warningText = `Kondisi cuaca nyaman (${feelsLike}°C). Tetap bawa air minum selama perjalanan.`;
    }

    currentWeatherData = { temp: currentTemp, feelsLike, uvIndex, heatLevel };

    // Update Navbar Widget
    document.getElementById('temp-display').textContent = `${currentTemp}°C (Terasa ${feelsLike}°C)`;
    document.getElementById('uv-display').textContent = `UV: ${uvIndex}`;
    
    const badgeEl = document.getElementById('heat-badge');
    badgeEl.textContent = heatLevel;
    badgeEl.className = `text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${badgeClass}`;

    // Update Warning Box
    document.getElementById('climate-warning-desc').textContent = warningText;

  } catch (err) {
    console.warn('Gagal memuat live weather, menggunakan data simulasi Penghu:', err);
    document.getElementById('temp-display').textContent = '33°C (Terasa 37°C)';
    document.getElementById('uv-display').textContent = 'UV: 9.5';
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
    console.log('Fetching local json via fallback:', e);
  }

  // If local file fetch fails or is empty, use embedded curated key nodes
  if (!allNodes || allNodes.length === 0) {
    allNodes = generateCuratedNodes();
  }

  document.getElementById('total-poi-count').textContent = allNodes.length;
  renderPOIMarkers(allNodes);
  renderPOIList(allNodes.slice(0, 100)); // Render first 100 in list for smooth performance
}

// Render Markers on Map with Category Filtering
function renderPOIMarkers(nodes) {
  markersLayer.clearLayers();

  // Limit rendering to prevent map lagging if all 2000 are plotted at once
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
      <div class="text-xs space-y-1.5 min-w-[200px]">
        <div class="flex items-center gap-1.5">
          <span class="text-base">${iconEmoji}</span>
          <h4 class="font-bold text-slate-100">${node.name_zh || node.name}</h4>
        </div>
        ${node.name_en ? `<p class="text-[10px] text-slate-400 italic">${node.name_en}</p>` : ''}
        <div class="pt-1 border-t border-slate-700/60 text-[11px] space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Kategori:</span>
            <span class="text-cyan-400 font-semibold uppercase">${node.category.replace('_', ' ')}</span>
          </div>
          ${node.has_ac ? `<div class="text-emerald-400 font-semibold flex items-center gap-1"><i data-lucide="snowflake" class="w-3 h-3"></i> Dilengkapi AC / Pendingin</div>` : ''}
          ${node.opening_hours ? `<div class="text-slate-300">🕒 ${node.opening_hours}</div>` : ''}
          ${node.fee_info ? `<div class="text-amber-300 font-semibold">🎟️ ${node.fee_info}</div>` : ''}
        </div>
        <button onclick="setAsDestination(${node.latitude}, ${node.longitude}, '${(node.name_zh || node.name).replace(/'/g, "\\'")}')" class="mt-2 w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold transition">
          Jadikan Tujuan Rute
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
  });
}

// 4. SMART CLIMATE ROUTE CALCULATOR
function calculateSmartRoute() {
  const startKey = document.getElementById('select-start').value;
  const endKey = document.getElementById('select-end').value;

  const start = KEY_PRESET_LOCATIONS[startKey] || KEY_PRESET_LOCATIONS.magong_port;
  const destination = KEY_PRESET_LOCATIONS[endKey] || KEY_PRESET_LOCATIONS.tongliang_banyan;

  routePolylineLayer.clearLayers();

  // 1. Calculate direct Euclidean / Geodesic Distance
  const directDistanceKm = getDistanceKm(start.lat, start.lon, destination.lat, destination.lon);
  
  // Speed model: Scooter ~35 km/h, Walk ~4.5 km/h
  const speedKmH = currentTravelMode === 'scooter' ? 35 : 4.5;
  const directTravelMinutes = Math.round((directDistanceKm / speedKmH) * 60);

  // 2. Climate-Conditioning Check:
  // If travel time > 15 mins under High/Extreme heat, inject a Shelter/Convenience Store Node
  const needsCoolingStop = directTravelMinutes >= 15 && (currentWeatherData.heatLevel === 'HIGH' || currentWeatherData.heatLevel === 'EXTREME' || currentWeatherData.feelsLike >= 34);

  let recommendedShelter = null;
  if (needsCoolingStop) {
    // Find midpoint
    const midLat = (start.lat + destination.lat) / 2;
    const midLon = (start.lon + destination.lon) / 2;
    recommendedShelter = findNearestShelter(midLat, midLon);
  }

  // 3. Construct Route Coordinates
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

  // Draw Polyline on Map
  const polyline = L.polyline(routeCoords, {
    color: '#06b6d4',
    weight: 5,
    opacity: 0.85,
    dashArray: '8, 8',
    lineJoin: 'round'
  }).addTo(routePolylineLayer);

  // Add Special Route Pin Markers
  addRouteMarker(start.lat, start.lon, 'A', 'Titik Mulai', '#3b82f6');
  if (recommendedShelter) {
    addRouteMarker(recommendedShelter.latitude, recommendedShelter.longitude, '❄️', `Shelter: ${recommendedShelter.name}`, '#10b981');
  }
  addRouteMarker(destination.lat, destination.lon, 'B', 'Destinasi Wisata', '#ef4444');

  // Zoom map to fit route
  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

  // 4. Render Step-by-Step Itinerary
  renderRouteTimeline(start, destination, recommendedShelter, directDistanceKm, directTravelMinutes);

  // Show result card
  document.getElementById('route-result-card').classList.remove('hidden');
}

function addRouteMarker(lat, lon, label, title, colorHex) {
  const icon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="background: ${colorHex}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 12px;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  L.marker([lat, lon], { icon }).bindPopup(`<b>${title}</b>`).addTo(routePolylineLayer);
}

// Render Step-by-step Itinerary Card
function renderRouteTimeline(start, dest, shelter, distanceKm, totalMins) {
  const container = document.getElementById('route-timeline-steps');
  
  if (shelter) {
    const leg1Mins = Math.max(8, Math.round(totalMins * 0.45));
    const leg2Mins = Math.max(8, Math.round(totalMins * 0.55));
    const totalWithRest = leg1Mins + 15 + leg2Mins;

    document.getElementById('route-duration-badge').textContent = `Total: ${totalWithRest} Menit (Inc. Istirahat)`;

    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold text-slate-200">${start.name}</p>
          <p class="text-[11px] text-slate-400">Mulai perjalanan berkendara (${leg1Mins} menit - ${Math.round(distanceKm*0.5)} km).</p>
        </div>
      </div>

      <div class="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg my-1">
        <span class="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0">❄️</span>
        <div>
          <div class="flex items-center gap-1.5">
            <p class="font-bold text-emerald-300">Wajib Istirahat 15 Menit di ${shelter.name}</p>
            <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">AC & Hidrasi</span>
          </div>
          <p class="text-[11px] text-emerald-200/80 mt-0.5">
            Pendinginan suhu tubuh untuk mencegah dehidrasi sebelum melanjutkan perjalanan ke wilayah terbuka.
          </p>
        </div>
      </div>

      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold text-slate-200">${dest.name}</p>
          <p class="text-[11px] text-slate-400">Tiba di lokasi wisata utama (${leg2Mins} menit lanjutan).</p>
        </div>
      </div>
    `;
  } else {
    document.getElementById('route-duration-badge').textContent = `Total: ${totalMins} Menit`;

    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold text-slate-200">${start.name}</p>
          <p class="text-[11px] text-slate-400">Jarak tempuh langsung (${distanceKm.toFixed(1)} km).</p>
        </div>
      </div>
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold text-slate-200">${dest.name}</p>
          <p class="text-[11px] text-slate-400">Durasi singkat di bawah 15 menit, aman untuk perjalanan langsung.</p>
        </div>
      </div>
    `;
  }

  lucide.createIcons();
}

// Find nearest shelter (7-Eleven, FamilyMart, Cactus Ice) from coordinates
function findNearestShelter(lat, lon) {
  const shelters = allNodes.filter(n => n.category === 'convenience_store' || n.category === 'shelter');
  if (shelters.length === 0) {
    return {
      name: "7-Eleven Tongliang Store (澎湖通梁門市)",
      latitude: 23.6558,
      longitude: 119.5582,
      category: "convenience_store"
    };
  }

  let nearest = shelters[0];
  let minDistance = Infinity;

  shelters.forEach(s => {
    const d = getDistanceKm(lat, lon, s.latitude, s.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = s;
    }
  });

  return nearest;
}

// Helper: Haversine distance in KM
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// UI Controls
function setTravelMode(mode) {
  currentTravelMode = mode;
  const scooterBtn = document.getElementById('mode-scooter');
  const walkBtn = document.getElementById('mode-walk');

  if (mode === 'scooter') {
    scooterBtn.className = 'py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
    walkBtn.className = 'py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200';
  } else {
    walkBtn.className = 'py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
    scooterBtn.className = 'py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200';
  }
}

function switchTab(tab) {
  const routeTab = document.getElementById('tab-content-route');
  const exploreTab = document.getElementById('tab-content-explore');
  const routeBtn = document.getElementById('tab-btn-route');
  const exploreBtn = document.getElementById('tab-btn-explore');

  if (tab === 'route') {
    routeTab.classList.remove('hidden');
    exploreTab.classList.add('hidden');
    routeBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 transition-all shadow-sm';
    exploreBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all';
  } else {
    exploreTab.classList.remove('hidden');
    routeTab.classList.add('hidden');
    exploreBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 transition-all shadow-sm';
    routeBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all';
  }
  lucide.createIcons();
}

function toggleCategoryFilter(category) {
  activeCategoryFilter = category;
  document.querySelectorAll('.category-pill').forEach(btn => {
    if (btn.getAttribute('data-cat') === category) {
      btn.className = 'category-pill active text-[11px] px-2.5 py-1 rounded-full font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
    } else {
      btn.className = 'category-pill text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:text-white';
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
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Tidak ada POI yang cocok.</p>`;
    return;
  }

  container.innerHTML = nodes.map(n => `
    <div onclick="panToNode(${n.latitude}, ${n.longitude})" class="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between">
      <div>
        <h5 class="text-xs font-bold text-slate-200">${n.name_zh || n.name}</h5>
        <p class="text-[10px] text-slate-400 uppercase tracking-wider">${n.category.replace('_', ' ')} ${n.brand ? `• ${n.brand}` : ''}</p>
      </div>
      <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500"></i>
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
    }, err => {
      alert("Tidak dapat mengakses GPS. Menggunakan Pelabuhan Magong sebagai titik awal.");
    });
  }
}

// Fallback Key Curated Nodes for Penghu
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
