"""
Script: fetch_penghu_google_places.py
Deskripsi: Mengambil data resmi dari Google Cloud (Places API New) untuk wilayah Penghu,
          termasuk rating bintang, ulasan, jam operasional, dan ringkasan editorial.
"""

import os
import json
import time
import requests
import pandas as pd
from dotenv import load_dotenv

# Load file .env jika ada
load_dotenv()

# Ambil Google Maps API Key dari file .env atau Environment Variable
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "MASUKKAN_GOOGLE_API_KEY_ANDA_DISINI")

# Endpoint Resmi Google Places API (New)
TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# Kata kunci pencarian untuk Kepulauan Penghu
SEARCH_QUERIES = [
    "7-Eleven Penghu Taiwan",
    "FamilyMart Penghu Taiwan",
    "Tourist Attraction in Penghu",
    "Scenic Spots in Penghu",
    "Cactus Ice Cream Penghu",
    "Seafood Restaurant Magong Penghu"
]

# Field Masking: Membatasi data yang diambil agar menghemat biaya API
# Google hanya menagih data sesuai field yang diminta
FIELD_MASK = (
    "places.id,"
    "places.displayName,"
    "places.formattedAddress,"
    "places.location,"
    "places.rating,"
    "places.userRatingCount,"
    "places.regularOpeningHours,"
    "places.primaryType,"
    "places.editorialSummary"
)

def search_places_google(query, api_key):
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK
    }
    
    # Restriksi area pencarian di dalam Bounding Box Penghu
    body = {
        "textQuery": query,
        "locationRestriction": {
            "rectangle": {
                "low": {"latitude": 23.15, "longitude": 119.30},
                "high": {"latitude": 23.85, "longitude": 119.75}
            }
        },
        "languageCode": "zh-TW" # Bahasa Mandarin Taiwan (bisa diganti "en" untuk Inggris)
    }

    response = requests.post(TEXT_SEARCH_URL, headers=headers, json=body)
    if response.status_code != 200:
        print(f"Error {response.status_code}: {response.text}")
        return []
    
    return response.json().get("places", [])

def main():
    if API_KEY == "MASUKKAN_GOOGLE_API_KEY_ANDA_DISINI":
        print("=" * 70)
        print("PERHATIAN: API Key Google belum diset!")
        print("Silakan edit file ini dan isi variabel API_KEY dengan API Key Anda,")
        print("atau jalankan di terminal: set GOOGLE_MAPS_API_KEY=AIzaSy...")
        print("=" * 70)
        return

    os.makedirs("data", exist_ok=True)
    all_places = {}

    print("[1/3] Memulai pengambilan data dari Google Cloud Places API...")

    for query in SEARCH_QUERIES:
        print(f"      Mencari: '{query}'...")
        places = search_places_google(query, API_KEY)
        for p in places:
            place_id = p.get("id")
            if place_id and place_id not in all_places:
                # Format data agar mudah diproses
                loc = p.get("location", {})
                display_name = p.get("displayName", {}).get("text", "")
                summary = p.get("editorialSummary", {}).get("text", "")
                
                all_places[place_id] = {
                    "source": "Google_Places_API",
                    "google_place_id": place_id,
                    "name": display_name,
                    "primary_type": p.get("primaryType"),
                    "rating": p.get("rating"),
                    "user_ratings_total": p.get("userRatingCount"),
                    "address": p.get("formattedAddress"),
                    "latitude": loc.get("latitude"),
                    "longitude": loc.get("longitude"),
                    "editorial_summary": summary,
                    "weekday_descriptions": p.get("regularOpeningHours", {}).get("weekdayDescriptions", [])
                }
        time.sleep(0.5) # Hindari rate limit

    results_list = list(all_places.values())
    print(f"\n[2/3] Berhasil mengumpulkan {len(results_list)} tempat unik di Penghu dari Google Places!")

    json_path = os.path.join("data", "penghu_google_places.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results_list, f, ensure_ascii=False, indent=2)

    csv_path = os.path.join("data", "penghu_google_places.csv")
    df = pd.DataFrame(results_list)
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")

    print(f"[3/3] Data berhasil disimpan:")
    print(f"      - JSON: {json_path}")
    print(f"      - CSV : {csv_path}")

if __name__ == "__main__":
    main()
