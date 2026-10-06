# Mengedit Feature Project

Plan: [Project Feature Update](../plans/project-feature-update.md) · Progress: [implementation log](../progress/project-feature-update.md)

## Cara mengedit

1. Buka tabel **Data tersimpan** pada dock editor peta.
2. Pilih **Edit** di baris Feature yang ingin diperbarui.
3. Ubah atribut pada panel edit. Panel tidak mengunci peta.
4. Pada peta, geser feature atau vertex untuk mengubah geometri. Geser titik tengah untuk menambah vertex; pilih vertex lalu tekan **Delete** untuk menghapusnya.
5. Pilih **Simpan Feature**. Atribut dan geometri dikirim bersama ke TileServer.

Penyuntingan memakai skema form Project. ID, metadata sistem, dan field lampiran tidak dapat diubah di Map Editor. Lampiran tetap dikelola dari aplikasi terkait.

## Pembatalan dan kesalahan

- Jika ada perubahan yang belum disimpan, **Batal edit** meminta konfirmasi sebelum membuangnya.
- Jika TileServer menolak perubahan atau koneksi gagal, panel tetap terbuka dengan nilai atribut dan geometri saat ini. Perbaiki atau coba simpan lagi.
- Project geometry type, validitas geometri, geofence, serta aturan atribut wajib tetap diperiksa oleh TileServer.

## Kontrak penyimpanan

Map Editor mengirim `PATCH /api/tileserver/api/v1/projects/{project_id}/features/{feature_id}` dengan `geometry` dan `attributes`. Atribut lampiran yang tidak dikirim tetap dipertahankan oleh operasi merge atribut TileServer.

## Indikator GPS

Saat lokasi perangkat ditemukan, peta menampilkan radius akurasi berwarna soft blue dan pulse lembut di titik lokasi. Pulse mengikuti preferensi reduced-motion perangkat.
