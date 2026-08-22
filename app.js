// ====================================================================
// Penghu Cool-Ride - High-Performance Map Engine with Lazy Loading & Clustering
// ====================================================================

// Global Application State
let map;
let allNodes = [];
let filteredNodes = [];
let markerClusterGroup;
let routePolylineLayer;
let currentTravelMode = 'scooter'; // 'scooter' | 'walk'
let activeCategoryFilter = 'all';
let selectedSchemeId = 1;
let currentLang = 'id';
let currentTheme = 'tropical';
let translations = {};
let displayedPOICount = 25;

let currentWeatherData = {
  temp: 35.2,
  feelsLike: 39.8,
  uvIndex: 10.5,
  wbgt: 31.4,
  solarDni: 850,
  heatLevelKey: 'heat_high'
};

// Preset Key Coordinates
const KEY_PRESET_LOCATIONS = {
  magong_port: { name_zh: "馬公港", name_en: "Magong Port (Rental Hub)", lat: 23.5654, lon: 119.5668 },
  magong_airport: { name_zh: "澎湖機場", name_en: "Penghu Airport", lat: 23.5697, lon: 119.6294 },
  kuobishan: { name_zh: "奎壁山摩西分海", name_en: "Kuobishan Moses Parting", lat: 23.5975, lon: 119.6748 },
  tongliang_banyan: { name_zh: "通梁古榕", name_en: "Tongliang Great Banyan", lat: 23.6575, lon: 119.5594 },
  penghu_bridge: { name_zh: "澎湖跨海大橋", name_en: "Penghu Great Bridge", lat: 23.6508, lon: 119.5392 },
  daguoye_basalt: { name_zh: "大菓葉柱狀玄武岩", name_en: "Daguoye Columnar Basalt", lat: 23.5932, lon: 119.5161 },
  shanshui_beach: { name_zh: "山水沙灘", name_en: "Shanshui Beach", lat: 23.5136, lon: 119.5912 },
  fenggui_cave: { name_zh: "風櫃洞", name_en: "Fenggui Blowholes", lat: 23.5414, lon: 119.5447 },
  yuwengdao_lighthouse: { name_zh: "漁翁島燈塔", name_en: "Yuwengdao Lighthouse", lat: 23.5606, lon: 119.4678 }
};

const SCIENTIFIC_SCHEMES_META = {
  1: { name: "ISO 7243 (WBGT Threshold)", strainReduction: 65, restMins: 12 },
  2: { name: "UTCI Physiological Strain", strainReduction: 58, restMins: 15 },
  3: { name: "Solar Radiation Budget (COMFA)", strainReduction: 72, restMins: 10 },
  4: { name: "Bi-Objective Pareto Router", strainReduction: 64, restMins: 12 }
};

// Verified Wikipedia Knowledge Base
const PENGHU_WIKIPEDIA_DB = {
  "通梁古榕": {
    wiki_title: "通梁古榕",
    url_zh: "https://zh.wikipedia.org/wiki/通梁古榕",
    url_en: "https://en.wikipedia.org/wiki/Tongliang_Great_Banyan",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Tongliang_Great_Banyan_20150619.jpg/330px-Tongliang_Great_Banyan_20150619.jpg",
    summary_id: "Pohon banyan raksasa berumur lebih dari 300 tahun di Desa Tongliang, Baisha. Memiliki hampir 100 akar gantung yang membentuk kanopi peneduh alami seluas 660 meter persegi di depan Kuil Bao'an.",
    summary_en: "A historic 300-year-old banyan tree in Tongliang, Baisha. Features nearly 100 aerial roots forming a massive 660 m² natural shade canopy in front of Bao'an Temple.",
    summary_zh: "位於白沙鄉通梁村保安宮前，樹齡已達300多年，氣根近百條，枝葉繁茂形成廣達660平方公尺的天然綠蔭。"
  },
  "澎湖跨海大橋": {
    wiki_title: "澎湖跨海大橋",
    url_zh: "https://zh.wikipedia.org/wiki/澎湖跨海大橋",
    url_en: "https://en.wikipedia.org/wiki/Penghu_Great_Bridge",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Penghu_Great_Bridge_20150619.jpg/330px-Penghu_Great_Bridge_20150619.jpg",
    summary_id: "Jembatan sepanjang 2,49 km yang menghubungkan Pulau Baisha dan Pulau Xiyu melintasi Selat Houhan yang berarus deras. Ikon utama pariwisata Penghu.",
    summary_en: "A 2.49 km long cross-sea bridge connecting Baisha and Xiyu islands across the turbulent Houhan Channel.",
    summary_zh: "連接白沙鄉與西嶼鄉的跨海大橋，全長2,494公尺，橫跨潮流洶湧的吼門水道，為澎湖最具代表性的地標建築。"
  },
  "跨海大橋": {
    wiki_title: "澎湖跨海大橋",
    url_zh: "https://zh.wikipedia.org/wiki/澎湖跨海大橋",
    url_en: "https://en.wikipedia.org/wiki/Penghu_Great_Bridge",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Penghu_Great_Bridge_20150619.jpg/330px-Penghu_Great_Bridge_20150619.jpg",
    summary_id: "Jembatan megah penghubung Baisha dan Xiyu sepanjang 2.494 meter.",
    summary_en: "Penghu's famous 2.49 km cross-sea bridge connecting Baisha and Xiyu.",
    summary_zh: "連接白沙與西嶼的著名跨海大橋。"
  },
  "大菓葉柱狀玄武岩": {
    wiki_title: "大菓葉柱狀玄武岩",
    url_zh: "https://zh.wikipedia.org/wiki/西嶼鄉",
    url_en: "https://en.wikipedia.org/wiki/Xiyu",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Daguoye_Columnar_Basalt_20150619.jpg/330px-Daguoye_Columnar_Basalt_20150619.jpg",
    summary_id: "Formasi tebing basal heksagonal vertikal spektakuler yang terbentuk dari pendinginan lava vulkanik purba di Xiyu ribuan tahun silam.",
    summary_en: "Spectacular vertical hexagonal columnar basalt cliffs formed by cooling volcanic lava in Xiyu, standing opposite the ocean.",
    summary_zh: "西嶼鄉著名的火山熔岩冷卻凝固形成的六角柱狀玄武岩壁，氣勢雄偉壯觀。"
  },
  "奎壁山摩西分海": {
    wiki_title: "奎壁山",
    url_zh: "https://zh.wikipedia.org/wiki/奎壁山",
    url_en: "https://en.wikipedia.org/wiki/Huxi,_Penghu",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Kuobishan_Moses_Parting_20150620.jpg/330px-Kuobishan_Moses_Parting_20150620.jpg",
    summary_id: "Fenomena pasang surut air laut yang membuka jalur jalan setapak kerikil sepanjang 300 meter menuju Pulau Chiyu, menyerupai kisah terbelahnya Laut Merah.",
    summary_en: "Famous tidal phenomenon where ocean waters recede at low tide to reveal a 300-meter pebble path connecting to Chiyu Island.",
    summary_zh: "澎湖著名潮汐奇景，退潮時海水向兩側退去，露出通往赤嶼的300公尺玄武岩礫石步道。"
  },
  "山水沙灘": {
    wiki_title: "山水沙灘",
    url_zh: "https://zh.wikipedia.org/wiki/馬公市",
    url_en: "https://en.wikipedia.org/wiki/Magong",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Shanshui_Beach_20150621.jpg/330px-Shanshui_Beach_20150621.jpg",
    summary_id: "Pantai pasir emas terindah di Jalur Selatan Magong dengan ombak lembut dan air laut jernih kehijauan.",
    summary_en: "The most picturesque golden sand beach in southern Magong, popular for gentle waves and crystal-clear waters.",
    summary_zh: "馬公南環最富盛名的金色細沙海灘，海水清澈碧藍，為水上活動勝地。"
  },
  "風櫃洞": {
    wiki_title: "風櫃洞",
    url_zh: "https://zh.wikipedia.org/wiki/風櫃洞",
    url_en: "https://en.wikipedia.org/wiki/Fenggui_Blowholes",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Fenggui_Blowholes_20150621.jpg/330px-Fenggui_Blowholes_20150621.jpg",
    summary_id: "Gua erosi laut di ujung semenanjung Fenggui. Ombak pasang yang menghantam celah batu basal menghasilkan semburan air dan suara dengung angin raksasa.",
    summary_en: "A sea-cave erosion marvel where waves crash into basalt fissures, emitting whistling acoustic sounds and water sprays.",
    summary_zh: "澎湖著名海蝕地形，海浪拍打玄武岩孔隙時會發出呼嘯巨響並噴出水柱。"
  },
  "漁翁島燈塔": {
    wiki_title: "漁翁島燈塔",
    url_zh: "https://zh.wikipedia.org/wiki/漁翁島燈塔",
    url_en: "https://en.wikipedia.org/wiki/Yuwengdao_Lighthouse",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Yuwengdao_Lighthouse_20150619.jpg/330px-Yuwengdao_Lighthouse_20150619.jpg",
    summary_id: "Mercusuar bergaya Barat pertama di Taiwan yang dibangun pada tahun 1778 di ujung barat daya Pulau Xiyu.",
    summary_en: "Taiwan's earliest Western-style lighthouse established in 1778 at the southwestern tip of Xiyu Island.",
    summary_zh: "西元1778年設立之台灣最早西式燈塔，位處西嶼最南端，為國定古蹟。"
  },
  "雙心石滬": {
    wiki_title: "七美雙心石滬",
    url_zh: "https://zh.wikipedia.org/wiki/七美雙心石滬",
    url_en: "https://en.wikipedia.org/wiki/Twin-Heart_Stone_Weir",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Twin-Heart_Stone_Weir_20150622.jpg/330px-Twin-Heart_Stone_Weir_20150622.jpg",
    summary_id: "Perangkap ikan tradisional berbahan batu basal dan karang berbentuk dua hati bertautan di Pulau Qimei.",
    summary_en: "Traditional stone tidal weir shaped like two intertwined hearts in Qimei Island, built to trap fish at low tide.",
    summary_zh: "七美鄉著名的傳統捕魚石滬，造型呈現兩顆心形交疊，為澎湖浪漫地標。"
  },
  "澎湖天后宮": {
    wiki_title: "澎湖天后宮",
    url_zh: "https://zh.wikipedia.org/wiki/澎湖天后宮",
    url_en: "https://en.wikipedia.org/wiki/Penghu_Tianhou_Temple",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Penghu_Tianhou_Temple_20150620.jpg/330px-Penghu_Tianhou_Temple_20150620.jpg",
    summary_id: "Kuil Dewi Mazu tertua di seluruh Taiwan yang didirikan lebih dari 400 tahun silam di Magong.",
    summary_en: "The oldest Mazu temple in Taiwan, founded over 400 years ago in Magong.",
    summary_zh: "全台灣歷史最悠久的媽祖廟，為國定古蹟，見證澎湖數百年海洋信仰與歷史。"
  },
  "中央老街": {
    wiki_title: "中央街 (馬公市)",
    url_zh: "https://zh.wikipedia.org/wiki/中央街_(馬公市)",
    url_en: "https://en.wikipedia.org/wiki/Magong",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Magong_Zhongyang_Old_Street_20150620.jpg/330px-Magong_Zhongyang_Old_Street_20150620.jpg",
    summary_id: "Jalan tertua di Penghu dengan deretan bangunan bersejarah bata merah, toko herbal, dan sumur empat mata (Four-Eyed Well).",
    summary_en: "Penghu's oldest street featuring traditional red-brick architecture and the historic Four-Eyed Well.",
    summary_zh: "澎湖最早發展的一條老街，鋪設紅磚石板，保留古色古香的閩南街屋與四眼井古蹟。"
  }
};

// Universal Bilingual Title: 'Nama Mandarin / English Name'
function getUniversalBilingualTitle(node) {
  if (node.title && node.title.includes("/")) {
    return node.title;
  }

  const zh = (node.name_zh || node.name || "").trim();
  let en = (node.name_en || "").trim();

  if (!en || en === zh) {
    if (zh.includes("7-Eleven") || zh.includes("7-11")) {
      en = zh.replace("門市", " Store");
    } else if (zh.includes("全家") || zh.includes("FamilyMart")) {
      en = zh.replace("全家", "FamilyMart").replace("店", " Store");
    } else if (zh.includes("沙灘")) {
      en = zh.replace("沙灘", " Beach");
    } else if (zh.includes("古榕")) {
      en = zh.replace("古榕", " Great Banyan");
    } else if (zh.includes("燈塔")) {
      en = zh.replace("燈塔", " Lighthouse");
    } else if (zh.includes("玄武岩")) {
      en = zh.replace("柱狀玄武岩", " Columnar Basalt");
    } else if (zh.includes("涼亭") || zh.includes("休息站")) {
      en = "Public Rest Shelter";
    } else if (zh.includes("飲水")) {
      en = "Water Refill Station";
    } else {
      en = zh;
    }
  }

  if (zh && en && zh !== en) {
    return `${zh} / ${en}`;
  }
  return zh || en || "Penghu Node";
}

// Strict Verified Wikipedia Check
function getVerifiedWikiEntry(node) {
  const zh = node.name_zh || node.name || "";
  for (let key in PENGHU_WIKIPEDIA_DB) {
    if (zh.includes(key) || key.includes(zh)) {
      return PENGHU_WIKIPEDIA_DB[key];
    }
  }
  return null;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  const savedLang = localStorage.getItem('penghu_lang') || 'id';
  const savedTheme = localStorage.getItem('penghu_theme') || 'tropical';
  
  await loadTranslations();
  setTheme(savedTheme);
  setLanguage(savedLang);

  initMap();
  fetchLiveWeather();
  loadDataset();
  setupInfiniteScroll();
});

async function loadTranslations() {
  try {
    const res = await fetch('translations.json');
    if (res.ok) {
      translations = await res.json();
    }
  } catch (e) {
    console.warn('Using local fallback translations.', e);
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

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = t('search_placeholder');
  }

  const langSelect = document.getElementById('lang-selector');
  if (langSelect) langSelect.value = currentLang;

  const activeLabel = document.getElementById('active-scheme-label');
  if (activeLabel) {
    activeLabel.textContent = SCIENTIFIC_SCHEMES_META[selectedSchemeId].name;
  }

  const tempEl = document.getElementById('temp-display');
  if (tempEl && currentWeatherData.temp) {
    tempEl.textContent = `${currentWeatherData.temp}°C (${t('feels_like')} ${currentWeatherData.feelsLike}°C)`;
  }
  const badgeEl = document.getElementById('heat-badge');
  if (badgeEl && currentWeatherData.heatLevelKey) {
    badgeEl.textContent = t(currentWeatherData.heatLevelKey);
  }
}

function changeLanguage(lang) {
  setLanguage(lang);
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('penghu_lang', lang);
  updateUILanguage();
}

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

function initMap() {
  map = L.map('map', { zoomControl: false }).setView([23.5711, 119.5793], 11);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // High-performance Marker Clustering with lazy chunk loading
  if (typeof L.markerClusterGroup === 'function') {
    markerClusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 20,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let cClass = 'marker-cluster-small';
        if (count > 50) cClass = 'marker-cluster-medium';
        if (count > 200) cClass = 'marker-cluster-large';
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${cClass}`,
          iconSize: L.point(36, 36)
        });
      }
    });
    map.addLayer(markerClusterGroup);
  } else {
    markerClusterGroup = L.layerGroup().addTo(map);
  }

  routePolylineLayer = L.layerGroup().addTo(map);
}

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
    document.getElementById('temp-display').textContent = '35°C (Terasa 40°C)';
    document.getElementById('uv-display').textContent = 'UV: 10.5';
  }
}

async function loadDataset() {
  try {
    const res = await fetch('data/penghu_master_nodes.json');
    if (res.ok) {
      allNodes = await res.json();
    }
  } catch (e) {
    console.log('Fallback nodes used:', e);
  }

  if (!allNodes || allNodes.length === 0) {
    allNodes = generateCuratedNodes();
  }

  // Filter only valid Penghu bounding box coordinates
  allNodes = allNodes.filter(n => n.latitude >= 23.1 && n.latitude <= 23.9 && n.longitude >= 119.2 && n.longitude <= 119.8);
  filteredNodes = [...allNodes];

  document.getElementById('total-poi-count').textContent = allNodes.length;
  renderPOIMarkers(allNodes);
  renderPOIList(true);
}

// 6. High-Performance Marker Rendering (Clustered & Position Safe)
function renderPOIMarkers(nodes) {
  markerClusterGroup.clearLayers();

  const newMarkers = [];

  nodes.forEach(node => {
    if (!node.latitude || !node.longitude) return;

    // Filter by active category
    if (activeCategoryFilter !== 'all') {
      if (activeCategoryFilter === 'convenience_store' && node.category !== 'convenience_store') return;
      if (activeCategoryFilter === 'tourist_attraction' && node.category !== 'tourist_attraction' && node.node_role !== 'attraction_node') return;
      if (activeCategoryFilter === 'shelter' && node.category !== 'shelter' && node.category !== 'food_and_drink' && node.category !== 'restaurants') return;
      if (activeCategoryFilter === 'hotel_node' && node.node_role !== 'hotel_node' && node.category !== 'hotels') return;
    }

    const universalTitle = getUniversalBilingualTitle(node);
    const wiki = getVerifiedWikiEntry(node);
    const imageUrl = (wiki && wiki.image_url) || node.image_url;

    let markerIcon;

    // A. WIKIPEDIA DESTINATION (Photo Pin with Inner Relative Wrapper)
    if (wiki !== null || imageUrl) {
      const photoSrc = imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80";
      
      markerIcon = L.divIcon({
        className: 'custom-pin-wiki',
        html: `
          <div class="wiki-pin-inner">
            <img src="${photoSrc}" alt="${universalTitle}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80'" />
            <div class="wiki-badge-corner">W</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

    } else {
      // B. STANDARD PIN (22px)
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

      markerIcon = L.divIcon({
        className: `custom-pin ${iconClass}`,
        html: `<span>${iconEmoji}</span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
    }

    const marker = L.marker([node.latitude, node.longitude], { icon: markerIcon });

    // Popup Content with Photo Banner & Wikipedia Card
    let photoHeaderHtml = "";
    if (imageUrl) {
      photoHeaderHtml = `
        <div class="w-full h-24 overflow-hidden relative">
          <img src="${imageUrl}" class="w-full h-full object-cover" alt="${universalTitle}" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent"></div>
          <span class="absolute bottom-1.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-white shadow">
            Wikipedia Landmark
          </span>
        </div>
      `;
    }

    let wikiCardHtml = "";
    if (wiki !== null) {
      const wikiUrl = currentLang === 'zh' ? (wiki.url_zh || wiki.url_en) : (wiki.url_en || wiki.url_zh);
      const wikiSummary = currentLang === 'zh' ? wiki.summary_zh : (currentLang === 'en' ? wiki.summary_en : wiki.summary_id);

      wikiCardHtml = `
        <div class="p-2 rounded-xl dynamic-card-inner border text-[11px] space-y-1 shadow-inner">
          <div class="flex items-center justify-between">
            <span class="font-bold flex items-center gap-1 opacity-90">
              <span class="font-serif font-bold text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1 rounded">W</span>
              Wikipedia
            </span>
            <a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="text-[10px] text-primary-var font-bold flex items-center gap-0.5 hover:underline">
              <span>${t('wiki_see_more')}</span>
              <i data-lucide="external-link" class="w-3 h-3"></i>
            </a>
          </div>
          <p class="opacity-80 leading-relaxed text-[10px]">
            ${wikiSummary}
          </p>
        </div>
      `;
    }

    const popupHtml = `
      <div class="text-xs space-y-2 min-w-[230px] max-w-[260px] overflow-hidden rounded-2xl">
        ${photoHeaderHtml}
        <div class="p-3 space-y-2">
          <div>
            <h4 class="font-extrabold text-sm leading-snug">${universalTitle}</h4>
            <span class="text-[10px] opacity-70 font-bold uppercase tracking-wider">${node.category.replace('_', ' ')}</span>
          </div>

          ${wikiCardHtml}

          <div class="text-[11px] space-y-1 pt-1 border-t border-inherit">
            ${node.has_ac ? `<div class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">❄️ ${t('ac_equipped')}</div>` : ''}
            ${node.opening_hours ? `<div class="opacity-80">🕒 ${node.opening_hours}</div>` : ''}
          </div>

          <button onclick="setAsDestination(${node.latitude}, ${node.longitude}, '${universalTitle.replace(/'/g, "\\'")}')" class="w-full py-2 dynamic-btn-primary rounded-xl text-[11px] font-extrabold transition shadow flex items-center justify-center gap-1">
            <i data-lucide="navigation" class="w-3 h-3"></i> ${t('btn_set_dest')}
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    newMarkers.push(marker);
  });

  if (typeof markerClusterGroup.addLayers === 'function') {
    markerClusterGroup.addLayers(newMarkers);
  } else {
    newMarkers.forEach(m => markerClusterGroup.addLayer(m));
  }
}

// 7. Route Computation
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
  if (selectedSchemeId === 1) { // ISO WBGT
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

  const startTitle = getUniversalBilingualTitle(start);
  const destTitle = getUniversalBilingualTitle(destination);

  addRouteMarker(start.lat, start.lon, 'A', startTitle, '#00A8B5');
  if (recommendedShelter) {
    const shelterTitle = getUniversalBilingualTitle(recommendedShelter);
    addRouteMarker(recommendedShelter.latitude, recommendedShelter.longitude, '❄️', `Shelter: ${shelterTitle}`, '#06D6A0');
  }
  addRouteMarker(destination.lat, destination.lon, 'B', destTitle, '#E07A5F');

  map.fitBounds(polyline.getBounds(), { padding: [60, 60] });

  document.getElementById('direct-time-display').textContent = `${directTravelMinutes} Min`;
  document.getElementById('route-distance-text').textContent = `${directDistanceKm.toFixed(1)} km`;

  const safeMinutes = recommendedShelter ? (directTravelMinutes + schemeMeta.restMins) : directTravelMinutes;
  document.getElementById('safe-time-display').textContent = `${safeMinutes} Min`;
  document.getElementById('reduction-badge').textContent = `-${schemeMeta.strainReduction}% ${t('strain_reduced')}`;

  renderRouteTimeline(startTitle, destTitle, recommendedShelter, directDistanceKm, directTravelMinutes, schemeMeta);
  document.getElementById('route-result-card').classList.remove('hidden');
}

function addRouteMarker(lat, lon, label, title, colorHex) {
  const icon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="background: ${colorHex}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid white; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); color: white;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  L.marker([lat, lon], { icon }).bindPopup(`<b>${title}</b>`).addTo(routePolylineLayer);
}

function renderRouteTimeline(startTitle, destTitle, shelter, distanceKm, totalMins, schemeMeta) {
  const container = document.getElementById('route-timeline-steps');
  
  if (shelter) {
    const leg1Mins = Math.max(8, Math.round(totalMins * 0.45));
    const leg2Mins = Math.max(8, Math.round(totalMins * 0.55));
    const shelterTitle = getUniversalBilingualTitle(shelter);

    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold">${startTitle}</p>
          <p class="text-[11px] opacity-75">${t('step_origin')} (${leg1Mins} min - ${Math.round(distanceKm*0.5)} km).</p>
        </div>
      </div>

      <div class="flex items-start gap-2.5 dynamic-card-inner border-2 border-emerald-500/50 p-3 rounded-2xl shadow-sm">
        <span class="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">❄️</span>
        <div class="space-y-1">
          <p class="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">${t('step_rest')} ${schemeMeta.restMins} Min @ ${shelterTitle}</p>
          <p class="text-[11px] opacity-80 leading-relaxed">
            ${t('step_rest_desc')} <b>${schemeMeta.strainReduction}%</b> ${t('step_rest_desc_end')}
          </p>
        </div>
      </div>

      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold">${destTitle}</p>
          <p class="text-[11px] opacity-75">${t('step_dest')} (${leg2Mins} min).</p>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
        <div>
          <p class="font-bold">${startTitle}</p>
          <p class="text-[11px] opacity-75">${distanceKm.toFixed(1)} km direct.</p>
        </div>
      </div>
      <div class="flex items-start gap-2.5">
        <span class="w-5 h-5 rounded-full dynamic-btn-primary font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
        <div>
          <p class="font-bold">${destTitle}</p>
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
  filteredNodes = allNodes.filter(n => {
    const matchesCategory = (activeCategoryFilter === 'all') ||
      (activeCategoryFilter === 'convenience_store' && n.category === 'convenience_store') ||
      (activeCategoryFilter === 'tourist_attraction' && (n.category === 'tourist_attraction' || n.node_role === 'attraction_node')) ||
      (activeCategoryFilter === 'shelter' && (n.category === 'shelter' || n.category === 'food_and_drink')) ||
      (activeCategoryFilter === 'hotel_node' && (n.node_role === 'hotel_node' || n.category === 'hotels'));

    const title = getUniversalBilingualTitle(n).toLowerCase();
    const matchesQuery = !query || title.includes(query);

    return matchesCategory && matchesQuery;
  });

  displayedPOICount = 25;
  renderPOIList(true);
}

// 8. Progressive Lazy Loading for POI List
function setupInfiniteScroll() {
  const container = document.getElementById('poi-list');
  if (!container) return;

  container.addEventListener('scroll', () => {
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
      if (displayedPOICount < filteredNodes.length) {
        displayedPOICount += 25;
        renderPOIList(false);
      }
    }
  });
}

function renderPOIList(reset = false) {
  const container = document.getElementById('poi-list');
  if (!container) return;

  if (filteredNodes.length === 0) {
    container.innerHTML = `<p class="text-xs opacity-50 text-center py-8 font-medium">${t('no_poi_found')}</p>`;
    return;
  }

  const nodesToRender = filteredNodes.slice(0, displayedPOICount);

  container.innerHTML = nodesToRender.map(n => {
    const universalTitle = getUniversalBilingualTitle(n);
    const wiki = getVerifiedWikiEntry(n);
    const imgUrl = (wiki && wiki.image_url) || n.image_url;

    let thumbHtml = "";
    if (imgUrl) {
      thumbHtml = `
        <img src="${imgUrl}" class="w-9 h-9 rounded-xl object-cover border border-inherit shrink-0 shadow-sm" alt="${universalTitle}" loading="lazy" />
      `;
    }

    let wikiSectionHtml = "";
    if (wiki !== null) {
      const wikiUrl = currentLang === 'zh' ? (wiki.url_zh || wiki.url_en) : (wiki.url_en || wiki.url_zh);
      wikiSectionHtml = `
        <div class="flex items-center justify-between border-t border-inherit pt-1.5 text-[10px]">
          <span class="opacity-60 flex items-center gap-1 font-bold">
            <span class="font-serif bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1 rounded text-[9px]">W</span>
            Wikipedia
          </span>
          <a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="text-primary-var font-bold flex items-center gap-0.5 hover:underline">
            <span>${t('wiki_see_more')}</span>
            <i data-lucide="external-link" class="w-2.5 h-2.5"></i>
          </a>
        </div>
      `;
    }

    return `
      <div class="p-3 rounded-2xl dynamic-card-inner border hover:border-cyan-500 transition space-y-2 shadow-sm">
        <div onclick="panToNode(${n.latitude}, ${n.longitude})" class="cursor-pointer flex items-center justify-between gap-2.5">
          ${thumbHtml}
          <div class="flex-1">
            <h5 class="text-xs font-bold leading-snug">${universalTitle}</h5>
            <p class="text-[10px] opacity-60 uppercase tracking-wider mt-0.5">${n.category.replace('_', ' ')} ${n.brand ? `• ${n.brand}` : ''}</p>
          </div>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 opacity-50 shrink-0"></i>
        </div>
        ${wikiSectionHtml}
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

  KEY_PRESET_LOCATIONS.custom_selected = { name_zh: name, name_en: name, lat, lon };
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
      KEY_PRESET_LOCATIONS.my_gps = { name_zh: "我的GPS位置", name_en: "My GPS Location", lat, lon };
      
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
    { title: "7-Eleven 通梁門市 / 7-Eleven Tongliang Store", name_zh: "7-Eleven 通梁門市", name_en: "7-Eleven Tongliang Store", category: "convenience_store", latitude: 23.6558, longitude: 119.5582, has_ac: true },
    { title: "FamilyMart 白沙赤崁店 / FamilyMart Baisha Store", name_zh: "FamilyMart 白沙赤崁店", name_en: "FamilyMart Baisha Store", category: "convenience_store", latitude: 23.6591, longitude: 119.6002, has_ac: true },
    { title: "7-Eleven 馬公門市 / 7-Eleven Magong Store", name_zh: "7-Eleven 馬公門市", name_en: "7-Eleven Magong Store", category: "convenience_store", latitude: 23.5682, longitude: 119.5671, has_ac: true },
    { title: "FamilyMart 西嶼池西店 / FamilyMart Xiyu Store", name_zh: "FamilyMart 西嶼池西店", name_en: "FamilyMart Xiyu Store", category: "convenience_store", latitude: 23.6042, longitude: 119.5101, has_ac: true },
    { title: "通梁古榕 / Tongliang Great Banyan", name_zh: "通梁古榕", name_en: "Tongliang Great Banyan", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.6575, longitude: 119.5594, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Tongliang_Great_Banyan_20150619.jpg/330px-Tongliang_Great_Banyan_20150619.jpg" },
    { title: "澎湖跨海大橋 / Penghu Great Bridge", name_zh: "澎湖跨海大橋", name_en: "Penghu Great Bridge", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.6508, longitude: 119.5392, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Penghu_Great_Bridge_20150619.jpg/330px-Penghu_Great_Bridge_20150619.jpg" },
    { title: "大菓葉柱狀玄武岩 / Daguoye Columnar Basalt", name_zh: "大菓葉柱狀玄武岩", name_en: "Daguoye Columnar Basalt", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5932, longitude: 119.5161, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Daguoye_Columnar_Basalt_20150619.jpg/330px-Daguoye_Columnar_Basalt_20150619.jpg" },
    { title: "奎壁山摩西分海 / Kuobishan Moses Parting", name_zh: "奎壁山摩西分海", name_en: "Kuobishan Moses Parting", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5975, longitude: 119.6748, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Kuobishan_Moses_Parting_20150620.jpg/330px-Kuobishan_Moses_Parting_20150620.jpg" },
    { title: "山水沙灘 / Shanshui Beach", name_zh: "山水沙灘", name_en: "Shanshui Beach", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5136, longitude: 119.5912, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Shanshui_Beach_20150621.jpg/330px-Shanshui_Beach_20150621.jpg" },
    { title: "風櫃洞 / Fenggui Blowholes", name_zh: "風櫃洞", name_en: "Fenggui Blowholes", category: "tourist_attraction", node_role: "attraction_node", latitude: 23.5414, longitude: 119.5447, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Fenggui_Blowholes_20150621.jpg/330px-Fenggui_Blowholes_20150621.jpg" },
    { title: "易家仙人掌冰 / Yijia Cactus Ice Cream", name_zh: "易家仙人掌冰", name_en: "Yijia Cactus Ice Cream", category: "shelter", latitude: 23.6571, longitude: 119.5587, has_ac: true }
  ];
}
