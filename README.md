# 🏝️ Penghu Cool-Ride: Smart Climate-Aware Tourism & Node-Weight Routing Engine

[![Version](https://img.shields.io/badge/Release-v1.0.0--Stable-06D6A0?style=for-the-badge&logo=git)](https://github.com/Corneliox/MapNodeWeightRecommendation/releases)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00A8B5?style=for-the-badge&logo=github)](https://corneliox.github.io/MapNodeWeightRecommendation/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Open-Meteo](https://img.shields.io/badge/Weather_API-Open--Meteo-FFD166?style=for-the-badge)](https://open-meteo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-E07A5F.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An intelligent, climate-adaptive travel routing engine designed for the **Penghu Archipelago, Taiwan** (澎湖群島). 

The platform optimizes scooter and walking itineraries by dynamically evaluating heat stress, solar radiation (UV index), and real-time temperatures, automatically inserting **air-conditioned cooling hubs (7-Eleven, FamilyMart, local cactus ice cream shops)** as mandatory rehydration waypoints before tourists suffer heat exhaustion or heatstroke.

---

## 🌟 Live Interactive Web App

Experience the live web application on GitHub Pages:  
👉 **[https://corneliox.github.io/MapNodeWeightRecommendation/](https://corneliox.github.io/MapNodeWeightRecommendation/)**

---

## 🚀 Key Stable Features (v1.0.0)

* **🗺️ Interactive Clustered POI Map (2,190 Cleaned Nodes)**:
  * Powered by **Leaflet.js** and **Leaflet.markercluster** with chunked lazy loading, providing smooth 60 FPS performance on both mobile phones and desktop browsers.
  * Universal bilingual formatting for all landmarks: `[Chinese Name] / [English Name]`.
* **📸 Wikipedia Knowledge Graph & Photo Markers**:
  * Top cultural and natural landmarks feature larger circular photo pins with direct Wikimedia thumbnails.
  * Verified Wikipedia insight cards with direct **"See more on Wikipedia ↗"** links opening in a new tab.
  * Automated weekly image updating via the Wikimedia REST API.
* **🔬 4 Peer-Reviewed Biometeorological Weighting Schemes**:
  1. **ISO 7243:2017**: International WBGT heatstroke prevention standard.
  2. **UTCI Strain Model**: Non-linear polynomial physiological thermal comfort index (Bröde et al., 2012).
  3. **COMFA Solar Energy Budget**: Direct solar irradiance (DNI) and UV radiation absorption (Brown & Gillespie, 1995).
  4. **Bi-Objective Pareto Routing**: Multiobjective optimization balancing time and thermal strain (Raith & Ehrgott, 2009).
* **🌐 Dynamic Multi-Language System (`translations.json`)**:
  * Instant runtime switching between **Bahasa Indonesia (`id`)**, **English (`en`)**, and **Traditional Chinese (`zh`)** without page reloads.
* **🎨 Holiday Visual Themes (CSS Variables)**:
  * **Palet Tropis Pantai (Default)**: Biru Pirus (`#00A8B5`), Kuning Cerah (`#FFD166`), Hijau Daun (`#06D6A0`), Putih Bersih (`#F8F9FA`).
  * **Palet Petualangan Alam**: Terakota (`#E07A5F`), Beige/Krem (`#F4F1DE`), Hijau Sage (`#81B29A`), Cokelat Tua (`#3D405B`).
  * **Ocean Dark**: Night mode optimized for low-light conditions.
* **⚡ Zero API Cost Risk & Automated CI/CD**:
  * Client-side web app runs on 100% static JSON, completely eliminating public API quota exhaustion risks.
  * Automatic GitHub Actions deployment on every `git push` via `.github/workflows/deploy_pages.yml`.

---

## 📊 Dataset Overview

All harvested datasets are structured under the [`data/`](./data) directory:

| Dataset File | Source | Records | Details |
| :--- | :--- | :---: | :--- |
| [`penghu_osm_pois.json`](./data/penghu_osm_pois.json) | OpenStreetMap Overpass | **505** | 50 Convenience stores (7-11, FamilyMart), 156 Shelters/Water refills, 177 Attractions, 122 F&B. |
| [`penghu_taiwan_gov_pois.json`](./data/penghu_taiwan_gov_pois.json) | Taiwan Tourism Admin (v2.0) | **1,685** | 145 Official scenic spots, 152 Verified restaurants, 1,388 Hotels/Minshuku. |
| **[`penghu_master_nodes.json`](./data/penghu_master_nodes.json)** | Unified Master Graph | **2,190** | Deduplicated, bilingual-named, and Wikipedia-enriched nodes ready for graph routing. |

---

## 📁 Repository Structure

```text
MapNodeWeightRecommendation/
├── .github/
│   └── workflows/
│       ├── deploy_pages.yml          # Instant GitHub Pages auto-deploy on push
│       └── update_data.yml           # Automated weekly dataset scraper pipeline
├── data/
│   ├── penghu_master_nodes.json      # Master nodes (2,190 POIs)
│   ├── penghu_master_nodes.csv       # Master tabular dataset
│   ├── penghu_osm_pois.json          # OpenStreetMap POI dataset
│   ├── penghu_taiwan_gov_pois.json   # Taiwan Gov official dataset
│   └── benchmark_results.json        # Simulation results for the 4 weighting schemes
├── .env.example                      # Template for environment variables
├── .gitignore                        # Git ignore rules (protects .env)
├── app.js                            # Frontend routing engine, i18n & clustering logic
├── benchmark_weighting_schemes.py    # Academic simulation script for 4 routing schemes
├── fetch_penghu_google_places.py     # Google Places API (New) crawler with field-masking
├── fetch_penghu_osm.py               # OpenStreetMap Overpass API extractor
├── fetch_penghu_taiwan_opendata.py   # Taiwan Tourism Admin v2.0 extractor
├── index.html                        # Main single-page web application (Interactive Map)
├── landing.html                      # Modern, interactive Landing Page & Scientific Showcase
├── merge_penghu_dataset.py           # Master node cleaner, bilingual formatter & Wiki scraper
├── requirements.txt                  # Python dependencies
├── style.css                         # Holiday themes, glassmorphism & marker cluster styles
├── translations.json                 # Complete i18n dictionary (ID, EN, ZH)
└── README.md                         # Project documentation
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
