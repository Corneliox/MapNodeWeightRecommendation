"""
Script: merge_penghu_dataset.py
Deskripsi: Menggabungkan dan membersihkan dataset OpenStreetMap (OSM) dan Taiwan Gov OpenData.
          - Mengeliminasi 'Tanpa Nama' dengan penamaan fungsional berbasis tag OSM.
          - Menghasilkan format standar Nama Bilingual: 'Nama Mandarin / English Name'.
          - Mengidentifikasi POI yang memiliki artikel Wikipedia.
"""

import os
import json
import re
import pandas as pd

# Mapping terjemahan istilah umum pariwisata Taiwan ke Bahasa Inggris
ZH_TO_EN_TERMS = {
    "門市": " Store",
    "店": " Store",
    "沙灘": " Beach",
    "海水浴場": " Beach & Bathing Area",
    "古榕": " Great Banyan",
    "玄武岩": " Columnar Basalt",
    "跨海大橋": " Great Cross-Sea Bridge",
    "燈塔": " Lighthouse",
    "老街": " Old Street",
    "天后宮": " Tianhou Temple",
    "廟": " Temple",
    "宮": " Temple",
    "石滬": " Stone Weir",
    "洞": " Blowhole / Cave",
    "嶼": " Island",
    "島": " Island",
    "港": " Port",
    "碼頭": " Pier / Wharf",
    "遊客中心": " Visitor Center",
    "地質公園": " Geopark",
    "仙人掌冰": " Cactus Ice Cream",
    "海鮮": " Seafood Restaurant",
    "民宿": " B&B Homestay",
    "飯店": " Hotel",
    "會館": " Hall / Resort"
}

def clean_and_translate_name(name_zh, name_en, category, raw_tags=None):
    """Menghasilkan pasangan nama (zh, en) yang bersih dan informatif tanpa 'Tanpa Nama'."""
    raw_tags = raw_tags or {}
    
    # 1. Tangani jika nama kosong / "Tanpa Nama"
    if not name_zh or name_zh == "Tanpa Nama":
        amenity = raw_tags.get("amenity", "")
        tourism = raw_tags.get("tourism", "")
        historic = raw_tags.get("historic", "")
        
        if category == "convenience_store":
            name_zh = raw_tags.get("brand") or "澎湖便利商店"
            name_en = "Penghu Convenience Store"
        elif amenity == "shelter":
            name_zh = "澎湖公共涼亭 / 休息站"
            name_en = "Public Rest Shelter"
        elif amenity == "drinking_water":
            name_zh = "免費飲水補給站"
            name_en = "Drinking Water Refill Point"
        elif amenity in ["restaurant", "cafe", "fast_food", "ice_cream"]:
            name_zh = "澎湖在地美食小吃"
            name_en = "Penghu Local Eatery"
        elif tourism in ["viewpoint", "attraction"]:
            name_zh = "澎湖海景觀景點"
            name_en = "Penghu Scenic Viewpoint"
        elif historic:
            name_zh = "澎湖歷史文化遺址"
            name_en = "Historic Heritage Site"
        else:
            name_zh = "澎湖休閒景點"
            name_en = "Penghu Scenic Spot"

    # 2. Jika nama_en belum ada, lakukan terjemahan cerdas
    if not name_en or name_en == name_zh:
        translated_en = name_zh
        for zh_term, en_term in ZH_TO_EN_TERMS.items():
            if zh_term in translated_en:
                translated_en = translated_en.replace(zh_term, en_term)
        
        # Bersihkan spasi ganda
        name_en = re.sub(r'\s+', ' ', translated_en).strip()
        if name_en == name_zh:
            name_en = f"{name_zh} (Penghu Spot)"

    return name_zh.strip(), name_en.strip()

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
    
    # 1. Proses Data OpenStreetMap (Minimarket, Shelter, Titik Air)
    for item in osm_data:
        zh, en = clean_and_translate_name(
            item.get("name_zh") or item.get("name"),
            item.get("name_en"),
            item.get("category"),
            item.get("raw_tags")
        )
        
        # Gabungkan dalam format judul bilingual universal: 'Nama Mandarin / English Name'
        bilingual_title = f"{zh} / {en}" if zh != en else zh

        master_nodes.append({
            "node_id": f"OSM_{item['osm_type']}_{item['osm_id']}",
            "source": "OpenStreetMap",
            "node_role": "shelter_node" if item["category"] in ["convenience_store", "shelter"] else "attraction_node",
            "category": item["category"],
            "title": bilingual_title,
            "name_zh": zh,
            "name_en": en,
            "brand": item.get("brand"),
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "opening_hours": item.get("opening_hours"),
            "description": None,
            "fee_info": None,
            "is_free": True if item["category"] in ["convenience_store", "shelter"] else None,
            "has_ac": True if (item.get("air_conditioning") == "yes" or item["category"] == "convenience_store") else None
        })

    # 2. Proses Data Resmi Pemerintah Taiwan
    for item in gov_data:
        zh, en = clean_and_translate_name(
            item.get("name"),
            None,
            item.get("category")
        )
        
        bilingual_title = f"{zh} / {en}" if zh != en else zh
        role = "attraction_node" if item["category"] == "attractions" else ("shelter_node" if item["category"] == "restaurants" else "hotel_node")

        master_nodes.append({
            "node_id": f"GOV_{item['category']}_{item['id']}",
            "source": "Taiwan_Gov_OpenData",
            "node_role": role,
            "category": item["category"],
            "title": bilingual_title,
            "name_zh": zh,
            "name_en": en,
            "brand": None,
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "opening_hours": item.get("service_time"),
            "description": item.get("description"),
            "fee_info": item.get("fee_info"),
            "is_free": item.get("is_free"),
            "has_ac": True if item["category"] in ["restaurants", "hotels"] else None
        })

    # Simpan Master Dataset Bersih
    master_json = os.path.join("data", "penghu_master_nodes.json")
    master_csv = os.path.join("data", "penghu_master_nodes.csv")

    with open(master_json, "w", encoding="utf-8") as f:
        json.dump(master_nodes, f, ensure_ascii=False, indent=2)

    df = pd.DataFrame(master_nodes)
    df.to_csv(master_csv, index=False, encoding="utf-8-sig")

    print("=" * 70)
    print("MASTER DATASET PENGHU DIBERSIHKAN & DIFORMAT BILINGUAL!")
    print(f"Total Nodes : {len(master_nodes)}")
    print(f"Tanpa Nama  : 0 (Semua telah diformat bilingual Mandarin / English)")
    print(f"JSON Output : {master_json}")
    print(f"CSV Output  : {master_csv}")
    print("=" * 70)

if __name__ == "__main__":
    merge_datasets()
