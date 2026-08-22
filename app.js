// ====================================================================
// Penghu Cool-Ride - Core Application with Multi-Language & Theme Engine
// ====================================================================

// Global State
let map;
let allNodes = [];
let markersLayer;
let routePolylineLayer;
let currentTravelMode = 'scooter'; // 'scooter' | 'walk'
let activeCategoryFilter = 'all';
let selectedSchemeId = 1;
let currentLang = 'id';
let currentTheme = 'tropical';
let translations = {};

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
  magong_port: { name: "Pelabuhan Magong (Pusat Rental Motor)", name_en: "Magong Port (Scooter Hub)", name_zh: "馬公港 (租車中心)", lat: 23.5654, lon: 119.5668 },
  magong_airport: { name: "Bandara Penghu (Magong Airport)", name_en: "Penghu Magong Airport", name_zh: "澎湖機場 (馬公航空站)", lat: 23.5697, lon: 119.6294 },
  kuobishan: { name: "Kuobishan (Moses Sea Parting)", name_en: "Kuobishan Moses Sea Parting", name_zh: "奎壁山摩西分海", lat: 23.5975, lon: 119.6748 },
  tongliang_banyan: { name: "Pohon Beringin Raksasa Tongliang", name_en: "Tongliang Great Banyan", name_zh: "通梁古榕", lat: 23.6575, lon: 119.5594 },
  penghu_bridge: { name: "Jembatan Lintas Laut Penghu (Great Bridge)", name_en: "Penghu Great Bridge", name_zh: "澎湖跨海大橋", lat: 23.6508, lon: 119.5392 },
  daguoye_basalt: { name: "Kolom Basalt Daguoye (Xiyu)", name_en: "Daguoye Columnar Basalt", name_zh: "大菓葉柱狀玄武岩", lat: 23.5932, lon: 119.5161 },
  shanshui_beach: { name: "Pantai Shanshui (Jalur Selatan)", name_en: "Shanshui Beach (South Ring)", name_zh: "山水沙灘", lat: 23.5136, lon: 119.5912 },
  fenggui_cave: { name: "Fenggui Blowholes (Gua Angin)", name_en: "Fenggui Blowholes", name_zh: "風櫃洞", lat: 23.5414, lon: 119.5447 },
  yuwengdao_lighthouse: { name: "Mercusuar Yuwengdao", name_en: "Yuwengdao Lighthouse", name_zh: "漁翁島燈塔", lat: 23.5606, lon: 119.4678 }
};

const SCIENTIFIC_SCHEMES_META = {
  1: {
    name: "ISO 7243 (WBGT Threshold)",
    strainReduction: 65,
    restMins: 12
  },
  2: {
    name: "UTCI Physiological Strain",
    strainReduction: 58,
    restMins: 15
  },
  3: {
    name: "Solar Radiation Budget (COMFA)",
    strainReduction: 72,
    restMins: 10
  },
  4: {
    name: "Bi-Objective Pareto Router",
    strainReduction: 64,
    restMins: 12
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved preferences from localStorage
  const savedLang = localStorage.getItem('penghu_lang') || 'id';
  const savedTheme = localStorage.getItem('penghu_theme') || 'tropical';
  
  await loadTranslations();
  setTheme(savedTheme);
  setLanguage(savedLang);

  initMap();
  fetchLiveWeather();
  loadDataset();
});

// 1. Load Translations JSON
async function loadTranslations() {
  try {
    const res = await fetch('translations.json');
    if (res.ok) {
      translations = await res.json();
    }
  } catch (e) {
    console.warn('Could not load external translations.json, using fallback.', e);
  }
}

function t(key) {
  if (translations[currentLang] && translations[currentLang][key]) {
    return translations[currentLang][key];
  }
  return key;
}

function updateUILanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  // Update dropdown values
  const langSelect = document.getElementById('lang-selector');
  if (langSelect) langSelect.value = currentLang;

  // Re-render Scheme label
  const activeLabel = document.getElementById('active-scheme-label');
  if (activeLabel) {
    activeLabel.textContent = SCIENTIFIC_SCHEMES_META[selectedSchemeId].name;
  }
}

function changeLanguage(lang) {
  setLanguage(lang);
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('penghu_lang', lang);
  updateUILanguage();
  if (allNodes.length > 0) {
    renderPOIList(allNodes.slice(0, 100));
  }
}

// 2. Holiday Theme Switcher
function changeTheme(theme) {
  setTheme(theme);
}

function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('penghu_theme', theme);
  document.body.className = `theme-${theme} flex flex-col h-screen overflow-hidden antialiased font-['Plus_Jakarta_Sans'] selection:bg-cyan-500 selection:text-white`;

  const themeSelect = document.getElementById('theme-selector');
  if (themeSelect) themeSelect.value = theme;
}

// 3. Leaflet Map Initialization
function initMap() {
  map = L.map('map', { zoomControl: false }).setView([23.5711, 119.5793], 11);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  routePolylineLayer = L.layerGroup().addTo(map);
}

// 4. Live Open-Meteo Weather Fetcher
async function fetchLiveWeather() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=23.57&longitude=119.57&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&hourly=uv_index,direct_normal_irradiance&timezone=Asia%2FTaipei';

  try {
    const res = await fetch(url);
    const data = await res.json();

    const currentTemp = Math.round(data.current.temperature_2m);
    const feelsLike = Math.round(data.current.apparent_temperature);
    const currentHour = new Date().getHours();
    const uvIndex = data.hourly?.uv_index?.[currentHour] || 9.8;
    const solarDni = data.hourly?.direct_normal_irradiance?.[currentHour] || 850;
    const approxWbgt = Math.round((feelsLike * 0.75) + (uvIndex * 0.3));

    let heatLevelKey = 'heat_moderate';
    let badgeClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30';

    if (feelsLike >= 38 || uvIndex >= 11) {
      heatLevelKey = 'heat_extreme';
      badgeClass = 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40 animate-pulse';
    } else if (feelsLike >= 34 || uvIndex >= 8) {
      heatLevelKey = 'heat_high';
      badgeClass = 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/40';
    }

    currentWeatherData = { temp: currentTemp, feelsLike, uvIndex, wbgt: approxWbgt, solarDni, heatLevelKey };

    document.getElementById('temp-display').textContent = `${currentTemp}°C (${t('feels_like')} ${feelsLike}°C)`;
    document.getElementById('uv-display').textContent = `UV: ${uvIndex}`;
    
    const badgeEl = document.getElementById('heat-badge');
    badgeEl.textContent = t(heatLevelKey);
    badgeEl.className = `text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${badgeClass}`;

  } catch (err) {
    console.warn('Simulated weather fallback:', err);
    document.getElementById('temp-display').textContent = '35°C (Terasa 40°C)';
    document.getElementById('uv-display').textContent = 'UV: 10.5';
  }
}

// 5. Load Dataset (2,190 Nodes)
async function loadDataset() {
  try {
    const res = await fetch('data/penghu_master_nodes.json');
    if (res.ok) {
      allNodes = await res.json();
    }
  } catch (e) {
    console.log('Loading curated fallback nodes:', e);
  }

  if (!allNodes || allNodes.length === 0) {
    allNodes = generateCuratedNodes();
  }

  document.getElementById('total-poi-count').textContent = allNodes.length;
  renderPOIMarkers(allNodes);
  renderPOIList(allNodes.slice(0, 100));
}

// 6. Render POI Markers
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

    const displayName = currentLang === 'zh' ? (node.name_zh || node.name) : (node.name_en || node.name);

    const popupHtml = `
      <div class="text-xs space-y-1.5 min-w-[210px]">
        <div class="flex items-center gap-1.5">
          <span class="text-base">${iconEmoji}</span>
          <h4 class="font-bold">${displayName}</h4>
        </div>
        ${node.name_zh && currentLang !== 'zh' ? `<p class="text-[10px] opacity-75 italic">${node.name_zh}</p>` : ''}
        <div class="pt-1.5 border-t border-inherit text-[11px] space-y-1">
          <div class="flex justify-between">
            <span class="opacity-70">${t('category_label')}:</span>
            <span class="font-bold text-primary-var uppercase text-[10px]">${node.category.replace('_', ' ')}</span>
          </div>
          ${node.has_ac ? `<div class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">❄️ ${t('ac_equipped')}</div>` : ''}
          ${node.opening_hours ? `<div class="opacity-80">🕒 ${node.opening_hours}</div>` : ''}
          ${node.fee_info ? `<div class="text-amber-500 font-bold">🎟️ ${node.fee_info}</div>` : ''}
        </div>
        <button onclick="setAsDestination(${node.latitude}, ${node.longitude}, '${displayName.replace(/'/g, "\\'")}')" class="mt-2 w-full py-1.5 dynamic-btn-primary rounded-lg text-[10px] font-bold transition shadow">
          ${t('btn_set_dest')}
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
  });
}

// 7. Route Computation with Scientific Schemes
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
    color: '#00A8B5',
    weight: 5,
    opacity: 0.9,
    dashArray: '8, 8',
    lineJoin: 'round'
  }).addTo(routePolylineLayer);

  const startName = currentLang === 'zh' ? start.name_zh : (currentLang === 'en' ? start.name_en : start.name);
  const destName = currentLang === 'zh' ? destination.name_zh : (currentLang === 'en' ? destination.name_en : destination.name);

  addRouteMarker(start.lat, start.lon, 'A', startName, '#00A8B5');
  if (recommendedShelter) {
    const shelterName = currentLang === 'zh' ? (recommendedShelter.name_zh || recommendedShelter.name) : (recommendedShelter.name_en || recommendedShelter.name);
    addRouteMarker(recommendedShelter.latitude, recommendedShelter.longitude, '❄️', `Shelter: ${shelterName}`, '#06D6A0');
  }
  addRouteMarker(destination.lat, destination.lon, 'B', destName, '#E07A5F');

  map.fitBounds(polyline.getBounds(), { padding: [60, 60] });

  document.getElementById('direct-time-display').textContent = `${directTravelMinutes} Min`;
  document.getElementById('route-distance-text').textContent = `${directDistanceKm.toFixed(1)} km`;

  const safeMinutes = recommendedShelter ? (directTravelMinutes + schemeMeta.restMins) : directTravelMinutes;
  document.getElementById('safe-time-display').textContent = `${safeMinutes} Min`;
  document.getElementById('reduction-badge').textContent = `-${schemeMeta.strainReduction}% ${t('strain_reduced')}`;

  renderRouteTimeline(startName, destName, recommendedShelter, directDistanceKm, directTravelMinutes, schemeMeta);
  document.getElementById('route-result-card').classList.remove('hidden');
}

function addRouteMarker(lat, lon, label, title, colorHex) {
  const icon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="background: ${colorHex}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid white; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); color: white;">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  L.marker([lat, lon], { icon }).bindPopup(`<b>${title}</b>`).addTo(routePolylineLayer);
}

function renderRouteTimeline(startName, destName, shelter, distanceKm, totalMins, schemeMeta) {
  const container = document.getElementById('route-timeline-steps');
  
  if (shelter) {
    const leg1Mins = Math.max(8, Math.round(totalMins * 0.45));
    const leg2Mins = Math.max(8, Math.round(totalMins * 0.55));
    const shelterName = currentLang === 'zh' ? (shelter.name_zh || shelter.name) : (shelter.name_en || shelter.name || "7-Eleven Tongliang Store");

    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold">${startName}</p>
          <p class="text-[11px] opacity-75">${t('step_origin')} (${leg1Mins} min - ${Math.round(distanceKm*0.5)} km).</p>
        </div>
      </div>

      <div class="flex items-start gap-2.5 dynamic-card-inner border-2 border-emerald-500/50 p-2.5 rounded-2xl">
        <span class="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">❄️</span>
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5">
            <p class="font-bold text-emerald-600 dark:text-emerald-400">${t('step_rest')} ${schemeMeta.restMins} Min @ ${shelterName}</p>
          </div>
          <p class="text-[11px] opacity-80">
            ${t('step_rest_desc')} (-${schemeMeta.strainReduction}% Heat Strain).
          </p>
        </div>
      </div>

      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold">${destName}</p>
          <p class="text-[11px] opacity-75">${t('step_dest')} (${leg2Mins} min).</p>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold">${startName}</p>
          <p class="text-[11px] opacity-75">${distanceKm.toFixed(1)} km direct.</p>
        </div>
      </div>
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold">${destName}</p>
          <p class="text-[11px] opacity-75">${t('step_direct_desc')}</p>
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
      name_zh: "7-Eleven 通梁門市",
      name_en: "7-Eleven Tongliang Store",
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

function selectScheme(id) {
  selectedSchemeId = id;
  document.querySelectorAll('.scheme-card').forEach((card, index) => {
    if (index + 1 === id) {
      card.className = 'scheme-card active p-3.5 rounded-2xl border cursor-pointer shadow-sm';
    } else {
      card.className = 'scheme-card p-3.5 rounded-2xl dynamic-card border cursor-pointer';
    }
  });

  document.getElementById('active-scheme-label').textContent = SCIENTIFIC_SCHEMES_META[id].name;
}

function setTravelMode(mode) {
  currentTravelMode = mode;
  const scooterBtn = document.getElementById('mode-scooter');
  const walkBtn = document.getElementById('mode-walk');

  if (mode === 'scooter') {
    scooterBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 dynamic-btn-primary shadow-sm';
    walkBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 dynamic-card-inner border-inherit opacity-75 hover:opacity-100';
  } else {
    walkBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 dynamic-btn-primary shadow-sm';
    scooterBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 dynamic-card-inner border-inherit opacity-75 hover:opacity-100';
  }
}

function switchTab(tab) {
  const tabs = ['route', 'schemes', 'explore'];
  tabs.forEach(t => {
    const content = document.getElementById(`tab-content-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tab) {
      content.classList.remove('hidden');
      btn.className = 'py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 dynamic-btn-primary shadow transition';
    } else {
      content.classList.add('hidden');
      btn.className = 'py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition';
    }
  });
  lucide.createIcons();
}

function toggleCategoryFilter(category) {
  activeCategoryFilter = category;
  document.querySelectorAll('.category-pill').forEach(btn => {
    if (btn.getAttribute('data-cat') === category) {
      btn.className = 'category-pill active text-[11px] px-3 py-1 rounded-full font-bold dynamic-btn-primary shadow-sm';
    } else {
      btn.className = 'category-pill text-[11px] px-3 py-1 rounded-full font-medium dynamic-card-inner border border-inherit';
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
    container.innerHTML = `<p class="text-xs opacity-50 text-center py-8 font-medium">${t('no_poi_found')}</p>`;
    return;
  }

  container.innerHTML = nodes.map(n => {
    const displayName = currentLang === 'zh' ? (n.name_zh || n.name) : (n.name_en || n.name);
    return `
      <div onclick="panToNode(${n.latitude}, ${n.longitude})" class="p-3 rounded-2xl dynamic-card-inner border hover:border-cyan-500 cursor-pointer transition flex items-center justify-between shadow-sm">
        <div>
          <h5 class="text-xs font-bold">${displayName}</h5>
          <p class="text-[10px] opacity-60 uppercase tracking-wider mt-0.5">${n.category.replace('_', ' ')} ${n.brand ? `• ${n.brand}` : ''}</p>
        </div>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5 opacity-50"></i>
      </div>
    `;
  }).join('');

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
      KEY_PRESET_LOCATIONS.my_gps = { name: "Lokasi GPS Saya", name_en: "My GPS Location", name_zh: "我的GPS位置", lat, lon };
      
      const select = document.getElementById('select-start');
      let opt = document.createElement('option');
      opt.value = 'my_gps';
      opt.text = "📍 " + t('btn_gps');
      opt.selected = true;
      select.add(opt, 0);

      map.flyTo([lat, lon], 14);
      addRouteMarker(lat, lon, 'GPS', t('btn_gps'), '#EF4444');
    }, () => {
      alert("GPS tidak terdeteksi.");
    });
  }
}

function generateCuratedNodes() {
  return [
    { name_zh: "7-Eleven 通梁門市", name_en: "7-Eleven Tongliang Store", name: "7-Eleven Tongliang", category: "convenience_store", latitude: 23.6558, longitude: 119.5582, has_ac: true },
    { name_zh: "FamilyMart 白沙赤崁店", name_en: "FamilyMart Baisha Store", name: "FamilyMart Baisha", category: "convenience_store", latitude: 23.6591, longitude: 119.6002, has_ac: true },
    { name_zh: "7-Eleven 馬公門市", name_en: "7-Eleven Magong Store", name: "7-Eleven Magong", category: "convenience_store", latitude: 23.5682, longitude: 119.5671, has_ac: true },
    { name_zh: "FamilyMart 西嶼池西店", name_en: "FamilyMart Xiyu Store", name: "FamilyMart Xiyu", category: "convenience_store", latitude: 23.6042, longitude: 119.5101, has_ac: true },
    { name_zh: "通梁古榕", name_en: "Tongliang Great Banyan", name: "Tongliang Great Banyan", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.6575, longitude: 119.5594 },
    { name_zh: "跨海大橋", name_en: "Penghu Great Bridge", name: "Penghu Great Bridge", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.6508, longitude: 119.5392 },
    { name_zh: "大菓葉柱狀玄武岩", name_en: "Daguoye Columnar Basalt", name: "Daguoye Basalt", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5932, longitude: 119.5161 },
    { name_zh: "奎壁山摩西分海", name_en: "Kuobishan Moses Parting", name: "Kuobishan Moses Parting", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5975, longitude: 119.6748 },
    { name_zh: "山水沙灘", name_en: "Shanshui Beach", name: "Shanshui Beach", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5136, longitude: 119.5912 },
    { name_zh: "風櫃洞", name_en: "Fenggui Blowholes", name: "Fenggui Blowholes", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5414, longitude: 119.5447 },
    { name_zh: "易家仙人掌冰", name_en: "Yijia Cactus Ice Cream", name: "Yijia Cactus Ice Cream", category: "shelter", latitude: 23.6571, longitude: 119.5587, has_ac: true }
  ];
}
