# Panduan hosting (siap online)

Aplikasi ini sekarang = **situs (folder `dist/`) + server Node.js + Oracle Database**.
Satu proses Node (`npm start`) melayani situs dan API sekaligus, jadi yang di-hosting hanya satu aplikasi.

> Hosting statis murni (seret `dist` ke Netlify Drop, cPanel `public_html` biasa) **tidak cukup** karena
> tidak bisa menjalankan server Node. Pakai VPS, container, atau PaaS yang mendukung Node.js 22+.

## Sebelum deploy
1. Oracle siap dan user + tabel sudah ada: ikuti `PANDUAN-DATABASE.md` langkah 1 sampai 3.
2. Server hosting harus bisa menjangkau Oracle (port 1521 untuk Oracle biasa, 1522 untuk Autonomous;
   di Autonomous atur *Access Control List* agar IP server hosting diizinkan).
3. HTTPS wajib (cookie login admin memakai `Secure`). Set `TRUST_PROXY=1` bila ada proxy/load balancer di depan.

## Opsi 1: VPS (Ubuntu) + PM2 + Nginx
```
# di server: Node 22, git, nginx
git clone <repo-anda> undangan && cd undangan
npm install
cp .env.example .env && nano .env      # isi Oracle + hasil setup-admin
npm run build
npm i -g pm2
pm2 start server/index.mjs --name undangan
pm2 save && pm2 startup
```
Nginx (`/etc/nginx/sites-available/undangan`), lalu `certbot --nginx -d domain-anda.com` untuk HTTPS:
```
server {
  server_name domain-anda.com;
  client_max_body_size 20m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
Update versi baru: `git pull && npm install && npm run build && pm2 restart undangan`.

## Opsi 2: Docker
```
docker build -t undangan .
docker run -d -p 3000:3000 --env-file .env --restart unless-stopped undangan
```
Untuk Autonomous, letakkan folder `wallet/` di image/volume dan arahkan `ORACLE_WALLET_DIR` ke sana.

## Opsi 3: PaaS (Railway, Render, dll)
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Isi semua isi `.env.example` sebagai Environment Variables (`TRUST_PROXY=1`).
- Platform ini biasanya memberi HTTPS otomatis. Untuk Autonomous dengan wallet, pakai Docker (Opsi 2)
  atau gunakan mode TLS tanpa wallet di Autonomous (mTLS = *Not required*) lalu isi `ORACLE_CONNECT_STRING`
  dengan connect string TLS dari konsol Oracle.

## Cek setelah online
- `https://domain-anda.com/api/health` → `{"ok":true}` berarti server dan Oracle tersambung.
- `/admin` tanpa login harus langsung pindah ke `/admin/login`.
- Kirim RSVP dari HP lain, lalu pastikan muncul di dashboard admin.

## Cadangan data
Data ada di tabel `WD_*` Oracle. Buat backup rutin lewat fitur backup Oracle (atau `expdp`) sebelum hari-H.

## Musik
Lagu bawaan: "A Thousand Years" (`public/music/thousand-years.mp3`). Musik mulai saat tamu menekan
Open Invitation (browser tidak mengizinkan autoplay sebelum ada klik).
Lagu lain ada di `music-library/` (tidak ikut ter-hosting). Ganti lagu: Admin > Invitation CMS > Music > upload
MP3/WAV (maks. 15 MB); file disimpan di Oracle sehingga semua tamu mendengar lagu yang sama.
