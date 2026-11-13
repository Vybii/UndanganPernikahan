# Menyambungkan Oracle Database + login admin

Arsitektur: browser → **server Node.js** (`server/`) → **Oracle Database**.
Browser tidak pernah bicara langsung ke Oracle. Semua aturan akses (siapa boleh baca/tulis apa)
dijaga di server, jadi aman untuk acara sungguhan.

Tanpa server + database, situs tetap tampil, tetapi RSVP, doa, dan foto hanya tersimpan di HP
masing-masing tamu dan admin tidak akan melihatnya.

## 1. Siapkan Oracle Database

Pilih salah satu. Butuh Oracle **12.1.0.2 atau lebih baru** (19c, 21c, 23ai, XE semuanya bisa).

**A. Oracle Autonomous Database (Cloud, ada paket Always Free)**
1. Buat Autonomous Database (tipe Transaction Processing / JSON), catat password user `ADMIN`.
2. **Database connection > Download wallet**, buat password wallet, ekstrak zip-nya ke folder `wallet/` (di root proyek).
3. Di `.env`: `ORACLE_CONNECT_STRING` = salah satu alias di `wallet/tnsnames.ora` (mis. `wedding_high`),
   `ORACLE_WALLET_DIR=./wallet`, `ORACLE_WALLET_PASSWORD=...`.

**B. Oracle XE / Oracle di server sendiri**
1. Pastikan listener bisa dijangkau dari server aplikasi (port 1521).
2. `ORACLE_CONNECT_STRING=host:1521/nama_service` (XE: `XEPDB1`).

## 2. Buat user khusus aplikasi

Masuk sebagai admin database (`SYSTEM`/`ADMIN`, pada PDB-nya), lalu jalankan:

```sql
CREATE USER wedding IDENTIFIED BY "GantiPasswordKuat_123";
GRANT CREATE SESSION, CREATE TABLE TO wedding;
ALTER USER wedding QUOTA UNLIMITED ON users;   -- Autonomous: ganti "users" dengan "data"
```

Isi `ORACLE_USER=wedding` dan `ORACLE_PASSWORD=...` di `.env`.
Tabel dibuat **otomatis** saat server pertama jalan (atau manual: `npm run db:init`, atau jalankan `server/schema.sql`).

## 3. Buat akun admin (WAJIB, pengganti admin123)

```
npm install
npm run setup-admin
```
Masukkan email dan password (min. 10 karakter). Skrip mencetak 3 baris (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
`SESSION_SECRET`). Tempel ke `.env`. Password asli tidak disimpan; yang tersimpan hanya hash-nya.

**Ganti password nanti:** jalankan `npm run setup-admin` lagi, ganti 3 baris itu, restart server.

## 4. Jalankan

```
cp .env.example .env     # lalu isi
npm run build
npm start                # buka http://localhost:3000
```
Login admin: `http://localhost:3000/admin/login`.

Mode pengembangan (hot reload): terminal 1 `npm run dev:server`, terminal 2 `npm run dev`
(buka http://localhost:8443, `/api` otomatis diteruskan ke server).

## Cara kerja pengamanan
- `/admin` dan `/admin/...` hanya dirender setelah server mengonfirmasi sesi login. Tanpa itu langsung dialihkan ke login.
- Yang lebih penting: **server menolak (401/403)** semua pembacaan daftar tamu, nomor telepon, statistik,
  serta semua penulisan/penghapusan data admin tanpa sesi. Jadi mengetik `domain/admin` atau memanggil API langsung tidak membuka apa pun.
- Sesi memakai cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` bila lewat HTTPS), berlaku `SESSION_HOURS` jam.
- Login dibatasi 10 percobaan per 15 menit per IP. Password disimpan sebagai hash scrypt.
- Tamu hanya bisa: membaca konten undangan/doa/foto, mengirim RSVP/doa/foto/hati, dan mengambil
  data undangannya sendiri (tanpa nomor telepon). Kiriman tamu dibersihkan dan dibatasi ukurannya di server.

## Link tamu
`https://domain-anda/?guest=1`, `?guest=2`, dst. Nomor mudah ditebak, jadi jangan menaruh informasi rahasia di undangan.

## Yang bisa dilakukan tamu vs admin
- Tamu: melihat undangan, mengirim RSVP, doa, hati, foto, dan melihat doa/foto tamu lain.
- Admin: daftar tamu & nomor telepon, check-in, statistik, CMS, lagu, hapus doa/foto.
