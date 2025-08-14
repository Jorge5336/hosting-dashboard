
# TOC / Hosting Dashboard — Netlify Edition

**Deploy targets**: Netlify (static front‑end + Netlify Functions + Netlify Blobs storage)

## What you get
- Branded dashboard (Carleton colors; Montserrat + Playfair fallback)
- APIs backed by Netlify Blobs (no external DB needed)
- Site-wide password (enable in Netlify UI) + admin secret header for writes
- Import Asana JSON, upload Hosts CSV, manage Budget/Comms/Docs, export snapshot

## Quick start
1) Push this repo to GitHub.
2) In Netlify, **New site from Git**, select the repo.
3) Build command: `npm run build` ; Publish directory: `public/`.
4) In Site settings → **Environment variables**, add:
   - `ADMIN_SECRET` = (long random string)
5) In Site settings → **Access control** → **Password protection**, set a site password.
6) (Optional) `netlify dev` locally after `npm i`.

### Admin operations
- Open the site → **Admin** (top right).
- Paste your admin secret (sets `X-Admin-Secret` header for write calls).
- Import Asana JSON (paste the export body).
- Upload Hosts CSV (columns: id,name,email,status,class_year,dorm,notes).
- Add budget lines and doc links.
- Export a full JSON snapshot at any time.

## API map
- `GET /.netlify/functions/overview`
- `POST /.netlify/functions/asana_import`  (admin)
- `GET  /.netlify/functions/tasks`
- `POST /.netlify/functions/hosts_upload`  (admin, CSV text body)
- `GET  /.netlify/functions/hosts?status=approved`
- `GET|POST|PUT|DELETE /.netlify/functions/budget` (admin for write)
- `GET|POST|PUT|DELETE /.netlify/functions/comms`  (admin for write)
- `GET|POST|PUT|DELETE /.netlify/functions/docs`   (admin for write)
- `GET /.netlify/functions/export` (admin)

## Notes
- Storage is via **Netlify Blobs**: each collection keeps a single JSON list (`items.json`, `list.json`, `all.json`) + raw Asana archives.
- For heavier data shapes later, we can shard per item key or switch to Postgres/Fauna without changing the UI.
- Keep your admin secret private. If it leaks, rotate it in Netlify env and redeploy.
