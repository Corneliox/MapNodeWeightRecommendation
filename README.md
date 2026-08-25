# 🏝️ Penghu Cool-Ride: Smart Climate-Aware Tourism & Node-Weight Routing Engine

[![Version](https://img.shields.io/badge/Release-v2.2.0--Stable-06D6A0?style=for-the-badge&logo=git)](https://github.com/Corneliox/MapNodeWeightRecommendation/releases)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00A8B5?style=for-the-badge&logo=github)](https://corneliox.github.io/MapNodeWeightRecommendation/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Open-Meteo](https://img.shields.io/badge/Weather_API-Open--Meteo-FFD166?style=for-the-badge)](https://open-meteo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-E07A5F.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An intelligent, climate-adaptive multi-modal travel routing engine designed for the **Penghu Archipelago, Taiwan** (澎湖群島). 

The platform optimizes scooter, walking, and inter-island ferry itineraries by dynamically evaluating heat stress, solar radiation (UV index), and real-time temperatures, automatically inserting **air-conditioned cooling hubs (7-Eleven, FamilyMart, local cactus ice cream shops)** as mandatory rehydration waypoints before tourists suffer heat exhaustion or heatstroke.

---

## 🌟 Live Interactive Web App

Experience the live web application on GitHub Pages:  
👉 **[https://corneliox.github.io/MapNodeWeightRecommendation/](https://corneliox.github.io/MapNodeWeightRecommendation/)**  
👉 Map Router: **[https://corneliox.github.io/MapNodeWeightRecommendation/app.html](https://corneliox.github.io/MapNodeWeightRecommendation/app.html)**

---

## 🚀 Key Stable Features (v2.2.0)

* **🗺️ Interactive Clustered POI Map (2,190 Cleaned Nodes)**:
  * Powered by **Leaflet.js** and **Leaflet.markercluster** with chunked lazy loading, providing smooth 60 FPS performance on both mobile phones and desktop browsers.
  * Universal bilingual formatting for all landmarks: `[Chinese Name] / [English Name]`.
  * Deep zoom stabilization (`maxNativeZoom: 18, maxZoom: 18`) preventing tile dropouts on ultra-close inspection.
* **🚢 Multi-Modal Inter-Island Ferry Routing**:
  * Seamless cross-island routing automatically segmenting trips: `Origin Ride ➔ AC Departure Lounge ➔ Scenic Ferry Sailing ➔ Arrival Island Ride`.
  * Live operating schedules, ticket prices (NTD), and real-time ferry closing alerts.
* **❄️ Road-Polyline Aware Multi-Stage Cooling Pit-Stops**:
  * Calculates cumulative road mileage along Highway 203 curves instead of deceptive straight-line Euclidean distance.
  * Staged cooling stops: 1 stop for routes $<14\text{ km}$, **2 sequential cooling waypoints (`❄️1` & `❄️2`)** for long journeys ($\ge 14\text{ km}$).
* **🌊 Continuous 2D IDW Meteorological Radar Heatmap (Windy/CWA Style)**:
  * Real-time 2D Inverse Distance Weighting (IDW) scalar field overlay smoothly blending Celsius temperatures and UV index across the entire archipelago (including western Huayu Island).
  * 100% physically accurate nighttime rendering (pure calm Emerald Green when UV $\le 0.1$).
* **📱 Universal Google Maps Deep-Link & JSON Route Export**:
  * One-click hand-off with sequential multi-waypoints: `&waypoints=stop1|stop2`.
  * Download complete route metadata, WBGT risk levels, and GPS waypoints as `penghu_route_[timestamp].json`.
* **📸 Wikipedia Knowledge Graph & Photo Markers**:
  * Top cultural and natural landmarks feature larger circular photo pins with direct Wikimedia thumbnails and verified insight cards.
* **🔬 4 Peer-Reviewed Biometeorological Weighting Schemes**:
  1. **ISO 7243:2017**: International WBGT heatstroke prevention standard.
  2. **UTCI Strain Model**: Non-linear polynomial physiological thermal comfort index (Bröde et al., 2012).
  3. **COMFA Solar Energy Budget**: Direct solar irradiance (DNI) and UV radiation absorption (Brown & Gillespie, 1995).
  4. **Bi-Objective Pareto Routing**: Multiobjective optimization balancing time and thermal strain (Raith & Ehrgott, 2009).
* **🌐 Dynamic Multi-Language System (`translations.json`)**:
  * Instant runtime switching between **Bahasa Indonesia (`id`)**, **English (`en`)**, and **Traditional Chinese (`zh`)**.
* **🎨 Holiday Visual Themes (CSS Variables)**:
  * **Palet Tropis Pantai (Default)**: Biru Pirus (`#00A8B5`), Kuning Cerah (`#FFD166`), Hijau Daun (`#06D6A0`), Putih Bersih (`#F8F9FA`).
  * **Palet Petualangan Alam**: Terakota (`#E07A5F`), Beige/Krem (`#F4F1DE`), Hijau Sage (`#81B29A`), Cokelat Tua (`#3D405B`).
  * **Ocean Dark**: Night mode optimized for low-light conditions.
* **⚡ Automated Data Pipeline & CI/CD**:
  * Weekly data update workflows via GitHub Actions with elevated write permissions.

---

## 📊 Dataset Overview

All harvested datasets are structured under the [`data/`](./data) directory:

| Dataset File | Source | Records | Details |
| :--- | :--- | :---: | :--- |
| [`penghu_osm_pois.json`](./data/penghu_osm_pois.json) | OpenStreetMap Overpass | **505** | 50 Convenience stores (7-11, FamilyMart), 156 Shelters/Water refills, 177 Attractions, 122 F&B. |
| [`penghu_taiwan_gov_pois.json`](./data/penghu_taiwan_gov_pois.json) | Taiwan Tourism Admin (v2.0) | **1,685** | 145 Official scenic spots, 152 Verified restaurants, 1,388 Hotels/Minshuku. |
| [`penghu_ferry_routes.json`](./data/penghu_ferry_routes.json) | MOTC / TDX / Penghu County | **12** | Complete inter-island ferry routes, schedules, fares, and pier coordinates. |
| **[`penghu_master_nodes.json`](./data/penghu_master_nodes.json)** | Unified Master Graph | **2,190** | Deduplicated, bilingual-named, and Wikipedia-enriched nodes ready for graph routing. |

---

## 📁 Repository Structure

```text
MapNodeWeightRecommendation/
├── .github/
│   └── workflows/
│       ├── deploy_pages.yml          # Instant GitHub Pages auto-deploy on push
│       └── weekly_data_update.yml    # Automated weekly dataset scraper pipeline (write-enabled)
├── data/
│   ├── penghu_master_nodes.json      # Master nodes (2,190 POIs)
│   ├── penghu_master_nodes.csv       # Master tabular dataset
│   ├── penghu_ferry_routes.json      # Inter-island ferry routes & operating schedules
│   ├── penghu_osm_pois.json          # OpenStreetMap POI dataset
│   ├── penghu_taiwan_gov_pois.json   # Taiwan Gov official dataset
│   └── benchmark_results.json        # Simulation results for the 4 weighting schemes
├── .env.example                      # Template for environment variables
├── .gitignore                        # Git ignore rules (protects .env & private milestone logs)
├── app.js                            # Frontend routing engine, i18n, IDW continuous field & clustering logic
├── benchmark_weighting_schemes.py    # Academic simulation script for 4 routing schemes
├── fetch_penghu_google_places.py     # Google Places API (New) crawler with field-masking
├── fetch_penghu_osm.py               # OpenStreetMap Overpass API extractor
├── fetch_penghu_taiwan_opendata.py   # Taiwan Tourism Admin v2.0 extractor
├── app.html                          # Interactive Map Application & Climate Router Engine
├── index.html                        # Modern Landing Page & Scientific Showcase (Root Entry)
├── merge_penghu_dataset.py           # Master node cleaner, bilingual formatter & Wiki scraper
├── requirements.txt                  # Python dependencies
├── style.css                         # Holiday themes, glassmorphism & marker cluster styles
├── translations.json                 # Complete i18n dictionary (ID, EN, ZH)
└── README.md                         # Project documentation & release guide
```

---

## 🛠️ Local Installation & Development

### 1. Clone the Repository
```bash
git clone https://github.com/Corneliox/MapNodeWeightRecommendation.git
cd MapNodeWeightRecommendation
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables Setup
```bash
cp .env.example .env
```
*(Optional: Fill in your API keys in `.env` if executing private crawlers).*

### 4. Run Data Pipeline & Merge
```bash
# 1. Fetch OSM & Taiwan Gov POIs
python fetch_penghu_osm.py
python fetch_penghu_taiwan_opendata.py

# 2. Merge, translate, and scrape Wikipedia photos
python merge_penghu_dataset.py
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
