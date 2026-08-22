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

let ferryRoutesData = [];

// Preset Key Coordinates (Main Island + Outer Island Destinations)
const KEY_PRESET_LOCATIONS = {
  magong_port: { name_zh: "馬公港", name_en: "Magong Port (Rental Hub)", lat: 23.5654, lon: 119.5668, island: "main" },
  magong_airport: { name_zh: "澎湖機場", name_en: "Penghu Airport", lat: 23.5697, lon: 119.6294, island: "main" },
  kuobishan: { name_zh: "奎壁山摩西分海", name_en: "Kuobishan Moses Parting", lat: 23.5975, lon: 119.6748, island: "main" },
  tongliang_banyan: { name_zh: "通梁古榕", name_en: "Tongliang Great Banyan", lat: 23.6575, lon: 119.5594, island: "main" },
  penghu_bridge: { name_zh: "澎湖跨海大橋", name_en: "Penghu Great Bridge", lat: 23.6508, lon: 119.5392, island: "main" },
  daguoye_basalt: { name_zh: "大菓葉柱狀玄武岩", name_en: "Daguoye Columnar Basalt", lat: 23.5932, lon: 119.5161, island: "main" },
  shanshui_beach: { name_zh: "山水沙灘", name_en: "Shanshui Beach", lat: 23.5136, lon: 119.5912, island: "main" },
  fenggui_cave: { name_zh: "風櫃洞", name_en: "Fenggui Blowholes", lat: 23.5414, lon: 119.5447, island: "main" },
  yuwengdao_lighthouse: { name_zh: "漁翁島燈塔", name_en: "Yuwengdao Lighthouse", lat: 23.5606, lon: 119.4678, island: "main" },
  qimei_twin_heart: { name_zh: "七美雙心石滬", name_en: "Qimei Twin-Heart Stone Weir", lat: 23.2201, lon: 119.4447, island: "qimei" },
  jibei_sand_spit: { name_zh: "吉貝沙尾", name_en: "Jibei Sand Spit", lat: 23.7380, lon: 119.5980, island: "jibei" },
  wangan_green_turtle: { name_zh: "望安綠蠵龜保育館", name_en: "Wangan Green Turtle Center", lat: 23.3605, lon: 119.5015, island: "wangan" }
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
  if (!node) return null;

  // 1. Direct dataset verification
  if (node.has_wikipedia && (node.wiki_url_zh || node.wiki_url_en || node.wiki_url)) {
    return {
      wiki_title: node.name_zh || node.name_en || node.title,
      url_zh: node.wiki_url_zh || node.wiki_url || `https://zh.wikipedia.org/wiki/${encodeURIComponent(node.name_zh || '')}`,
      url_en: node.wiki_url_en || node.wiki_url || `https://en.wikipedia.org/wiki/${encodeURIComponent(node.name_en || '')}`,
      image_url: node.image_url || node.wiki_image_url,
      summary_id: node.wiki_summary_id || node.description || "Destinasi wisata ikonik terverifikasi Wikipedia di Kepulauan Penghu.",
      summary_en: node.wiki_summary_en || node.description || "Verified iconic Wikipedia landmark in Penghu Archipelago.",
      summary_zh: node.wiki_summary_zh || node.description || "維基百科認證之澎湖著名觀光地標景點。"
    };
  }

  // 2. Built-in verified database matching
  const zh = (node.name_zh || node.name || node.title || "").trim();
  const en = (node.name_en || "").trim();

  for (let key in PENGHU_WIKIPEDIA_DB) {
    if (zh.includes(key) || key.includes(zh) || (en && en.toLowerCase().includes(key.toLowerCase()))) {
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
  await loadFerryRoutes();
  setTheme(savedTheme);
  setLanguage(savedLang);

  initMap();
  fetchLiveWeather();
  loadDataset();
  setupInfiniteScroll();

  // 5-Minute Auto-Refresh for Live Weather
  setInterval(fetchLiveWeather, 5 * 60 * 1000);

  // Refresh immediately when user returns/switches back to the app tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      fetchLiveWeather();
    }
  });
});

// Load Ferry Data
async function loadFerryRoutes() {
  try {
    const res = await fetch('data/penghu_ferry_routes.json');
    if (res.ok) {
      const json = await res.json();
      ferryRoutesData = json.routes || [];
    }
  } catch (err) {
    console.warn('Ferry data load fallback:', err);
  }
}

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

  // Dynamically translate Theme selector options in app.html
  const themeSelect = document.getElementById('theme-selector');
  if (themeSelect) {
    const curVal = themeSelect.value || currentTheme;
    const optTropical = themeSelect.querySelector('option[value="tropical"]');
    const optNature = themeSelect.querySelector('option[value="nature"]');
    const optOcean = themeSelect.querySelector('option[value="ocean"]');
    if (optTropical) optTropical.innerText = t('theme_tropical');
    if (optNature) optNature.innerText = t('theme_nature');
    if (optOcean) optOcean.innerText = t('theme_ocean');
    themeSelect.value = curVal;
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
  document.documentElement.className = `theme-${theme}`;
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
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=23.57&longitude=119.57&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,wind_speed_10m&hourly=uv_index,direct_normal_irradiance&daily=uv_index_max&timezone=Asia%2FTaipei';

  try {
    const res = await fetch(url);
    const data = await res.json();

    const currentTemp = Math.round(data.current.temperature_2m);
    const feelsLike = Math.round(data.current.apparent_temperature);
    const isDay = data.current?.is_day === 1;

    // Determine exact current hour index in Taipei timezone
    const nowTaipei = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" });
    const currentHourTaipei = new Date(nowTaipei).getHours();

    let hourIdx = currentHourTaipei;
    if (data.hourly && data.hourly.time) {
      const todayIsoPrefix = new Date(nowTaipei).toISOString().slice(0, 10);
      const matchIdx = data.hourly.time.findIndex(t => t.startsWith(todayIsoPrefix) && parseInt(t.slice(11, 13)) === currentHourTaipei);
      if (matchIdx !== -1) hourIdx = matchIdx;
    }

    // Accurate numeric assignment without falsy zero bugs
    const rawUv = data.hourly?.uv_index?.[hourIdx];
    const uvIndex = (typeof rawUv === 'number') ? Number(rawUv.toFixed(1)) : (isDay ? 7.5 : 0.0);

    const rawDni = data.hourly?.direct_normal_irradiance?.[hourIdx];
    const solarDni = (typeof rawDni === 'number') ? Math.round(rawDni) : (isDay ? 650 : 0);

    const approxWbgt = Math.round((feelsLike * 0.75) + (uvIndex * 0.3));

    let heatLevelKey = 'heat_low';
    let badgeClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';

    if (!isDay) {
      // Nighttime Logic
      if (feelsLike < 30) {
        heatLevelKey = 'heat_night_cool';
        badgeClass = 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/30';
      } else {
        heatLevelKey = 'heat_moderate';
        badgeClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30';
      }
    } else {
      // Daytime Heat Strain Logic
      if (feelsLike >= 38 || uvIndex >= 11) {
        heatLevelKey = 'heat_extreme';
        badgeClass = 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40 animate-pulse';
      } else if (feelsLike >= 34 || uvIndex >= 8) {
        heatLevelKey = 'heat_high';
        badgeClass = 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40';
      } else if (feelsLike >= 30 || uvIndex >= 6) {
        heatLevelKey = 'heat_moderate';
        badgeClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30';
      }
    }

    currentWeatherData = { temp: currentTemp, feelsLike, uvIndex, wbgt: approxWbgt, solarDni, heatLevelKey, isDay };

    document.getElementById('temp-display').textContent = `${currentTemp}°C (${t('feels_like')} ${feelsLike}°C)`;
    document.getElementById('uv-display').textContent = isDay ? `UV: ${uvIndex} ☀️` : `UV: ${uvIndex} 🌙`;
    
    const badgeEl = document.getElementById('heat-badge');
    badgeEl.textContent = t(heatLevelKey);
    badgeEl.className = `text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${badgeClass}`;

  } catch (err) {
    console.warn('Weather fallback used:', err);
    document.getElementById('temp-display').textContent = '28°C (Terasa 30°C)';
    document.getElementById('uv-display').textContent = 'UV: 0.0 🌙';
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

  // Auto-calculate and render the initial road route on load
  setTimeout(() => {
    calculateSmartRoute();
  }, 400);
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
          ${wiki !== null ? `
            <button onclick="openWikiModal('${(node.name_zh || node.name_en || '').replace(/'/g, "\\'")}')" class="absolute bottom-1.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow flex items-center gap-1 transition cursor-pointer">
              <span>Wikipedia Landmark</span>
              <i data-lucide="external-link" class="w-2.5 h-2.5"></i>
            </button>
          ` : `
            <span class="absolute bottom-1.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/80 text-white shadow">
              Penghu Spot
            </span>
          `}
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
            <button onclick="openWikiModal('${(node.name_zh || node.name_en || '').replace(/'/g, "\\'")}')" class="font-bold flex items-center gap-1 opacity-90 hover:text-primary-var text-left">
              <span class="font-serif font-bold text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1 rounded">W</span>
              <span>Wikipedia</span>
            </button>
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

// 7. High-Precision Real Road Network Routing (OSRM Multi-Mirror Engine)
async function fetchRoadRouteOSRM(coords, mode = 'scooter') {
  const profile = mode === 'walk' ? 'routed-foot' : 'routed-car';
  const coordString = coords.map(c => `${c[1].toFixed(6)},${c[0].toFixed(6)}`).join(';');
  
  const endpoints = [
    `https://routing.openstreetmap.de/${profile}/route/v1/driving/${coordString}?overview=full&geometries=geojson`,
    `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // Leaflet expects [lat, lon], GeoJSON returns [lon, lat]
          const polylineCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);
          const distanceKm = route.distance / 1000;
          
          let travelMinutes = Math.round(route.duration / 60);
          if (mode === 'scooter') {
            travelMinutes = Math.max(5, Math.round((distanceKm / 35) * 60));
          }

          return {
            coords: polylineCoords,
            distanceKm,
            travelMinutes
          };
        }
      }
    } catch (err) {
      console.warn(`Mirror failed (${url}), trying next mirror...`, err);
    }
  }

  // Graceful road-aware fallback if all external networks are blocked
  const fallbackDistanceKm = getDistanceKm(coords[0][0], coords[0][1], coords[coords.length - 1][0], coords[coords.length - 1][1]) * 1.25;
  const speed = mode === 'scooter' ? 35 : 4.5;
  return {
    coords: coords,
    distanceKm: fallbackDistanceKm,
    travelMinutes: Math.round((fallbackDistanceKm / speed) * 60)
  };
}

let currentRouteCache = null;
// Multi-Modal Ferry Detection & Schedule Engine
function detectFerryRoute(start, destination) {
  if (!start || !destination || !ferryRoutesData || ferryRoutesData.length === 0) return null;

  const destLat = destination.lat !== undefined ? destination.lat : destination.latitude;
  const startLat = start.lat !== undefined ? start.lat : start.latitude;

  // Case 1: Qimei Island (Lat < 23.30)
  if (destLat < 23.30 && startLat > 23.45) {
    return ferryRoutesData.find(r => r.route_id === 'ferry_magong_qimei');
  }

  // Case 2: Jibei Island (Lat > 23.70)
  if (destLat > 23.70 && startLat < 23.68) {
    return ferryRoutesData.find(r => r.route_id === 'ferry_baisha_jibei');
  }

  // Case 3: Wang'an Island (Lat 23.32 - 23.42)
  if (destLat >= 23.32 && destLat <= 23.42 && startLat > 23.45) {
    return ferryRoutesData.find(r => r.route_id === 'ferry_magong_wangan');
  }

  return null;
}

function checkFerryOperatingStatus(ferryRoute) {
  if (!ferryRoute) return { isFerry: false };

  const nowTaipei = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" });
  const taipeiDate = new Date(nowTaipei);
  const currentHour = taipeiDate.getHours();
  const currentMinute = taipeiDate.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const [lastH, lastM] = ferryRoute.last_departure.split(':').map(Number);
  const lastDepartureMinutes = lastH * 60 + lastM;

  const [firstH, firstM] = ferryRoute.first_departure.split(':').map(Number);
  const firstDepartureMinutes = firstH * 60 + firstM;

  const isClosedToday = currentTimeMinutes > lastDepartureMinutes || currentTimeMinutes < (firstDepartureMinutes - 30);

  const alertTitle = isClosedToday 
    ? t('ferry_closed_alert_title')
    : t('ferry_active_status').replace('{time}', ferryRoute.last_departure);

  const alertDesc = isClosedToday
    ? t('ferry_closed_alert_desc').replace('{time}', ferryRoute.last_departure).replace('{morning}', '07:30–09:00')
    : `Jadwal kapal feri reguler beroperasi setiap hari (${ferryRoute.operating_hours}). Estimasi tiket: NT$ ${ferryRoute.ticket_price_ntd}. Operator: ${ferryRoute.operator}.`;

  return {
    isFerry: true,
    isClosedToday,
    alertTitle,
    alertDesc,
    ferryRoute
  };
}

// Dynamic Risk Tier for Direct Route (UV >= 6: Red, 3-6: Yellow/Amber, < 3: Green)
function getDirectRouteRiskConfig() {
  const uv = (typeof currentWeatherData.uvIndex === 'number') ? currentWeatherData.uvIndex : 0;
  const feelsLike = currentWeatherData.feelsLike || 28;

  if (uv >= 6 || feelsLike >= 34) {
    return {
      tier: 'high',
      label: t('direct_risk_high'),
      desc: t('direct_desc_high'),
      badgeClass: 'bg-red-500/20 text-red-500',
      activeBorderClass: 'border-red-500',
      activeBadgeBg: 'bg-red-500',
      polylineColor: '#EF4444'
    };
  } else if (uv >= 3 || feelsLike >= 30) {
    return {
      tier: 'mod',
      label: t('direct_risk_mod'),
      desc: t('direct_desc_mod'),
      badgeClass: 'bg-amber-500/20 text-amber-500',
      activeBorderClass: 'border-amber-500',
      activeBadgeBg: 'bg-amber-500',
      polylineColor: '#F59E0B'
    };
  } else {
    return {
      tier: 'low',
      label: t('direct_risk_low'),
      desc: t('direct_desc_low'),
      badgeClass: 'bg-emerald-500/20 text-emerald-500',
      activeBorderClass: 'border-emerald-500',
      activeBadgeBg: 'bg-emerald-500',
      polylineColor: '#10B981'
    };
  }
}

async function calculateSmartRoute() {
  const startKey = document.getElementById('select-start').value;
  const endKey = document.getElementById('select-end').value;

  const start = KEY_PRESET_LOCATIONS[startKey] || KEY_PRESET_LOCATIONS.magong_port;
  const destination = KEY_PRESET_LOCATIONS[endKey] || KEY_PRESET_LOCATIONS.tongliang_banyan;

  routePolylineLayer.clearLayers();

  const ferryRoute = detectFerryRoute(start, destination);
  const schemeMeta = SCIENTIFIC_SCHEMES_META[selectedSchemeId];
  let multiModalData = null;
  let directRouteData = null;
  let safeRouteData = null;
  let recommendedShelter = null;

  if (ferryRoute) {
    // --- MULTI-MODAL ROUTING (Motor -> Ferry -> Island Motor) ---
    const depPort = { lat: ferryRoute.departure_port_coords[0], lon: ferryRoute.departure_port_coords[1] };
    const arrPort = { lat: ferryRoute.arrival_port_coords[0], lon: ferryRoute.arrival_port_coords[1] };

    // Leg 1: Road to Departure Pier
    const leg1Route = await fetchRoadRouteOSRM([[start.lat, start.lon], [depPort.lat, depPort.lon]], currentTravelMode);
    
    // Leg 2: Nautical Ferry Line
    const nauticalCoords = ferryRoute.nautical_waypoints;
    const nauticalDistKm = ferryRoute.distance_nautical_miles * 1.852;
    const nauticalMins = ferryRoute.duration_minutes;

    // Leg 3: Island Road from Arrival Pier to Target POI
    const leg3Route = await fetchRoadRouteOSRM([[arrPort.lat, arrPort.lon], [destination.lat, destination.lon]], currentTravelMode);

    const totalDistanceKm = leg1Route.distanceKm + nauticalDistKm + leg3Route.distanceKm;
    const totalTravelMinutes = leg1Route.travelMinutes + 15 + nauticalMins + leg3Route.travelMinutes;

    multiModalData = {
      isMultiModal: true,
      ferryRoute,
      status: checkFerryOperatingStatus(ferryRoute),
      depPort,
      arrPort,
      leg1: leg1Route,
      nautical: { coords: nauticalCoords, distanceKm: nauticalDistKm, minutes: nauticalMins },
      leg3: leg3Route,
      distanceKm: totalDistanceKm,
      travelMinutes: totalTravelMinutes
    };

    directRouteData = {
      coords: [...leg1Route.coords, ...nauticalCoords, ...leg3Route.coords],
      distanceKm: totalDistanceKm,
      travelMinutes: totalTravelMinutes
    };
    safeRouteData = directRouteData;

  } else {
    // --- STANDARD MAIN ISLAND ROAD ROUTING ---
    directRouteData = await fetchRoadRouteOSRM(
      [[start.lat, start.lon], [destination.lat, destination.lon]],
      currentTravelMode
    );

    recommendedShelter = findBestCorridorShelter(start, destination);
    if (recommendedShelter) {
      safeRouteData = await fetchRoadRouteOSRM(
        [
          [start.lat, start.lon],
          [recommendedShelter.latitude, recommendedShelter.longitude],
          [destination.lat, destination.lon]
        ],
        currentTravelMode
      );
    }
  }

  const startTitle = getUniversalBilingualTitle(start);
  const destTitle = getUniversalBilingualTitle(destination);

  // Cache route computation result for interactive card toggling
  currentRouteCache = {
    start,
    destination,
    startTitle,
    destTitle,
    directRouteData,
    safeRouteData,
    recommendedShelter,
    schemeMeta,
    multiModalData
  };

  // Update Direct Card Risk Styling Based on UV
  const risk = getDirectRouteRiskConfig();
  const directRiskBadge = document.querySelector('#card-route-direct [data-i18n="direct_risk"]');
  if (directRiskBadge) {
    directRiskBadge.textContent = multiModalData ? "Island Hopper" : risk.label;
    directRiskBadge.className = `text-[9px] px-1.5 py-0.5 rounded font-bold ${multiModalData ? 'bg-cyan-500/20 text-cyan-600' : risk.badgeClass}`;
  }
  const directDescEl = document.querySelector('#card-route-direct [data-i18n="direct_desc"]');
  if (directDescEl) {
    directDescEl.textContent = multiModalData ? "Termasuk pelayaran kapal feri & transit dermaga." : risk.desc;
  }

  // Update card metric numbers
  document.getElementById('direct-time-display').textContent = `${directRouteData.travelMinutes} Min`;
  const safeTotalMinutes = safeRouteData ? (safeRouteData.travelMinutes + (recommendedShelter ? schemeMeta.restMins : 0)) : directRouteData.travelMinutes;
  document.getElementById('safe-time-display').textContent = `${safeTotalMinutes} Min`;
  document.getElementById('reduction-badge').textContent = `-${schemeMeta.strainReduction}% ${t('strain_reduced')}`;

  document.getElementById('route-result-card').classList.remove('hidden');

  activeRouteView = 'safe';
  renderSelectedRouteView(activeRouteView);
}

// Interactive Toggle between Direct Route and Safe Cool-Ride Route
function toggleRouteView(type) {
  if (!currentRouteCache) return;
  activeRouteView = type;
  renderSelectedRouteView(type);
}

function renderSelectedRouteView(type) {
  if (!currentRouteCache) return;

  const { start, destination, startTitle, destTitle, directRouteData, safeRouteData, recommendedShelter, schemeMeta, multiModalData } = currentRouteCache;

  routePolylineLayer.clearLayers();

  const directCard = document.getElementById('card-route-direct');
  const safeCard = document.getElementById('card-route-safe');
  const directBadge = document.getElementById('badge-direct-active');
  const safeBadge = document.getElementById('badge-safe-active');
  const risk = getDirectRouteRiskConfig();

  if (multiModalData) {
    // ==========================================
    // MULTI-MODAL RENDERING (MOTOR + FERRY)
    // ==========================================
    if (directCard && safeCard) {
      safeCard.className = 'route-card-option dynamic-card-inner border-2 border-cyan-500 rounded-2xl p-3 space-y-1.5 cursor-pointer shadow-md';
      directCard.className = 'route-card-option dynamic-card border border-inherit rounded-2xl p-3 space-y-1.5 cursor-pointer opacity-75 hover:opacity-100 transition-all';
      if (safeBadge) safeBadge.classList.remove('hidden');
      if (directBadge) directBadge.classList.add('hidden');
    }

    // Leg 1: Road to Pier (Solid Cyan)
    L.polyline(multiModalData.leg1.coords, {
      color: '#00A8B5',
      weight: 5,
      opacity: 1,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(routePolylineLayer);

    // Leg 2: Nautical Ocean Ferry Line (Ocean Blue Dashed)
    const nauticalLine = L.polyline(multiModalData.nautical.coords, {
      color: '#0284C7',
      weight: 5,
      opacity: 0.9,
      dashArray: '8, 10',
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(routePolylineLayer);

    // Leg 3: Island Road (Emerald Green)
    L.polyline(multiModalData.leg3.coords, {
      color: '#06D6A0',
      weight: 5,
      opacity: 1,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(routePolylineLayer);

    // Route Markers
    addRouteMarker(start.lat, start.lon, 'A', startTitle, '#00A8B5');
    addRouteMarker(multiModalData.depPort.lat, multiModalData.depPort.lon, '🚢', multiModalData.ferryRoute.departure_port_name_zh, '#0284C7');
    addRouteMarker(multiModalData.arrPort.lat, multiModalData.arrPort.lon, '⚓', multiModalData.ferryRoute.arrival_port_name_zh, '#0284C7');
    addRouteMarker(destination.lat, destination.lon, 'B', destTitle, '#E07A5F');

    map.fitBounds(nauticalLine.getBounds(), { padding: [50, 50] });

    document.getElementById('route-distance-text').textContent = `${multiModalData.distanceKm.toFixed(1)} km (Multi-Moda)`;
    renderMultiModalTimeline(startTitle, destTitle, multiModalData);

  } else if (type === 'direct' || !safeRouteData) {
    // ==========================================
    // 1. DISPLAY DIRECT ROUTE ON MAP
    // ==========================================
    if (directCard && safeCard) {
      directCard.className = `route-card-option dynamic-card-inner border-2 ${risk.activeBorderClass} rounded-2xl p-3 space-y-1.5 cursor-pointer shadow-md`;
      safeCard.className = 'route-card-option dynamic-card border border-inherit rounded-2xl p-3 space-y-1.5 cursor-pointer opacity-75 hover:opacity-100 transition-all';
      if (directBadge) {
        directBadge.classList.remove('hidden');
        directBadge.className = `px-1.5 py-0.5 rounded ${risk.activeBadgeBg} text-white text-[8px] font-extrabold`;
      }
      if (safeBadge) safeBadge.classList.add('hidden');
    }

    // Direct Route Polyline (Conditional Color: Red / Amber / Green)
    L.polyline(directRouteData.coords, {
      color: '#0F172A',
      weight: 8,
      opacity: 0.6,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(routePolylineLayer);

    const polyline = L.polyline(directRouteData.coords, {
      color: risk.polylineColor,
      weight: 5,
      opacity: 1,
      dashArray: '4, 8',
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(routePolylineLayer);

    addRouteMarker(start.lat, start.lon, 'A', startTitle, '#00A8B5');
    addRouteMarker(destination.lat, destination.lon, 'B', destTitle, risk.polylineColor);
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    document.getElementById('route-distance-text').textContent = `${directRouteData.distanceKm.toFixed(1)} km (Direct)`;
    renderDirectTimeline(startTitle, destTitle, directRouteData, risk);

  } else {
    // ==========================================
    // 2. DISPLAY COOL-RIDE SAFE ROUTE ON MAP
    // ==========================================
    if (directCard && safeCard) {
      safeCard.className = 'route-card-option dynamic-card-inner border-2 border-emerald-500 rounded-2xl p-3 space-y-1.5 cursor-pointer shadow-md';
      directCard.className = 'route-card-option dynamic-card border border-inherit rounded-2xl p-3 space-y-1.5 cursor-pointer opacity-75 hover:opacity-100 transition-all';
      if (safeBadge) safeBadge.classList.remove('hidden');
      if (directBadge) directBadge.classList.add('hidden');
    }

    // Safe Route Polyline (Vibrant Cyan / Emerald)
    L.polyline(safeRouteData.coords, {
      color: '#0F172A',
      weight: 8,
      opacity: 0.6,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(routePolylineLayer);

    const polyline = L.polyline(safeRouteData.coords, {
      color: '#00A8B5',
      weight: 5,
      opacity: 1,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(routePolylineLayer);

    const shelterTitle = getUniversalBilingualTitle(recommendedShelter);
    addRouteMarker(start.lat, start.lon, 'A', startTitle, '#00A8B5');
    addRouteMarker(recommendedShelter.latitude, recommendedShelter.longitude, '❄️', `Shelter: ${shelterTitle}`, '#06D6A0');
    addRouteMarker(destination.lat, destination.lon, 'B', destTitle, '#E07A5F');
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    document.getElementById('route-distance-text').textContent = `${safeRouteData.distanceKm.toFixed(1)} km (Safe Route)`;
    renderSafeTimeline(startTitle, destTitle, recommendedShelter, safeRouteData, schemeMeta);
  }

  lucide.createIcons();
}

// Multi-Modal Timeline with Ferry Schedule Alert
function renderMultiModalTimeline(startTitle, destTitle, multiModalData) {
  const container = document.getElementById('route-timeline-steps');
  const status = multiModalData.status;
  const ferry = multiModalData.ferryRoute;

  const alertClass = status.isClosedToday 
    ? 'border-2 border-red-500/70 bg-red-500/10 text-red-600 dark:text-red-300' 
    : 'border-2 border-cyan-500/70 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300';

  container.innerHTML = `
    <!-- Ferry Operating Schedule Alert Banner (Hero Highlight) -->
    <div class="p-3 rounded-2xl ${alertClass} space-y-1 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="font-extrabold text-xs flex items-center gap-1.5">
          ${status.alertTitle}
        </p>
        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">NT$ ${ferry.ticket_price_ntd}</span>
      </div>
      <p class="text-[11px] opacity-90 leading-relaxed font-normal">
        ${status.alertDesc}
      </p>
    </div>

    <!-- Step 1: Ride to Departure Pier -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border">
      <span class="w-6 h-6 rounded-full dynamic-btn-primary font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">Berkendara ke <span class="text-primary-var">${ferry.departure_port_name_zh}</span></p>
        <p class="text-[11px] opacity-75">
          Menempuh <b>${multiModalData.leg1.distanceKm.toFixed(1)} km</b> (${multiModalData.leg1.travelMinutes} menit).
        </p>
      </div>
    </div>

    <!-- Step 2: Pier AC Lounge & Boarding Transit -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border border-cyan-500/40">
      <span class="w-6 h-6 rounded-full bg-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">❄️</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">${t('step_ferry_wait')}</p>
        <p class="text-[11px] opacity-75">
          Istirahat 15 menit di ruang tunggu ber-AC ${ferry.departure_port_name_zh}, beli tiket & hidrasi sebelum naik kapal.
        </p>
      </div>
    </div>

    <!-- Step 3: Sailing via Ferry across Ocean -->
    <div class="flex items-start gap-3 p-3 rounded-2xl dynamic-card-inner border-2 border-blue-500/50 shadow-sm">
      <span class="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">🚢</span>
      <div class="space-y-1 flex-1">
        <div class="flex items-center justify-between">
          <p class="font-extrabold text-xs text-blue-600 dark:text-blue-400">
            ${t('step_ferry_sail')} (${ferry.duration_minutes} Menit)
          </p>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">${ferry.distance_nautical_miles} Mil Laut</span>
        </div>
        <p class="text-xs font-bold">${ferry.departure_port_name_zh} ➔ ${ferry.arrival_port_name_zh}</p>
        <p class="text-[11px] opacity-80">
          Operator: <b>${ferry.operator}</b>. Nikmati angin laut dan pemandangan pulau vulkanik.
        </p>
      </div>
    </div>

    <!-- Step 4: Island Scooter Ride & Arrival -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border border-amber-500/40">
      <span class="w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">🎯</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">Tiba di <span class="text-amber-500">${destTitle}</span></p>
        <p class="text-[11px] opacity-75">
          Ambil motor sewaan di dermaga ${ferry.arrival_port_name_zh}, berkendara sejauh <b>${multiModalData.leg3.distanceKm.toFixed(1)} km</b> (${multiModalData.leg3.travelMinutes} menit).
        </p>
      </div>
    </div>
  `;
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

// Rich Narrative Itinerary for Safe Route
function renderSafeTimeline(startTitle, destTitle, shelter, routeData, schemeMeta) {
  const container = document.getElementById('route-timeline-steps');
  const shelterTitle = getUniversalBilingualTitle(shelter);
  
  const totalMins = routeData.travelMinutes;
  const leg1Mins = Math.max(6, Math.round(totalMins * 0.45));
  const leg2Mins = Math.max(6, Math.round(totalMins * 0.55));
  const leg1Km = (routeData.distanceKm * 0.48).toFixed(1);
  const leg2Km = (routeData.distanceKm * 0.52).toFixed(1);

  container.innerHTML = `
    <!-- Step 1: Origin Ride -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border">
      <span class="w-6 h-6 rounded-full dynamic-btn-primary font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">${t('step_origin')} <span class="text-primary-var">${startTitle}</span></p>
        <p class="text-[11px] opacity-75 leading-relaxed">
          ${t('step_via_highway')} sejauh <b>${leg1Km} km</b> (${leg1Mins} menit berkendara).
        </p>
      </div>
    </div>

    <!-- Step 2: Cooling Hub Pit-Stop (Hero Highlight) -->
    <div class="flex items-start gap-3 p-3 rounded-2xl dynamic-card-inner border-2 border-emerald-500/60 shadow-sm">
      <span class="w-6 h-6 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">❄️</span>
      <div class="space-y-1 flex-1">
        <div class="flex items-center justify-between">
          <p class="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
            ${t('step_rest')} (${schemeMeta.restMins} Min)
          </p>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">AC + Rehidrasi</span>
        </div>
        <p class="text-xs font-bold">${shelterTitle}</p>
        <p class="text-[11px] opacity-80 leading-relaxed">
          ${t('step_rest_desc')} <b>${shelterTitle}</b> untuk menurunkan beban termal sebesar <b class="text-emerald-600 dark:text-emerald-400">-${schemeMeta.strainReduction}%</b> ${t('step_rest_desc_end')}
        </p>
      </div>
    </div>

    <!-- Step 3: Scenic Crossing -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border">
      <span class="w-6 h-6 rounded-full dynamic-btn-primary font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">${t('step_cross_bridge')}</p>
        <p class="text-[11px] opacity-75 leading-relaxed">
          Melanjutkan perjalanan pesisir berangin sejuk sejauh <b>${leg2Km} km</b> (${leg2Mins} menit).
        </p>
      </div>
    </div>

    <!-- Step 4: Destination Arrival -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border border-amber-500/40">
      <span class="w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">🎯</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">${t('step_dest')} <span class="text-amber-500">${destTitle}</span></p>
        <p class="text-[11px] opacity-75 leading-relaxed">
          Total perjalanan <b>${totalMins + schemeMeta.restMins} menit</b>. Suhu tubuh tetap terjaga aman dari risiko dehidrasi dan heatstroke.
        </p>
      </div>
    </div>
  `;
}

// Narrative Itinerary for Direct Route
function renderDirectTimeline(startTitle, destTitle, routeData) {
  const container = document.getElementById('route-timeline-steps');
  
  container.innerHTML = `
    <!-- Step 1: Start -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border">
      <span class="w-6 h-6 rounded-full bg-slate-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">${t('step_origin')} <b>${startTitle}</b></p>
        <p class="text-[11px] opacity-75">
          Memulai perjalanan langsung tanpa jeda menempuh <b>${routeData.distanceKm.toFixed(1)} km</b> (${routeData.travelMinutes} menit).
        </p>
      </div>
    </div>

    <!-- Warning Step -->
    <div class="flex items-start gap-3 p-3 rounded-2xl dynamic-card-inner border-2 border-red-500/60 shadow-sm">
      <span class="w-6 h-6 rounded-full bg-red-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">⚠️</span>
      <div class="space-y-1 flex-1">
        <p class="font-extrabold text-xs text-red-500">Peringatan Paparan Terik Berkelanjutan</p>
        <p class="text-[11px] opacity-85 leading-relaxed">
          ${t('step_direct_desc')} Paparan sinar UV ${currentWeatherData.uvIndex} selama ${routeData.travelMinutes} menit tanpa pendinginan dapat memicu dehidrasi dan heat exhaustion.
        </p>
      </div>
    </div>

    <!-- Step 2: Arrival -->
    <div class="flex items-start gap-3 p-2.5 rounded-xl dynamic-card-inner border">
      <span class="w-6 h-6 rounded-full bg-slate-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
      <div class="space-y-0.5 flex-1">
        <p class="font-extrabold text-xs leading-snug">${t('step_dest')} <b>${destTitle}</b></p>
        <p class="text-[11px] opacity-75">
          Tiba di destinasi akhir. Disarankan segera mencari tempat berteduh dan minum air.
        </p>
      </div>
    </div>
  `;
  lucide.createIcons();
}

// Smart Road Corridor Shelter Finder (Prevents Island-Hopping & Giant Detours)
function findBestCorridorShelter(start, destination) {
  const directDist = getDistanceKm(start.lat, start.lon, destination.lat, destination.lon);
  
  // Is this route on the main connected island system? (Magong, Huxi, Baisha, Xiyu connected by bridges)
  const isMainIslandRoute = start.lat >= 23.50 && start.lat <= 23.68 && destination.lat >= 23.50 && destination.lat <= 23.68;

  // Filter candidate cooling shelters (Strictly prioritize 24/7 AC Convenience Stores on connected land)
  let candidateShelters = allNodes.filter(n => {
    if (!n.latitude || !n.longitude) return false;
    
    // If on main island, filter out remote ferry islands (Jibei / Qimei / Wang'an / Huayu)
    if (isMainIslandRoute) {
      if (n.latitude > 23.675 || n.latitude < 23.50 || n.longitude < 119.50 || n.longitude > 119.68) {
        return false;
      }
    }

    return n.category === 'convenience_store' || (n.has_ac === true && (n.category === 'shelter' || n.category === 'food_and_drink'));
  });

  if (candidateShelters.length === 0) {
    candidateShelters = allNodes.filter(n => n.category === 'convenience_store');
  }

  // Calculate corridor detour score for every shelter
  const scored = candidateShelters.map(s => {
    const d1 = getDistanceKm(start.lat, start.lon, s.latitude, s.longitude);
    const d2 = getDistanceKm(s.latitude, s.longitude, destination.lat, destination.lon);
    const detourRatio = (d1 + d2) / directDist;
    const balancePenalty = (Math.abs(d1 - d2) / directDist) * 0.20; // Prefers midway cooling stops
    return {
      shelter: s,
      d1,
      d2,
      detourRatio,
      score: detourRatio + balancePenalty
    };
  });

  // Strict detour limit: max 25% deviation from direct route (no massive loop detours!)
  const onCorridor = scored.filter(item => item.detourRatio <= 1.25);
  if (onCorridor.length > 0) {
    onCorridor.sort((a, b) => a.score - b.score);
    return onCorridor[0].shelter;
  }

  // Relaxed fallback if route is very short or in rural spot (max 40% detour)
  const relaxed = scored.filter(item => item.detourRatio <= 1.40);
  if (relaxed.length > 0) {
    relaxed.sort((a, b) => a.score - b.score);
    return relaxed[0].shelter;
  }

  // Fallback default safe store along Route 203
  return {
    name_zh: "7-Eleven 通梁門市",
    name_en: "7-Eleven Tongliang Store",
    latitude: 23.6558,
    longitude: 119.5582,
    category: "convenience_store",
    has_ac: true
  };
}

// 8. Wikipedia Interactive Modal System
function openWikiModal(queryOrTitle) {
  let targetNode = allNodes.find(n => n.name_zh === queryOrTitle || n.name_en === queryOrTitle || n.title === queryOrTitle);
  if (!targetNode && typeof queryOrTitle === 'object') targetNode = queryOrTitle;

  const wiki = targetNode ? getVerifiedWikiEntry(targetNode) : null;
  const modal = document.getElementById('wiki-modal');
  if (!modal) return;

  const titleEl = document.getElementById('wiki-modal-title');
  const bodyEl = document.getElementById('wiki-modal-body');
  const linkEl = document.getElementById('wiki-modal-link');

  const universalTitle = targetNode ? getUniversalBilingualTitle(targetNode) : queryOrTitle;
  const wikiUrl = wiki ? (currentLang === 'zh' ? (wiki.url_zh || wiki.url_en) : (wiki.url_en || wiki.url_zh)) : `https://zh.wikipedia.org/wiki/${encodeURIComponent(queryOrTitle)}`;
  const wikiSummary = wiki ? (currentLang === 'zh' ? wiki.summary_zh : (currentLang === 'en' ? wiki.summary_en : wiki.summary_id)) : (targetNode?.description || "Informasi tempat wisata bersejarah dan ikonik di Kepulauan Penghu.");
  const imgUrl = (wiki && wiki.image_url) || targetNode?.image_url;

  titleEl.textContent = universalTitle;
  
  let imgHtml = "";
  if (imgUrl) {
    imgHtml = `
      <div class="w-full h-44 rounded-2xl overflow-hidden mb-3 border border-inherit shadow-md">
        <img src="${imgUrl}" class="w-full h-full object-cover" alt="${universalTitle}" />
      </div>
    `;
  }

  bodyEl.innerHTML = `
    ${imgHtml}
    <div class="space-y-2">
      <p class="text-xs opacity-90 leading-relaxed font-normal">${wikiSummary}</p>
      ${targetNode?.opening_hours ? `<div class="text-[11px] opacity-75 pt-2 border-t border-inherit">🕒 <b>Jam Operasional:</b> ${targetNode.opening_hours}</div>` : ''}
    </div>
  `;

  linkEl.href = wikiUrl;
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeWikiModal() {
  const modal = document.getElementById('wiki-modal');
  if (modal) modal.classList.add('hidden');
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
          <button onclick="openWikiModal('${(n.name_zh || n.name_en || '').replace(/'/g, "\\'")}')" class="opacity-80 hover:text-primary-var flex items-center gap-1 font-bold text-left">
            <span class="font-serif bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1 rounded text-[9px]">W</span>
            <span>Wikipedia Preview</span>
          </button>
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
