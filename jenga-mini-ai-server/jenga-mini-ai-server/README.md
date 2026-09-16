# Jenga Mini AI server

Read **JENGA-MINI-AI-SETUP.md** for complete installation and hosting instructions.

Requires Node.js 22+; Windows x64 or Linux x64 for the automated installer. GPU not required.

Windows Command Prompt:

```bat
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-windows.ps1
start-windows.bat
```

Linux:

```bash
bash install-linux.sh
bash start-linux.sh
```

After installation, `npm start` also starts both the private model and API. Ctrl+C stops both.

The model (~484 MB) and official runtime (~17–18 MB compressed) download during installation and are SHA-256 verified. They are not included in this small source ZIP. Do not put this folder on static/shared web hosting.

Endpoints: `GET /api/health`, `POST /api/chat`. Website files are in the separate web ZIP.

Read TEST-REPORT.md for performed checks and limitations. `npm test` runs API boundary tests using a test-only fixture. The app itself always uses real llama.cpp inference.
