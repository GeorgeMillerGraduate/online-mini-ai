# Jenga Mini AI web

Static HTML, CSS and JavaScript matching the supplied Jenga Code layout.

1. Install and start the separate server package.
2. For local testing, run `node serve-local.mjs` in this folder and open http://127.0.0.1:8000.
3. For website deployment, change `API_BASE_URL` in `js/config.js` to your real HTTPS API domain.
4. Upload `index.html`, `css`, `js` and `images` into your website's `/ai/` folder.

Read **JENGA-MINI-AI-SETUP.md** for complete instructions. Do not upload server/model files into your website document root. The website requires a running backend; it does not run the model itself.

No frontend dependencies or build tools are required. All fonts use the system stack. The page contains no analytics, external scripts or proprietary OpenAI branding.
