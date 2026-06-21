# yosulson

Single-page delivery-fee calculator (요술손 배송비 계산기) for a Korean catering business.

## Cursor Cloud specific instructions

- This repo is a single self-contained static file: `index.html` (inline CSS + vanilla JS). There is no backend, database, build step, package manager, or dependencies.
- There is nothing to install. To run/develop, serve the directory with any static HTTP server and open `index.html`:
  - `python3 -m http.server 8000` → http://localhost:8000/index.html
  - or `npx serve` / `npx http-server -p 8080`
- Serve over `http://` (not `file://`) when testing the "텍스트 복사" (copy to clipboard) feature, since some browsers restrict `navigator.clipboard` on `file://`.
- There is no lint/test/build tooling configured in this repo.
