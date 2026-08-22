"""
Script: merge_penghu_dataset.py
Deskripsi: Menggabungkan dataset OpenStreetMap (OSM) dan Taiwan Government Open Data
          menjadi satu Master Node Dataset terstruktur untuk engine rute graf (Node-Weight Routing).
"""

import os
import json
import pandas as pd

def merge_datasets():
    osm_path = os.path.join("data", "penghu_osm_pois.json")
    gov_path = os.path.join("data", "penghu_taiwan_gov_pois.json")

    if not os.path.exists(osm_path) or not os.path.exists(gov_path):
        print("Dataset belum lengkap. Jalankan fetch_penghu_osm.py dan fetch_penghu_taiwan_opendata.py terlebih dahulu.")
        return

    with open(osm_path, "r", encoding="utf-8") as f:
        osm_data = json.load(f)
    with open(gov_path, "r", encoding="utf-8") as f:
        gov_data = json.load(f)

    master_nodes = []
    
    # 1. Masukkan semua Minimarket & Shelter dari OSM (Sangat krusial untuk climate survival)
    for item in osm_data:
        node_type = "secondary_shelter" if item["category"] in ["convenience_store", "shelter"] else "secondary_poi"
        master_nodes.append({
            "node_id": f"OSM_{item['osm_type']}_{item['osm_id']}",
            "source": "OpenStreetMap",
            "node_role": "shelter_node" if item["category"] in ["convenience_store", "shelter"] else "attraction_node",
            "category": item["category"],
            "name": item["name"],
            "name_zh": item["name_zh"],
            "name_en": item["name_en"],
            "brand": item["brand"],
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "opening_hours": item["opening_hours"],
            "description": None,
            "fee_info": None,
            "is_free": True if item["category"] in ["convenience_store", "shelter"] else None,
            "has_ac": True if (item.get("air_conditioning") == "yes" or item["category"] == "convenience_store") else None
        })

    # 2. Masukkan data resmi Pemerintah Taiwan
    for item in gov_data:
        role = "attraction_node" if item["category"] == "attractions" else ("shelter_node" if item["category"] == "restaurants" else "hotel_node")
        master_nodes.append({
            "node_id": f"GOV_{item['category']}_{item['id']}",
            "source": "Taiwan_Gov_OpenData",
            "node_role": role,
            "category": item["category"],
            "name": item["name"],
            "name_zh": item["name"],
            "name_en": None,
            "brand": None,
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "opening_hours": item["service_time"],
            "description": item["description"],
            "fee_info": item["fee_info"],
            "is_free": item["is_free"],
            "has_ac": True if item["category"] in ["restaurants", "hotels"] else None
        })

    df = pd.DataFrame(master_nodes)
    
    # Simpan Master Dataset
    master_json = os.path.join("data", "penghu_master_nodes.json")
    master_csv = os.path.join("data", "penghu_master_nodes.csv")

    with open(master_json, "w", encoding="utf-8") as f:
        json.dump(master_nodes, f, ensure_ascii=False, indent=2)
    df.to_csv(master_csv, index=False, encoding="utf-8-sig")

    print("=" * 60)
    print("MASTER DATASET PENGHU BERHASIL DIBUAT!")
    print(f"Total Nodes: {len(master_nodes)}")
    print(f"File Tersimpan:")
    print(f" - JSON: {master_json}")
    print(f" - CSV : {master_csv}")
    print("=" * 60)
    print("Distribusi Node Role:")
    print(df["node_role"].value_counts())

if __name__ == "__main__":
    merge_datasets()
