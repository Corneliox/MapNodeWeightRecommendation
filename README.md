# 🏝️ Penghu Climate-Aware Tourism & Node Routing Dataset Fetcher

Proyek ini berisi modul otomatis untuk mengekstrak, membersihkan, dan menggabungkan data geografis, pariwisata, minimarket, dan shelter di **Kepulauan Penghu (Taiwan)** dari 3 sumber utama:
1. **OpenStreetMap (OSM)** via Overpass API *(100% Gratis & Legal)*
2. **Taiwan Tourism Administration Open Data (v2.0)** *(100% Resmi Pemerintah Taiwan)*
3. **Google Cloud Places API (New)** *(Resmi via $200 Monthly Free Credit)*

---

## 📁 Struktur File & Dataset yang Dihasilkan

```text
MapNodeWeightRecommendation/
├── data/
│   ├── penghu_osm_pois.json / .csv           # 505 titik (50 Minimarket 7-Eleven/FamilyMart, 156 Shelter, 177 Wisata)
│   ├── penghu_taiwan_gov_pois.json / .csv    # 1.685 titik resmi (145 Atraksi, 152 Kuliner, 1.388 Penginapan)
│   ├── penghu_master_nodes.json / .csv       # 2.190 Master Nodes terstruktur untuk Graph Routing
│   └── penghu_google_places.json / .csv      # Hasil ekstraksi Google Places (Opsional)
├── fetch_penghu_osm.py                       # Script extractor OpenStreetMap
├── fetch_penghu_taiwan_opendata.py           # Script extractor Resmi Taiwan Gov
├── fetch_penghu_google_places.py             # Script extractor Google Cloud Places API (New)
├── merge_penghu_dataset.py                   # Script merger menjadi Master Node Dataset
├── requirements.txt                          # Dependencies (requests, pandas)
└── README.md
```

---

## 🚀 Cara Menjalankan Ekstraksi Data

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Jalankan Pengambilan Data OSM & Taiwan Government (Gratis)
```bash
# 1. Tarik data OpenStreetMap (Minimarket, Shelter, Titik Air)
python fetch_penghu_osm.py

# 2. Tarik data resmi Pemerintah Taiwan (Atraksi, Jam Buka, Tiket)
python fetch_penghu_taiwan_opendata.py

# 3. Gabungkan menjadi 1 Master Dataset (2.190 Node)
python merge_penghu_dataset.py
```

---

## 🌐 Tutorial: Mengambil Data dari Google Cloud (Places API)

Jika Anda ingin memperkaya data dengan ulasan dan rating bintang Google, gunakan langkah resmi berikut:

### Langkah 1: Buat Akun & Project di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Login dengan akun Google Anda.
3. Klik dropdown project di kiri atas $\rightarrow$ Pilih **"New Project"** $\rightarrow$ Beri nama `Penghu-Smart-Tourism` $\rightarrow$ Klik **Create**.

### Langkah 2: Aktifkan Billing (Mendapatkan $200 Free Credit / Bulan)
1. Buka menu **Billing** di bilah navigasi kiri.
2. Tautkan kartu debit/kredit. *(Google tidak akan memotong saldo selama penggunaan di bawah $200 USD / Rp 3,2 juta per bulan)*.

### Langkah 3: Aktifkan "Places API (New)"
1. Masuk ke **APIs & Services** $\rightarrow$ **Library**.
2. Cari `Places API (New)` dan klik **Enable**.

### Langkah 4: Buat & Amankan API Key
1. Buka **APIs & Services** $\rightarrow$ **Credentials**.
2. Klik **+ Create Credentials** $\rightarrow$ Pilih **API Key**.
3. Salin API Key Anda (format: `AIzaSy...`).
4. Klik **Edit API key** untuk memberi batasan (*API Restrictions*):
   * Pilih **Restrict key** $\rightarrow$ Centang hanya **Places API (New)** agar aman dari penyalahgunaan.

### Langkah 5: Pasang Budget Alert (Pengaman Saldo Rp 0)
1. Buka menu **Billing** $\rightarrow$ **Budgets & alerts**.
2. Buat budget baru dengan target **$1 USD** atau **$10 USD**.
3. Aktifkan notifikasi email di 50%, 90%, dan 100% agar mendapat peringatan otomatis jika mendekati batas kuota.

### Langkah 6: Jalankan Script Google Places
Set API Key Anda di terminal, lalu jalankan script:
```powershell
# Di Windows PowerShell:
$env:GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX"
python fetch_penghu_google_places.py
```
Script sudah dilengkapi dengan **Field Masking** (`X-Goog-FieldMask`), sehingga Google hanya menagih data field yang Anda butuhkan tanpa biaya tak terduga.
