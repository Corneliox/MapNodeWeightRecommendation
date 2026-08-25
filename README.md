# 🏝️ Penghu Cool-Ride: Smart Climate-Aware Tourism & Node-Weight Routing Engine

[![Version](https://img.shields.io/badge/Release-v2.4.0--Stable-06D6A0?style=for-the-badge&logo=git)](https://github.com/Corneliox/MapNodeWeightRecommendation/releases)
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

## 🚀 Key Stable Features (v2.4.0)

* **🛵 Dual Routing Engine Architecture (Google Routes API + OSRM Multi-Mirror)**:
  * Seamless support for Google Cloud Routes API with `TWO_WHEELER` mode and `TRAFFIC_AWARE` real-time congestion data.
  * Instant automatic fallback to multi-mirror open-source OSRM routing with zero user disruption.
* **🌊 Continuous 2D IDW Radar Heatmap & Adaptive Grid Mesh**:
  * Real-time 2D Inverse Distance Weighting (IDW) scalar field overlay smoothly blending temperatures (calibrated 26°C–32°C for sharp microclimate contrast) and solar UV index across the entire archipelago.
  * **Dynamic Polygon Grid Cells (Beta)**: Switchable discrete mesh displaying cell-by-cell spatial temperatures or UV radiation with rounded toggle controls.
* **📡 28 Weather Station Anchor Markers**:
  * Visual anchor points representing Taiwan Central Weather Administration (CWA) automated observatories, island towers, and maritime buoys with interactive telemetry popups.
* **🚢 Multi-Modal Inter-Island Ferry Routing**:
  * Seamless cross-island routing automatically segmenting trips: `Origin Ride ➔ AC Departure Lounge ➔ Scenic Ferry Sailing ➔ Arrival Island Ride`.
* **❄️ Road-Polyline Aware Multi-Stage Cooling Pit-Stops**:
  * Cumulative road-mileage pit-stop placement along Highway 203 curves with staged waypoints (`❄️1` & `❄️2`).
* **🔬 6 Peer-Reviewed Biometeorological Weighting Schemes**:
  1. **ISO 7243:2017**: International WBGT heatstroke prevention standard.
  2. **UTCI Strain Model**: Non-linear polynomial physiological thermal comfort index (Bröde et al., 2012).
  3. **COMFA Solar Energy Budget**: Direct solar irradiance (DNI) and UV radiation absorption (Brown & Gillespie, 1995).
  4. **Bi-Objective Pareto Routing**: Multiobjective optimization balancing time and thermal strain (Raith & Ehrgott, 2009).
  5. **Taiwan Subtropical PET Model**: Physiological Equivalent Temperature calibrated for Taiwan populations (Höppe, 1999; Lin et al., 2010).
  6. **Scooter Convective Heat-Blast Model**: Dynamic aerodynamic convective heat transfer at scooter riding speed when $T_a > 34^\circ\text{C}$ (ISO 9920 / de Freitas, 1985).
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
