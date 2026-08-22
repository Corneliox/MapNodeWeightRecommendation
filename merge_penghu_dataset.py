"""
Script: merge_penghu_dataset.py
Deskripsi: Menggabungkan, membersihkan dataset OpenStreetMap (OSM) dan Taiwan Gov OpenData,
          serta mengunduh thumbnail foto Wikipedia secara otomatis per minggu.
"""

import os
import json
import re
import requests
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

# Database Landmark Wikipedia Utama di Penghu
WIKI_LANDMARKS = {
    "通梁古榕": {"title_en": "Tongliang_Great_Banyan", "title_zh": "通梁古榕"},
    "澎湖跨海大橋": {"title_en": "Penghu_Great_Bridge", "title_zh": "澎湖跨海大橋"},
    "跨海大橋": {"title_en": "Penghu_Great_Bridge", "title_zh": "澎湖跨海大橋"},
    "大菓葉柱狀玄武岩": {"title_en": "Xiyu", "title_zh": "西嶼鄉"},
    "奎壁山摩西分海": {"title_en": "Huxi,_Penghu", "title_zh": "奎壁山"},
    "山水沙灘": {"title_en": "Magong", "title_zh": "山水沙灘"},
    "風櫃洞": {"title_en": "Fenggui_Blowholes", "title_zh": "風櫃洞"},
    "漁翁島燈塔": {"title_en": "Yuwengdao_Lighthouse", "title_zh": "漁翁島燈塔"},
    "雙心石滬": {"title_en": "Twin-Heart_Stone_Weir", "title_zh": "七美雙心石滬"},
    "澎湖天后宮": {"title_en": "Penghu_Tianhou_Temple", "title_zh": "澎湖天后宮"},
    "中央老街": {"title_en": "Magong", "title_zh": "中央街_(馬公市)"},
    "二崁聚落": {"title_en": "Xiyu", "title_zh": "二崁村"}
}

def fetch_wikipedia_thumbnail(title_en, title_zh):
    """Mengambil URL foto thumbnail resmi langsung dari Wikipedia REST API."""
    headers = {
        "User-Agent": "PenghuTourismBot/1.0 (https://github.com/Corneliox/MapNodeWeightRecommendation; contact@example.com)"
    }
    
    # Coba versi Inggris terlebih dahulu
    if title_en:
        try:
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title_en}"
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                thumb = r.json().get("thumbnail", {}).get("source")
                if thumb:
                    return thumb
        except Exception:
            pass

    # Coba versi Mandarin jika versi Inggris tidak ada foto
    if title_zh:
        try:
            url = f"https://zh.wikipedia.org/api/rest_v1/page/summary/{title_zh}"
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                thumb = r.json().get("thumbnail", {}).get("source")
                if thumb:
                    return thumb
        except Exception:
            pass

    return None

def clean_and_translate_name(name_zh, name_en, category, raw_tags=None):
    raw_tags = raw_tags or {}
    
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

    if not name_en or name_en == name_zh:
        translated_en = name_zh
        for zh_term, en_term in ZH_TO_EN_TERMS.items():
            if zh_term in translated_en:
                translated_en = translated_en.replace(zh_term, en_term)
        
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

    print("[1/3] Mengambil dan memperbarui foto thumbnail Wikipedia secara otomatis...")
    wiki_images_cache = {}
    for landmark_name, meta in WIKI_LANDMARKS.items():
        thumb_url = fetch_wikipedia_thumbnail(meta.get("title_en"), meta.get("title_zh"))
        if thumb_url:
            wiki_images_cache[landmark_name] = thumb_url
            print(f"      -> Foto Wikipedia ditemukan untuk: {meta.get('title_en') or landmark_name.encode('ascii', 'ignore').decode('ascii')}")

    master_nodes = []
    
    # 1. Proses Data OpenStreetMap
    for item in osm_data:
        zh, en = clean_and_translate_name(
            item.get("name_zh") or item.get("name"),
            item.get("name_en"),
            item.get("category"),
            item.get("raw_tags")
        )
        
        bilingual_title = f"{zh} / {en}" if zh != en else zh

        # Cek apakah memiliki thumbnail Wikipedia
        image_url = None
        has_wiki = False
        for landmark_key, img_link in wiki_images_cache.items():
            if landmark_key in zh or landmark_key in en:
                image_url = img_link
                has_wiki = True
                break

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
            "has_ac": True if (item.get("air_conditioning") == "yes" or item["category"] == "convenience_store") else None,
            "has_wikipedia": has_wiki,
            "image_url": image_url,
            "weight_scale": 1.6 if has_wiki else 1.0  # Bobot ukuran lingkaran lebih besar untuk Wikipedia POI
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

        # Cek gambar pemerintah atau Wikipedia
        image_url = item.get("image_url")
        has_wiki = False
        for landmark_key, img_link in wiki_images_cache.items():
            if landmark_key in zh:
                image_url = img_link
                has_wiki = True
                break

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
            "has_ac": True if item["category"] in ["restaurants", "hotels"] else None,
            "has_wikipedia": has_wiki,
            "image_url": image_url,
            "weight_scale": 1.6 if has_wiki else 1.0
        })

    # Simpan Master Dataset Bersih
    master_json = os.path.join("data", "penghu_master_nodes.json")
    master_csv = os.path.join("data", "penghu_master_nodes.csv")

    with open(master_json, "w", encoding="utf-8") as f:
        json.dump(master_nodes, f, ensure_ascii=False, indent=2)

    df = pd.DataFrame(master_nodes)
    df.to_csv(master_csv, index=False, encoding="utf-8-sig")

    print("[2/3] Master dataset Penghu berhasil diperbarui!")
    print(f"      Total Nodes   : {len(master_nodes)}")
    print(f"      Wikipedia POIs: {len([n for n in master_nodes if n.get('has_wikipedia')])}")
    print(f"      JSON Output   : {master_json}")
    print(f"      CSV Output    : {master_csv}")

if __name__ == "__main__":
    merge_datasets()
