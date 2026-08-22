"""
Script: fetch_penghu_osm.py
Deskripsi: Mengambil seluruh data POI di Kepulauan Penghu (Convenience Store, Wisata, Resto/Shelter)
          dari OpenStreetMap (OSM) menggunakan Overpass API secara 100% Gratis & Legal.
"""

import os
import json
import requests
import pandas as pd

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Bounding box Kepulauan Penghu: (south, west, north, east)
# 23.15 to 23.85 Latitude, 119.30 to 119.75 Longitude
PENGHU_BBOX = "23.15,119.30,23.85,119.75"

OVERPASS_QUERY = f"""
[out:json][timeout:90];
(
  // 1. Semua Minimarket / Convenience Store (7-Eleven, FamilyMart, dll)
  node["shop"="convenience"]({PENGHU_BBOX});
  way["shop"="convenience"]({PENGHU_BBOX});

  // 2. Destinasi Wisata, Sejarah & Pemandangan
  node["tourism"~"attraction|viewpoint|museum|gallery|theme_park"]({PENGHU_BBOX});
  way["tourism"~"attraction|viewpoint|museum|gallery|theme_park"]({PENGHU_BBOX});
  node["historic"]({PENGHU_BBOX});
  way["historic"]({PENGHU_BBOX});

  // 3. Titik Rehidrasi, Shelter, Kuliner & Toko Es
  node["amenity"~"restaurant|cafe|fast_food|ice_cream|shelter|drinking_water"]({PENGHU_BBOX});
  way["amenity"~"restaurant|cafe|fast_food|ice_cream|shelter|drinking_water"]({PENGHU_BBOX});
);
out center tags;
"""

def fetch_osm_data():
    print("[1/3] Mengirim query ke OpenStreetMap Overpass API untuk wilayah Penghu...")
    headers = {
        "User-Agent": "PenghuClimateTourism/1.0 (academic research)"
    }
    
    response = requests.post(OVERPASS_URL, data={"data": OVERPASS_QUERY}, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Gagal mengambil data dari OSM. Status code: {response.status_code}, Response: {response.text[:200]}")
    
    data = response.json()
    elements = data.get("elements", [])
    print(f"[2/3] Berhasil menerima {len(elements)} raw elemen dari OSM!")

    pois = []
    for elem in elements:
        tags = elem.get("tags", {})
        
        # Ekstraksi koordinat (node punya lat/lon langsung, way punya center)
        lat = elem.get("lat") or (elem.get("center", {}).get("lat") if "center" in elem else None)
        lon = elem.get("lon") or (elem.get("center", {}).get("lon") if "center" in elem else None)

        if not lat or not lon:
            continue

        # Klasifikasi kategori
        category = "other"
        if tags.get("shop") == "convenience":
            category = "convenience_store"
        elif "tourism" in tags or "historic" in tags:
            category = "tourist_attraction"
        elif tags.get("amenity") in ["shelter", "drinking_water"]:
            category = "shelter"
        elif tags.get("amenity") in ["restaurant", "cafe", "fast_food", "ice_cream"]:
            category = "food_and_drink"

        poi_item = {
            "osm_id": elem.get("id"),
            "osm_type": elem.get("type"),
            "category": category,
            "name": tags.get("name") or tags.get("name:en") or "Tanpa Nama",
            "name_zh": tags.get("name:zh") or tags.get("name"),
            "name_en": tags.get("name:en"),
            "brand": tags.get("brand") or tags.get("brand:en") or tags.get("operator"),
            "opening_hours": tags.get("opening_hours"),
            "wheelchair": tags.get("wheelchair"),
            "air_conditioning": tags.get("air_conditioning"),
            "latitude": lat,
            "longitude": lon,
            "raw_tags": tags
        }
        pois.append(poi_item)

    # Simpan ke folder data
    os.makedirs("data", exist_ok=True)
    
    json_path = os.path.join("data", "penghu_osm_pois.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(pois, f, ensure_ascii=False, indent=2)
        
    csv_path = os.path.join("data", "penghu_osm_pois.csv")
    df = pd.DataFrame(pois)
    # Hapus kolom raw_tags untuk CSV agar rapi
    df.drop(columns=["raw_tags"], inplace=True, errors="ignore")
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")

    print(f"[3/3] Data berhasil disimpan:")
    print(f"      - JSON: {json_path}")
    print(f"      - CSV : {csv_path}")
    print("\nRingkasan Kategori:")
    print(df["category"].value_counts())

if __name__ == "__main__":
    fetch_osm_data()
