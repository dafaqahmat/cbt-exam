# 📝 CBT Exam App

Aplikasi **Ujian Berbasis Komputer** (Computer-Based Test) yang dinamis dan multi-sesi. Cocok untuk ujian sekolah, tes rekrutmen, asesmen, hingga pelatihan.

> **Fokus utama:** ujian multi-sesi dinamis dengan timer per sesi, pengawasan anti-kecurangan, dan nilai yang diumumkan oleh admin.

---

## ✨ Fitur Utama

### 👨‍💼 Panel Admin
- **Kelola Peserta** — CRUD akun peserta + pembagian kategori
- **Kelola Ujian** — buat ujian dengan jumlah sesi bebas (1, 2, 10, dst), durasi tiap sesi, dan jeda istirahat antar sesi
- **Kelola Sesi** — atur judul, urutan, durasi, dan lama istirahat
- **Kelola Soal** — 4 tipe soal (teks→teks, teks→gambar, gambar→teks, gambar→gambar), 4 opsi jawaban (A–D), bobot nilai, upload gambar
- **Kelola Kategori** — kelompokkan peserta (Kelas 10, Kelas 11, Umum, dsb.)
- **Hasil Ujian** — sesuai kategori: nilai, jawaban, pelanggaran per sesi
- **Publish Hasil** — nilai baru tampil ke peserta setelah diumumkan admin
- **Notifikasi Email** — kirim pemberitahuan ujian ke peserta via SMTP (Gmail)
- **Laporan Ujian** — rekapitulasi data ujian

### 🧑‍🎓 Panel Peserta
- **Login** — autentikasi dengan JWT
- **Daftar Ujian** — lihat status (belum / sedang berjalan / selesai / nilai tersedia)
- **Halaman Ujian Aman** — soal + navigasi nomor + timer per sesi
- **Countdown 10 Detik** — sebelum ujian dimulai, muncul pengumuman pengawasan
- **Layar Istirahat** — countdown istirahat antar sesi, auto-lanjut ke sesi berikutnya
- **Hasil Ujian** — lihat nilai setelah dipublish admin

### 🛡️ Keamanan & Anti-Kecurangan
- **Kunci jawaban tidak pernah dikirim ke browser** — koreksi dilakukan di server saat submit
- **Fullscreen wajib** — keluar fullscreen tercatat sebagai pelanggaran
- **Blokir aksi** — klik kanan, copy/cut/paste, seleksi teks, shortcut (F12, Ctrl+C/V/U/S, Alt+←)
- **Deteksi pindah tab** (`visibilitychange`) — modal peringatan + `ViolationCount` tercatat ke server
- **Timer per sesi dihitung di server** — refresh aman, `GET /exams/:id/current` mengembalikan posisi terakhir
- **Auto-submit** saat waktu habis atau ujian ditutup admin (SSE streaming)
- **Auto logout** — saat token JWT expired, otomatis dialihkan ke halaman login

---

## 🛠️ Tech Stack

| Bagian | Teknologi | Folder | Port |
|---|---|---|---|
| Backend | Go + Gin + GORM + MySQL + JWT | `backend-golang/` | `3000` |
| Frontend | React + TypeScript + Vite + React Query + Tailwind CSS + shadcn/ui | `frontend-react-ts/` | `5173` |

---

## 📂 Struktur Proyek

```
cbt-exam/
│
├── backend-golang/                 # Backend API
│   ├── config/                     # Konfigurasi environment
│   ├── controllers/                # Logic endpoint API
│   ├── database/                   # Koneksi database & migration
│   ├── helpers/                    # Fungsi helper (hash password, dll)
│   ├── middlewares/                # Auth middleware (JWT, role check)
│   ├── models/                     # Model database (7 entitas)
│   ├── routes/                     # Definisi route API
│   ├── scripts/                    # Script seed database
│   ├── structs/                    # Struct request/response
│   ├── tmp/                        # Build output (air, auto-generated)
│   ├── uploads/                    # File upload (gambar soal)
│   ├── main.go                     # Entry point backend
│   ├── .env                        # Konfigurasi lokal (tidak di-commit)
│   └── .air.toml                   # Konfigurasi hot-reload
│
├── frontend-react-ts/              # Frontend
│   ├── src/
│   │   ├── assets/                 # Aset statis
│   │   ├── components/             # Komponen UI reusable (shadcn/ui)
│   │   ├── context/                # React Context (autentikasi)
│   │   ├── hooks/                  # Custom hooks (API calls per domain)
│   │   ├── routes/                 # Definisi route & guard
│   │   ├── services/               # Axios config, header auth, helper
│   │   ├── views/
│   │   │   ├── admin/              # Halaman admin
│   │   │   │   ├── dashboard/      # Dashboard
│   │   │   │   ├── users/          # Kelola peserta
│   │   │   │   ├── categories/     # Kelola kategori
│   │   │   │   ├── exams/          # Kelola ujian
│   │   │   │   ├── sections/       # Kelola sesi
│   │   │   │   ├── questions/      # Kelola soal
│   │   │   │   ├── results/        # Hasil ujian
│   │   │   │   ├── notifications/  # Notifikasi email
│   │   │   │   ├── reports/        # Laporan
│   │   │   │   └── profile/        # Profil admin
│   │   │   ├── auth/               # Halaman login
│   │   │   └── peserta/            # Halaman peserta
│   │   │       ├── exams/          # Daftar ujian
│   │   │       └── exam/           # Halaman ujian (take) & hasil (result)
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx                # Entry point frontend
│   ├── package.json                # Dependencies
│   ├── vite.config.ts              # Konfigurasi Vite
│   └── README.md                   # (template bawaan Vite)
│
└── README.md                       # Dokumentasi proyek
```

---

## ⚙️ Prasyarat

Sebelum mulai, pastikan sudah terinstal:

- **Go** 1.26+ ([golang.org](https://golang.org/dl/))
- **Node.js** 18+ & **npm** ([nodejs.org](https://nodejs.org/))
- **MySQL** 5.7+ ([mysql.com](https://www.mysql.com/))
- **Git**

> **Opsional:** [Air](https://github.com/air-verse/air) untuk hot-reload backend saat development (sudah dikonfigurasi di `.air.toml`).

---

## 🚀 Instalasi & Menjalankan

### 1. Clone Repository

```bash
git clone <url-repo>
cd cbt-exam
```

### 2. Setup Backend

```bash
cd backend-golang

# Salin file konfigurasi
cp .env.example .env
```

Lalu isi file `.env`:

```env
APP_PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password_mysql_anda
DB_NAME=db_cbt_exam

JWT_SECRET=ganti_dengan_secret_panjang_anda

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@cbt.local

# SMTP untuk kirim pemberitahuan email (opsional)
# Untuk Gmail gunakan App Password (bukan password biasa)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SENDER_NAME=CBT Exam
SMTP_SEND_DELAY_MS=300
```

Install dependency & jalankan:

```bash
go mod tidy
go run main.go        # database otomatis dibuat & dimigrasi saat startup
```

> **Catatan:** Database `db_cbt_exam` akan dibuat otomatis oleh MySQL driver. Akun admin pertama (dari `.env`) di-seed otomatis saat migrate.

#### Hot Reload dengan Air (opsional)

```bash
air
```

Server akan otomatis rebuild & restart setiap kali file `.go` berubah.

#### Seed Data Contoh (opsional)

```bash
go run scripts/seed/main.go
```

Akan membuat kategori, 20 peserta contoh (password: `peserta123`), dan contoh ujian dengan soal.

### 3. Setup Frontend

```bash
cd ../frontend-react-ts

npm install

# Jalankan development server
npm run dev
```

Frontend berjalan di **http://localhost:5173**.

---

## 🔐 Akun Default

| Role | Username | Password | Keterangan |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Dari `.env` |
| **Peserta** (hasil seed) | `budi`, `siti`, `andi`, ... | `peserta123` | Hanya jika menjalankan script seed |

---

## 🔄 Alur Ujian

```
Peserta login
   ↓
Pilih ujian aktif
   ↓
Layar PERINGATAN + countdown 10 detik
  "Ujian diawasi secara elektronik. Perilaku 💬 direkam.
   Tindakan terindikasi kecurangan otomatis tercatat di sistem."
   ↓
Sesi 1 (mode aman: fullscreen, timer sendiri di server)
   ↓
Submit / Auto-submit (waktu habis / ujian ditutup)
   ↓
Koreksi otomatis di server
   ↓
Layar Istirahat (countdown BreakAfterSeconds, tetap fullscreen)
   ↓
Sesi 2 → ... → Sesi N (sesi terakhir = tanpa istirahat)
   ↓
Selesai → total nilai disimpan
   ↓
Nilai tampil setelah admin publish hasil
```

**Aturan penting:**
- 1 peserta hanya boleh mengerjakan 1 ujian **satu kali**
- Timer setiap sesi dihitung di **server** (dari `StartedAt` `SectionAttempt`)
- Refresh halaman di tengah ujian aman: `GET /exams/:id/current` mengembalikan posisi terakhir
- Nilai akhir = jumlah nilai semua sesi

---

## 🌐 Endpoint API

### Publik

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/login` | Login, mengembalikan token JWT + data user |

### Admin (`/api/admin/*` — butuh token admin)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET/POST` | `/users` | Daftar / buat peserta |
| `PUT/DELETE` | `/users/:id` | Ubah / hapus peserta |
| `GET/POST` | `/categories` | Daftar / buat kategori |
| `PUT/DELETE` | `/categories/:id` | Ubah / hapus kategori |
| `GET/POST` | `/exams` | Daftar / buat ujian |
| `PUT/DELETE` | `/exams/:id` | Ubah / hapus ujian |
| `POST` | `/exams/:id/publish` | Publish nilai ujian |
| `GET/POST` | `/exams/:id/sections` | Daftar / buat sesi |
| `PUT/DELETE` | `/sections/:id` | Ubah / hapus sesi |
| `GET/POST` | `/sections/:id/questions` | Daftar / buat soal |
| `PUT/DELETE` | `/questions/:id` | Ubah / hapus soal |
| `POST` | `/upload` | Upload gambar (soal/opsi) |
| `GET` | `/exams/:id/results` | Hasil ujian per peserta |
| `GET` | `/sessions/:id/answers` | Jawaban sesi peserta |
| `POST` | `/exams/:id/notify` | Kirim notifikasi email ke peserta |
| `GET` | `/exams/:id/notify/preview` | Pratinjau isi email |
| `GET` | `/reports` | Laporan data ujian |
| `GET/PUT` | `/profile` | Profil admin sendiri |

### Peserta (`/api/*` — butuh token peserta)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/exams` | Daftar ujian aktif + status sesi peserta |
| `POST` | `/exams/:id/start` | Mulai ujian, mulai sesi pertama |
| `GET` | `/exams/:id/current` | Posisi terakhir (resume setelah refresh) |
| `GET` | `/sections/:id/questions` | Soal sesi **tanpa kunci jawaban** |
| `POST` | `/sections/:id/submit` | Kumpulkan sesi, koreksi di server |
| `POST` | `/sections/:id/start` | Mulai sesi berikutnya (setelah istirahat) |
| `POST` | `/exams/:id/violation` | Catat pelanggaran (pindah tab, dsb.) |
| `GET` | `/exams/:id/result` | Nilai (hanya jika hasil sudah dipublish) |
| `GET` | `/exams/:id/stream` | SSE — status ujian real-time (diubah/ditutup) |

---

## 🗄️ Struktur Data

| Entitas | Field utama |
|---|---|
| `User` | Name, Username, Email, Password, `Role` (`admin`/`peserta`), CategoryId |
| `Exam` | Title, Description, `Status` (`draft`/`active`/`closed`), ResultsPublished |
| `ExamSection` | ExamId, Title, `Order`, DurationMinutes, BreakAfterSeconds |
| `Question` | SectionId, QuestionText, QuestionImage, opsi A–D, CorrectAnswer (A–D), Points |
| `ExamSession` | UserId, ExamId, StartedAt, FinishedAt, TotalScore, ViolationCount, CurrentSectionId, Status |
| `SectionAttempt` | SessionId, SectionId, StartedAt, FinishedAt, Score |
| `Answer` | SessionId, QuestionId, SelectedOption, IsCorrect |

---

## 🧰 Script yang Tersedia

### Backend

```bash
# Jalankan server
go run main.go

# Hot reload
air

# Seed data contoh
go run scripts/seed/main.go

# Build binary
go build -o cbt-backend.exe .
```

### Frontend

```bash
# Jalankan development server
npm run dev

# Build produksi
npm run build

# Lint & type check
npm run lint
```

---

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

---

## 📄 Lisensi

© CBT Exam App. Dibuat untuk keperluan ujian berbasis komputer.

---

*Dibuat dengan ❤️ — Go, React, dan MySQL.*