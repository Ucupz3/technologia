# DOKUMENTASI LENGKAP ALUR SISTEM TEKNA ERP
## Smart Order, Penugasan Selektif Berbasis Fase, & Pemeliharaan 2 Tingkat (Per-Role & Pusat)

---

## 1. Ringkasan Eksekutif

Sistem ERP Tekna mengintegrasikan alur bisnis software development house mulai dari pembuatan pesanan klien (*Order Creation*), rekomendasi cerdas tim (*Smart Team Recommendation*), penugasan selektif per anggota tim berbasis keahlian (*Selective Job Assignment*), pengerjaan bertahap dengan ketergantungan fase (*Phase-Locked Task & Progress*), hingga **Sistem Pemeliharaan 2 Tingkat (Maintenance Per-Job & Maintenance Pusat)**.

Arsitektur ini memastikan tidak ada developer yang salah ditugaskan, pengerjaan proyek berjalan teratur secara sekuensial (fase 1 harus 100% sebelum fase 2 dimulai), dan masa transisi pemeliharaan modul berjalan mulus sebelum proyek disahkan selesai untuk masa garansi klien.

---

## 2. Diagram Alur Utama (End-to-End Workflow)

```mermaid
flowchart TD
    A["1. CS / Admin Buat Order Baru"] --> B["Pilih Klien & Layanan (cth: UI/UX Saja)"]
    B --> C["Sistem Evaluasi Tim (Smart Recommendation)"]
    C -->|Cocok| D["Tim Terpilih (Keahlian Sesuai)"]
    C -->|Tidak Cocok| E["Tim Abu-abu / Disabled"]
    
    D --> F["Penugasan Anggota Selektif (Selective Assignment)"]
    F -->|Cocok| G["[✓] Ditugaskan (Auto-checked)"]
    F -->|Tidak Cocok| H["[ ] Tidak Ditugaskan (Muted / Dashed)"]
    
    G --> I["Atur Fase Pengerjaan (Fase 1, Fase 2, dst.) & Simpan Order"]
    I --> J["Invoice Otomatis Terbit (No-Collision INV-YYYYMM-XXX)"]
    
    J --> K["2. Developer Masuk ke Workspace & Task Progress"]
    K --> L{"Cek Fase Pengerjaan"}
    L -->|Fase 1| M["Tugas Aktif (Bisa Dikerjakan)"]
    L -->|Fase > 1 & Fase Sebelumnya < 100%| N["Tugas Terkunci (Locked: Menunggu Fase Terdahulu)"]
    
    M --> O["Developer Kerjakan & Update Progres (0% - 100%)"]
    O -->|Progres < 100%| M
    O -->|Progres = 100% (Completed)| P["3. TINGKAT 1: Pemeliharaan Modul (Internal Developer)"]
    
    P --> Q["Otomatis Terbit Tiket: Pemeliharaan Modul: [Nama Job]"]
    P --> R["Fase Berikutnya (Fase 2) Otomatis Terbuka / Unlocked"]
    P --> S["Developer Standby di Menu Maintenance (Support / Revisi Aset)"]
    
    R --> T{"Apakah SEMUA Anggota & SEMUA Fase Selesai 100%?"}
    T -->|Belum| U["Fase Berikutnya Berjalan"]
    T -->|Sudah Semua 100%| V["4. TINGKAT 2: Maintenance Pusat (Garansi Pasca Rilis)"]
    
    V --> W["Order Otomatis Diubah Menjadi 'Completed'"]
    V --> X["Otomatis Terbit Tiket: Garansi Sistem Pasca Rilis (Pusat)"]
    V --> Y["Masuk ke Jadwal Maintenance Pusat (Admin / SuperAdmin & Tim)"]
```

---

## 3. Tahap 1: Pembuatan Order & Rekomendasi Cerdas Tim

### A. Evaluasi Keahlian Tim Otomatis (Smart Recommendation)
Ketika Admin, SuperAdmin, atau CS memilih layanan (misal: *Layanan UI/UX Design*), sistem membaca kebutuhan posisi yang dipersyaratkan melalui fungsi pencocokan kata kunci:
* **Analisis Layanan**: Jika pesanan hanya membutuhkan UI/UX, sistem mendeteksi kata kunci `ui`, `ux`, `design`.
* **Klasifikasi Tim**:
  * **Tim Cocok**: Memiliki anggota dengan posisi yang sesuai dengan kebutuhan layanan. Ditampilkan dengan badge `Cocok` dan rincian keahlian anggota yang relevan.
  * **Tim Tidak Cocok**: Tidak memiliki anggota dengan keahlian yang dipesan. Ditampilkan dalam kondisi abu-abu (*disabled*) dengan badge `Keahlian Tidak Ada`, mencegah kesalahan penugasan sejak awal.

### B. Penugasan Anggota Selektif (Selective Assignment)
Meskipun sebuah tim memiliki banyak anggota (misalnya: UI/UX, Frontend, Backend, QA), jika klien hanya memesan modul tertentu:
1. Anggota tim dengan keahlian yang cocok otomatis dicentang **`[✓] Ditugaskan`** dan posisi pekerjaannya otomatis terpilih.
2. Anggota tim dengan keahlian yang tidak dibutuhkan pesanan tersebut secara default diset ke **`[ ] Tidak Ditugaskan`** dengan tampilan kartu bergaris putus-putus (*dashed/muted*).
3. Penanggung jawab (Admin/CS) tetap memiliki fleksibilitas untuk mengubah status centang jika diperlukan penugasan khusus.
4. Minimal 1 anggota tim wajib ditugaskan agar pesanan dapat diproses.

### C. Penomoran Invoice & Order Bebas Tabrakan (Anti-Collision)
* Generator nomor `ORD-YYYYMM-XXX` dan `INV-YYYYMM-XXX` memindai angka urutan terbesar (*max numeric suffix*) yang sudah ada di database, kemudian melakukan verifikasi berulang (*while loop existence check*).
* Hal ini mencegah terjadinya error *unique constraint violation* jika ada data pesanan atau invoice sebelumnya yang terhapus atau memiliki celah nomor.

---

## 4. Tahap 2: Pengerjaan Bertahap (Phase-Locked Task & Progress)

### A. Pengaturan Urutan Fase
Setiap pekerjaan penugasan diberikan atribut urutan fase (`phase_order`):
* **Fase 1**: Mulai Pertama (misal: UI/UX Designer merancang wireframe & prototype).
* **Fase 2**: Mulai Setelah Fase 1 Selesai (misal: Frontend Developer melakukan slicing antarmuka).
* **Fase 3**: Mulai Setelah Fase 2 Selesai (misal: Backend Developer mengintegrasikan API).
* **Fase 4**: Quality Assurance (QA Tester menguji sistem secara menyeluruh).

### B. Mekanisme Kunci Otomatis (Phase Lock)
1. Backend secara otomatis memeriksa seluruh tugas saudara (*sibling assignments*) dalam order yang sama.
2. Jika tugas berada pada Fase $> 1$ dan fase di bawahnya belum mencapai progres **100%** (atau status belum `completed`):
   * Tugas diberi status `is_locked: true`.
   * Sistem menyertakan alasan kunci yang informatif: `Menunggu fase 1 (UI/UX Designer) selesai 100%`.
   * Developer tidak dapat memperbarui progres atau memulai pekerjaan hingga fase pendahulunya selesai.
3. Begitu fase sebelumnya mencapai 100%, sistem secara *real-time* membuka kunci (*unlock*) untuk tugas di fase berikutnya.

---

## 5. Tahap 3: Pemeliharaan 2 Tingkat (Maintenance Architecture)

Sistem membedakan pemeliharaan internal modul dengan garansi sistem resmi pasca rilis melalui arsitektur 2 tingkat:

### Tingkat 1: Pemeliharaan Modul (Internal Developer / Per-Job)
* **Pemicu**: Begitu seorang developer menyelesaikan tugasnya hingga **progres 100%** (`completed`) di halaman *Task & Progress*.
* **Tindakan Sistem**:
  1. Status tugas berubah menjadi selesai, dan muncul tombol pintas: `✓ Selesai 100% • Buka di Maintenance Modul`.
  2. Sistem otomatis membuat tiket di tabel `maintenances`:
     * **Judul**: `Pemeliharaan Modul: [Nama Posisi]` (contoh: *Pemeliharaan Modul: UI/UX Designer*).
     * **Deskripsi**: `Tugas [Nama Posisi] telah selesai 100%. Modul dalam masa standby dan pemeliharaan internal.`
     * **Status**: `scheduled` (atau dapat diubah ke `in_progress` saat ada revisi kecil).
  3. Tiket langsung muncul di menu **Maintenance** developer bersangkutan dengan badge khusus:
     $$\text{Badge Ungu} \rightarrow \mathbf{Pemeliharaan\ Modul\ (Internal)\ \bullet\ [Nama\ Posisi]}$$
* **Tujuan**:
  Developer tetap berada dalam masa *standby* untuk modulnya sendiri selama proyek berlangsung. Jika tim di fase berikutnya (misalnya Frontend) membutuhkan penyesuaian aset desain atau perbaikan komponen, developer terkait dapat langsung berkoordinasi dan mencatat log perbaikan di menu Maintenance modulnya.
* **Isolasi Akses**:
  Developer hanya melihat tiket pemeliharaan modul miliknya sendiri, menjaga kerahasiaan dan fokus kerja masing-masing peran.

---

### Tingkat 2: Maintenance Pusat (Garansi Pasca Rilis / SuperAdmin & Admin)
* **Pemicu**:
  1. **Otomatis**: Ketika **SEMUA** anggota tim dan **SEMUA** fase pekerjaan pada order tersebut telah mencapai progres 100% (`completed`).
  2. **Manual**: Saat Admin / SuperAdmin mengesahkan perubahan status order menjadi `completed` di menu manajemen order.
* **Tindakan Sistem**:
  1. Status order utama diperbarui menjadi `completed`.
  2. Riwayat audit dicatat pada `order_status_history`:
     `Seluruh fase dan tugas developer selesai 100%. Proyek otomatis selesai dan masuk ke Jadwal Pemeliharaan Pusat.`
  3. Sistem otomatis membuat tiket pemeliharaan pusat:
     * **Judul**: `Garansi Sistem Pasca Rilis (Pusat)`
     * **Deskripsi**: `Seluruh tahapan proyek (100%) telah selesai dikerjakan. Proyek masuk ke masa garansi dan pemeliharaan pusat.`
     * **Status**: `scheduled`
     * **Periode**: Aktif selama 30 hari kalender sejak tanggal penyelesaian proyek.
  4. Tiket ini masuk ke:
     * Jadwal dan manajemen pusat Admin & SuperAdmin (`/admin/schedules`, `/super-admin/schedules`).
     * Menu Maintenance seluruh anggota tim proyek dengan badge resmi:
       $$\text{Badge Hijau} \rightarrow \mathbf{Garansi\ Pasca\ Rilis\ (Pusat)}$$
* **Tujuan**:
  Menampung laporan pasca rilis resmi dari klien, penanganan garansi sistem *bug fixing*, monitoring performa server, dan SLA resmi perusahaan.

---

### Tingkat Khusus: Penanganan Komplain Klien & Order Turunan (Child Order Maintenance)
* **Konteks**:
  Ketika suatu order utama telah selesai (`completed`), klien dapat menyampaikan laporan keluhan/error teknis (misal error 500 API backend atau bug tampilan).
* **Alur di Dashboard & Menu Admin**:
  1. Admin membuka menu **Maintenance** (`/admin/maintenance`) atau widget di Dashboard Admin.
  2. Klik **"+ Tambah Maintenance"**:
     * Dropdown hanya menampilkan order yang **berstatus `completed`**.
     * Admin memilih bagian/job yang error (misal: *Backend Developer*).
     * Admin memilih developer yang ditugaskan menangani perbaikan tersebut.
     * Mengisi rincian kendala/komplain dari klien serta target tanggal perbaikan.
  3. **Aksi Otomatis Sistem**:
     * Menerbitkan **Order Turunan (Child Order)** baru dengan field `parent_order_id` yang terhubung ke order induk yang telah selesai.
     * Membuat `order_assignments` untuk developer yang ditugaskan memperbaiki kendala tersebut.
     * Membuat tiket di tabel `maintenances` dengan relasi ke child order tersebut.
* **Alur di Menu Maintenance Developer**:
  1. Halaman **Maintenance Developer** (`/developer/maintenance`) secara khusus menampilkan kartu kendala yang ditugaskan kepada developer tersebut dengan label `Perbaikan Kendala Klien (Order Turunan)`.
  2. Ketika kartu diklik, developer diarahkan ke **Halaman Baru: Detail Maintenance** (`/developer/maintenance/:id`).
  3. **Isi Halaman Detail Maintenance**:
     * **Informasi Order Sebelumnya (Induk)**: nomor order induk, nama klien, kontak klien, alamat, periode proyek induk, dan layanan awal.
     * **Tim yang Mengerjakan**: developer penanggung jawab perbaikan saat ini serta seluruh anggota tim dari order induk sebelumnya.
     * **Rincian Kendala & Error dari Klien**: keluhan lengkap, deskripsi bug, dan pesan error yang dilaporkan ke Admin.
     * **Progres & Update Status Maintenance**: formulir pengubahan status (`scheduled` $\rightarrow$ `in_progress` $\rightarrow$ `completed`) dan catatan teknis perbaikan (*fix report*).
     * Ketika status disahkan `completed`, status order turunan otomatis ikut terselesaikan (`completed`).

---

## 6. Matriks Perbandingan Tingkat Pemeliharaan

| Parameter | Tingkat 1: Pemeliharaan Modul (Internal) | Tingkat 2: Maintenance Pusat (Pasca Rilis) |
| :--- | :--- | :--- |
| **Level Pengguna** | Developer (Per-Role / Per-Job) | Admin, SuperAdmin, & Seluruh Tim Proyek |
| **Syarat Masuk** | Progres tugas spesifik developer mencapai 100% | Seluruh fase & tugas dalam order selesai 100% |
| **Status Order Induk** | Masih berjalan (`in_progress`) atau `completed` | Sudah tuntas (`completed`) |
| **Identitas Visual** | Badge Ungu (`Pemeliharaan Modul (Internal)`) | Badge Hijau (`Garansi Pasca Rilis (Pusat)`) |
| **Fokus Kegiatan** | Standby internal, revisi aset, integrasi antar-fase | Garansi resmi klien, bug fix pasca rilis, server monitoring |
| **Cakupan Akses** | Spesifik pada modul masing-masing developer | Menyeluruh untuk sistem proyek klien |

---

## 7. Rincian Perubahan File & Komponen Sistem

### Backend Express API (`backend-express`)

1. **`src/routes/developer-tasks.js`**:
   * Menangani pembaruan progres (`PUT /api/v1/developer/tasks/:id`).
   * Validasi kunci fase (*phase lock check*) sebelum progres dapat diubah.
   * Logika pemicu: otomatisasi pembuatan tiket `Pemeliharaan Modul` saat progres mencapai 100%.
   * Logika pemicu: verifikasi penyelesaian seluruh penugasan dalam satu order untuk mengubah status order ke `completed` dan menerbitkan tiket `Garansi Pasca Rilis (Pusat)`.

2. **`src/routes/developer-maintenance.js`**:
   * Menangani pengambilan data pemeliharaan (`GET /api/v1/developer/maintenance`).
   * Query multi-kondisi: menampilkan order yang berstatus `completed` **atau** order `in_progress` yang memiliki tugas developer dengan progres 100%.
   * Filter tiket presisi: memastikan developer hanya menerima tiket modul yang sesuai dengan keahlian/tugasnya ditambah tiket garansi pusat saat proyek selesai.
   * Endpoint pembaruan status dan catatan teknis laporan pemeliharaan (`PUT /:id`).

3. **`src/routes/orders.js`**:
   * Menangani pembuatan order (`POST /api/v1/orders`) dengan validasi minimal 1 anggota tim ditugaskan.
   * Mengintegrasikan generator nomor anti-tabrakan untuk order dan invoice.
   * Menangani patch status order (`PATCH /api/v1/orders/:id/status`) dengan pembuatan tiket garansi pusat otomatis saat order disahkan `completed`.

4. **`src/routes/schedules.js`**:
   * Memisahkan endpoint kalender timeline (`GET /api/v1/schedules`) dan endpoint manajemen pemeliharaan pusat (`GET /api/v1/schedules/maintenances`).

5. **`src/lib/orderHelpers.js`**:
   * Implementasi algoritma pemindaian akhiran numerik tertinggi (`max numeric suffix loop`) untuk menghasilkan nomor pesanan dan invoice yang unik dan aman dari tabrakan konkurensi.

---

### Frontend Laravel + Inertia/React (`frontend-laravel`)

1. **`resources/js/Pages/Developer/Tasks/Index.jsx`**:
   * Halaman interaktif *Task & Progress* developer.
   * Filter status tugas (*Semua*, *Sedang Dikerjakan*, *Selesai*, *Terkunci*).
   * Modal pembaruan progres interaktif dengan slider persentase, pemilihan status otomatis (100% otomatis set `completed`), dan catatan teknis.
   * Banner informatif perpindahan tugas ke tahap pemeliharaan modul saat nilai diset ke 100%.
   * Tautan tombol langsung menuju halaman Maintenance saat tugas tuntas.

2. **`resources/js/Pages/Developer/Maintenance/Index.jsx`**:
   * Halaman pemeliharaan developer dengan filter tab:
     * *Semua*
     * *Pemeliharaan Modul (Internal)* (Badge Ungu)
     * *Garansi Pasca Rilis (Pusat)* (Badge Hijau)
   * Kartu proyek dengan accordion untuk melihat rincian tiket pemeliharaan.
   * Kartu statistik: Total Tiket, Pemeliharaan Modul, Garansi Pasca Rilis, dan Selesai.
   * Modal pembaruan status pemeliharaan (`scheduled`, `in_progress`, `completed`, `cancelled`) dan catatan perbaikan.

3. **`resources/js/Pages/Developer/Index.jsx`**:
   * Dashboard utama developer yang menampilkan ringkasan kartu proyek penugasan.
   * Status pekerjaan cerdas yang langsung mengarahkan job selesai ke menu Maintenance atau job aktif ke Task & Progress.

4. **`resources/js/Pages/Admin/Orders/Create.jsx`**, **`SuperAdmin/Orders/Create.jsx`**, & **`CS/Orders/Create.jsx`**:
   * Form pembuatan pesanan dengan *Smart Recommendation*.
   * Dropdown seleksi tim dengan penanda `[Cocok]` atau `[Keahlian Tidak Ada]` (*disabled*).
   * Form penugasan anggota tim selektif dengan centang penugasan, pemilihan peran, dan penentuan nomor urut fase pengerjaan.

5. **`resources/js/Pages/Admin/Schedules/Index.jsx`**:
   * Halaman kalender jadwal proyek dan timeline pemeliharaan yang terintegrasi untuk level Admin.

---

## 8. Panduan Pengujian & Verifikasi Alur

Untuk menguji alur kerja ini secara langsung:

1. **Membuat Pesanan**:
   * Buka menu *Orders -> Create Order* (sebagai Admin / CS).
   * Pilih layanan (contoh: *Jasa Desain UI/UX*).
   * Perhatikan pilihan tim: tim yang memiliki posisi UI/UX Designer akan berlabel `Cocok`, sedangkan tim tanpa keahlian tersebut akan berwarna abu-abu.
   * Pilih tim yang cocok: perhatikan bahwa hanya anggota dengan posisi UI/UX yang otomatis dicentang `[✓] Ditugaskan`.
   * Simpan pesanan. Invoice awal otomatis terbuat tanpa tabrakan ID.

2. **Pengerjaan & Kunci Fase**:
   * Login sebagai developer yang memegang Fase 1.
   * Buka *Task & Progress*: tugas Fase 1 aktif dan dapat diubah progresnya.
   * Login sebagai developer yang memegang Fase 2: tugas Fase 2 menampilkan status `Terkunci` dengan keterangan menunggu Fase 1 selesai 100%.

3. **Transisi ke Pemeliharaan Modul (Tingkat 1)**:
   * Developer Fase 1 membuka modal *Update Progres*, geser slider ke **100%**, dan simpan.
   * Tugas Fase 1 berubah menjadi `Selesai 100% • Buka di Maintenance Modul`.
   * Buka menu *Maintenance*: muncul tiket bertanda ungu `Pemeliharaan Modul (Internal) • UI/UX Designer`.
   * Developer Fase 2 kini otomatis terbuka kuncinya (*unlocked*) dan siap dikerjakan.

4. **Transisi ke Maintenance Pusat (Tingkat 2)**:
   * Selesaikan tugas Fase 2 (dan seluruh fase tersisa) hingga semuanya bernilai 100%.
   * Begitu tugas terakhir selesai 100%, sistem otomatis mengubah status pesanan menjadi `completed`.
   * Buka menu *Maintenance*: muncul tiket bertanda hijau `Garansi Pasca Rilis (Pusat)` untuk masa garansi 30 hari.
   * Pada level Admin/SuperAdmin, proyek tersebut otomatis terdaftar pada jadwal pemeliharaan pusat.

