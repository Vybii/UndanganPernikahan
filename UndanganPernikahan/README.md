# Undangan Pernikahan Angga & Ayu

Undangan digital (React + Vite) dengan server Node.js dan Oracle Database.

```
undangan/
├─ src/            tampilan (halaman tamu, login & dashboard admin)
├─ public/         file statis: lagu bawaan, PDF undangan, robots.txt
├─ server/         server Express + koneksi Oracle + login admin
├─ docs/           panduan database dan hosting
├─ .env.example    contoh pengaturan (salin menjadi .env)
└─ Dockerfile      opsional, untuk hosting berbasis container
```

## Menjalankan
```
npm install
cp .env.example .env      # isi Oracle
npm run setup-admin       # buat login admin, tempel hasilnya ke .env
npm run build
npm start                 # http://localhost:3000   (admin: /admin/login)
```

## Hosting
Build: `npm install && npm run build` · Start: `npm start` (butuh Node.js 22+ dan HTTPS).

Panduan lengkap: [docs/PANDUAN-DATABASE.md](docs/PANDUAN-DATABASE.md) dan [docs/PANDUAN-HOSTING.md](docs/PANDUAN-HOSTING.md).

Pengembangan: `npm run dev:server` + `npm run dev` (http://localhost:8443).
