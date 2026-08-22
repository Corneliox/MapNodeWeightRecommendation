"""
Script: fetch_penghu_taiwan_opendata.py
Deskripsi: Mengunduh dan mengekstrak data resmi dari Kementerian Transportasi & Pariwisata Taiwan
          (Tourism Administration Taiwan - v2.0) khusus untuk Kepulauan Penghu:
          - Objek Wisata (Attractions)
          - Restoran & Kuliner (Restaurants)
          - Hotel & Homestay (Hotels/Minshuku)
          100% Gratis, Resmi, dan Legal (Tanpa registrasi API Key).
"""

import os
import io
import json
import zipfile
import requests
import pandas as pd

# URL Endpoint Resmi Taiwan Tourism Open Data V2.0
DATASETS = {
    "attractions": {
        "url": "https://media.taiwan.net.tw/XMLReleaseAll_public/v2.0/Zh_tw/Attraction-json.zip",
        "json_name": "AttractionList.json",
        "root_key": "Attractions",
        "id_key": "AttractionID",
        "name_key": "AttractionName"
    },
    "restaurants": {
        "url": "https://media.taiwan.net.tw/XMLReleaseAll_public/v2.0/Zh_tw/Restaurant-json.zip",
        "json_name": "RestaurantList.json",
        "root_key": "Restaurants",
        "id_key": "RestaurantID",
        "name_key": "RestaurantName"
    },
    "hotels": {
        "url": "https://media.taiwan.net.tw/XMLReleaseAll_public/v2.0/Zh_tw/Hotel-json.zip",
        "json_name": "HotelList.json",
        "root_key": "Hotels",
        "id_key": "HotelID",
        "name_key": "HotelName"
    }
}

# Bounding box Kepulauan Penghu
PENGHU_LAT_MIN, PENGHU_LAT_MAX = 23.15, 23.85
PENGHU_LON_MIN, PENGHU_LON_MAX = 119.30, 119.75

def is_in_penghu(item):
    """Cek apakah lokasi berada di Penghu berdasarkan teks alamat atau koordinat GPS."""
    address_str = str(item.get("PostalAddress") or "")
    city_str = str(item.get("LocatedCities") or "")
    
    if "澎湖" in address_str or "澎湖" in city_str or "Penghu" in address_str:
        return True
        
    lat = item.get("PositionLat")
    lon = item.get("PositionLon")
    if lat and lon:
        try:
            lat_f = float(lat)
            lon_f = float(lon)
            if PENGHU_LAT_MIN <= lat_f <= PENGHU_LAT_MAX and PENGHU_LON_MIN <= lon_f <= PENGHU_LON_MAX:
                return True
        except (ValueError, TypeError):
            pass
            
    return False

def fetch_taiwan_open_data():
    os.makedirs("data", exist_ok=True)
    all_records = []

    print("[1/3] Mengunduh data resmi dari Taiwan Tourism Administration (V2.0)...")

    for cat_name, meta in DATASETS.items():
        print(f"      Mengunduh {cat_name} dari {meta['url']}...")
        try:
            res = requests.get(meta["url"], timeout=45)
            if res.status_code != 200:
                print(f"      Gagal mengunduh {cat_name}: Status {res.status_code}")
                continue

            with zipfile.ZipFile(io.BytesIO(res.content)) as z:
                raw_json = z.read(meta["json_name"]).decode("utf-8-sig")
                parsed = json.loads(raw_json)
                items = parsed.get(meta["root_key"], [])
                print(f"      Total nasional: {len(items)} titik. Memfilter wilayah Penghu...")

                penghu_count = 0
                for item in items:
                    if is_in_penghu(item):
                        penghu_count += 1
                        
                        # Parsing alamat
                        addr_dict = item.get("PostalAddress") if isinstance(item.get("PostalAddress"), dict) else {}
                        street_addr = addr_dict.get("StreetAddress") or str(item.get("PostalAddress") or "")
                        town = addr_dict.get("Town") or ""
                        
                        # Parsing foto pertama jika ada
                        images = item.get("Images") or []
                        first_img = images[0].get("URL") if (images and isinstance(images, list) and isinstance(images[0], dict)) else None
                        
                        record = {
                            "source": "Taiwan_Gov_OpenData_v2",
                            "category": cat_name,
                            "id": item.get(meta["id_key"]),
                            "name": item.get(meta["name_key"]),
                            "description": item.get("Description"),
                            "town": town,
                            "address": street_addr,
                            "latitude": float(item.get("PositionLat")) if item.get("PositionLat") else None,
                            "longitude": float(item.get("PositionLon")) if item.get("PositionLon") else None,
                            "service_time": item.get("ServiceTimeInfo"),
                            "fee_info": item.get("FeeInfo"),
                            "is_free": item.get("IsAccessibleForFree"),
                            "traffic_info": item.get("TrafficInfo"),
                            "parking_info": item.get("ParkingInfo"),
                            "website": item.get("WebsiteURL"),
                            "image_url": first_img
                        }
                        all_records.append(record)

                print(f"      -> Berhasil mengekstrak {penghu_count} titik {cat_name} di Penghu.")

        except Exception as e:
            print(f"      Error pada {cat_name}: {e}")

    # Simpan hasil
    json_path = os.path.join("data", "penghu_taiwan_gov_pois.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)

    csv_path = os.path.join("data", "penghu_taiwan_gov_pois.csv")
    df = pd.DataFrame(all_records)
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")

    print(f"\n[2/3] Total {len(all_records)} data resmi Penghu tersimpan:")
    print(f"      - JSON: {json_path}")
    print(f"      - CSV : {csv_path}")

    print("\n[3/3] Ringkasan Data:")
    print(df["category"].value_counts())

if __name__ == "__main__":
    fetch_taiwan_open_data()
