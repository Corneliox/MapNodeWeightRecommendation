# 🏝️ Penghu Cool-Ride: Smart Climate-Aware Tourism & Node-Weight Routing Engine

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-06b6d4?style=for-the-badge&logo=github)](https://corneliox.github.io/MapNodeWeightRecommendation/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Open-Meteo](https://img.shields.io/badge/Weather_API-Open--Meteo-FF6F00?style=for-the-badge)](https://open-meteo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An intelligent, climate-adaptive travel routing engine designed for the **Penghu Archipelago, Taiwan** (澎湖群島). 

The platform optimizes scooter and walking itineraries by dynamically evaluating heat stress, solar radiation (UV index), and real-time temperatures, automatically inserting **air-conditioned cooling hubs (7-Eleven, FamilyMart, local cactus ice cream shops)** as mandatory rehydration waypoints before tourists suffer heat exhaustion or heatstroke.

---

## 🌟 Live Interactive Web App

Experience the live web application on GitHub Pages:  
👉 **[https://corneliox.github.io/MapNodeWeightRecommendation/](https://corneliox.github.io/MapNodeWeightRecommendation/)**

---

## 🚀 Key Features

* **Interactive POI Map (2,190 Nodes)**: Leaflet-powered dark-mode map containing all registered tourist spots, historical sites, convenience stores, shelters, and homestays across Penghu.
* **Live Microclimate & UV Feed**: Connects to the **Open-Meteo API** to calculate real-time apparent temperature (*feels-like*) and international Wet-Bulb Globe Temperature (WBGT) heatstroke risks.
* **Climate-Adaptive Graph Routing Engine**:
  * Calculates direct distance and solar exposure duration for scooter and walking modes.
  * **Heat Conditioning Algorithm**: If exposure time $> 15$ minutes in high UV/heat conditions, the engine calculates the optimal midpoint shelter node (7-Eleven / FamilyMart with air conditioning) and reconfigures the travel itinerary with an integrated cooling stop.
* **100% Free & Legal Open-Data Integration**: Combines OpenStreetMap (OSM) and the official Taiwan Tourism Administration (MOTC v2.0) dataset.

---

## 📊 Dataset Structure

All harvested datasets are structured in JSON and CSV under the [`data/`](./data) directory:

| Dataset File | Source | Records | Details |
| :--- | :--- | :---: | :--- |
| [`penghu_osm_pois.json`](./data/penghu_osm_pois.json) | OpenStreetMap Overpass | **505** | 50 Convenience stores (7-11, FamilyMart), 156 Shelters/Water refills, 177 Attractions, 122 F&B. |
| [`penghu_taiwan_gov_pois.json`](./data/penghu_taiwan_gov_pois.json) | Taiwan Tourism Admin (v2.0) | **1,685** | 145 Official scenic spots, 152 Verified restaurants, 1,388 Hotels/Minshuku. |
| **[`penghu_master_nodes.json`](./data/penghu_master_nodes.json)** | Unified Master Graph | **2,190** | Cleaned and deduplicated master nodes ready for graph routing algorithms. |

---

## 📁 Repository Structure

```text
MapNodeWeightRecommendation/
├── .github/
│   └── workflows/
│       └── update_data.yml           # Automated data scraper pipeline via GitHub Actions
├── data/
│   ├── penghu_master_nodes.json      # Master nodes (2,190 POIs)
│   ├── penghu_master_nodes.csv       # Master tabular dataset
│   ├── penghu_osm_pois.json          # OpenStreetMap POI dataset
│   └── penghu_taiwan_gov_pois.json   # Taiwan Gov official dataset
├── .env.example                      # Template for environment variables
├── .gitignore                        # Git ignore rules (protects .env)
├── app.js                            # Frontend routing engine & Open-Meteo logic
├── fetch_penghu_google_places.py     # Google Places API (New) crawler with field-masking
├── fetch_penghu_osm.py               # OpenStreetMap Overpass API extractor
├── fetch_penghu_taiwan_opendata.py   # Taiwan Tourism Admin v2.0 extractor
├── index.html                        # Main single-page web application
├── merge_penghu_dataset.py           # Master node generator & graph merger
├── requirements.txt                  # Python dependencies
├── style.css                         # Custom Leaflet markers & UI styles
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
Copy the configuration template:
```bash
cp .env.example .env
```
Fill in your credentials in `.env` if you wish to use Google Cloud Places API or Taiwan CWA API.

### 4. Run Data Extraction Scripts
```bash
# 1. Fetch OpenStreetMap POIs (Free)
python fetch_penghu_osm.py

# 2. Fetch Taiwan Tourism Administration official POIs (Free)
python fetch_penghu_taiwan_opendata.py

# 3. Merge into unified master nodes
python merge_penghu_dataset.py
```

### 5. Launch the Web App Locally
You can run a local HTTP server:
```bash
python -m http.server 8000
```
Open your browser at `http://localhost:8000`.

---

## 🔒 Automated Data Updates Without Exposing API Keys

To keep the web application (`github.io`) updated without exposing confidential API keys on the client side:
1. **GitHub Actions Scraper**: A scheduled cron workflow ([`.github/workflows/update_data.yml`](./.github/workflows/update_data.yml)) executes the backend Python scripts in a private GitHub runner.
2. **Encrypted Secrets**: Sensitive keys (`GOOGLE_MAPS_API_KEY`, `CWA_API_KEY`) are stored in **GitHub Repository Secrets** (`Settings -> Secrets and variables -> Actions`), never in client-side code.
3. **Static JSON Distribution**: The workflow pushes freshly generated static JSON files to the repository. The client-side web app reads these sanitized static files directly via `fetch()`.

---

## 📜 License & Attribution

* **OpenStreetMap Data**: Distributed under the [Open Database License (ODbL)](https://opendata.org.uk/odbl/).
* **Taiwan Tourism Data**: Provided by the Ministry of Transportation and Communications (MOTC) under the [Open Government Data License](https://data.gov.tw/license).
* **Code License**: This project is licensed under the [MIT License](LICENSE).
