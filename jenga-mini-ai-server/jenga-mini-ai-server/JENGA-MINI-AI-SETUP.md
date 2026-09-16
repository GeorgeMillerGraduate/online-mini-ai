# Jenga Mini AI — setup guide

This is a real, self-hosted text chatbot. Your browser talks to a small Node.js API, which talks to a CPU-only llama.cpp process. Responses come from downloaded Qwen model weights. There are no OpenAI, Anthropic, Gemini or paid inference calls. An OpenAI-compatible *protocol* does not mean OpenAI is being contacted.

## What you downloaded

- **jenga-mini-ai-web.zip**: the static website. Upload only these web files to iFastNet.
- **jenga-mini-ai-server.zip**: API, installers, launchers, deployment examples, tests and licences. Put this on your own computer or CPU server.
- **JENGA-MINI-AI-SETUP.md**: this guide, also included in both ZIPs.

Extract each ZIP. Each contains one folder with the corresponding name. Keep the web and server folders separate. There is no frontend build step and no npm dependency installation is needed for the dependency-free API.

**Start locally first.** The website initially connects to `http://127.0.0.1:3001`. That means the computer running the browser. Before uploading the website publicly, change its config to your real HTTPS API domain.

## Selected model and requirements

| Item | Selection |
|---|---|
| Language model | Qwen3-0.6B, post-trained conversational model; not Qwen3-0.6B-Base |
| Parameters | Approximately 0.6 billion |
| Quantization | Q4_K_M, mixed 4-bit quantization |
| GGUF file | `Qwen_Qwen3-0.6B-Q4_K_M.gguf` |
| Exact size | 484,220,320 bytes (484.22 MB / 461.79 MiB) |
| Quantization source | bartowski/Qwen_Qwen3-0.6B-GGUF on Hugging Face |
| Source revision | `60b85c0e3d8fe0f6474f406922a26d12aca4550d` |
| SHA-256 | `9acfc1e001311f34b4252001b626f2e466d592a42065f66571bff3790d4e1b14` |
| Model licence | Apache-2.0; bundled licence copy |
| Inference | llama.cpp build b11009, version 0.4.1-dev, commit fb27a525d |
| Inference licence | MIT; bundled licence copy; binary archive preserves upstream notices |
| Backend | Node.js 22+ (22 or 24 LTS recommended), built-in modules only |
| GPU | Not required; launcher explicitly sets GPU layers to zero |
| Context | 4,096 tokens total, with up to 512 output tokens per answer |
| Estimated application RAM | Budget roughly 1–2 GB, depending on context, runtime and operating system; not a guaranteed peak measurement |
| Minimum practical server | 2 GB available RAM, modern 64-bit CPU, 2 CPU cores for an experiment |
| Recommended server | 4 GB RAM, 4 CPU cores; avoid heavily throttled shared CPU plans |
| Windows computer | 8 GB total system RAM recommended so Windows has room too |
| Disk | About 1 GB for model/runtime; allow 2 GB free for downloads/extraction, more for source builds |
| CPU speed expectation | Rough planning range 5–40 output tokens/sec on modest modern CPUs; older/throttled CPUs can be slower. Not a service guarantee. |

One short actual test on the provided AMD EPYC environment, using four threads, reported approximately 63 generated tokens/sec. That was only a ten-token answer, not a sustained benchmark or a prediction for your PC. Larger prompts also take time to process.

The API allows **one generation at a time**. Another visitor receives a useful “model is answering another chat” error and can retry. There is no hidden queue. More users require capacity planning; simply allowing unlimited parallel requests will make a small server struggle.

### Why this model?

Qwen3-0.6B is small, conversational, CPU-compatible and has mature GGUF support. The official Qwen GGUF repository lists Q8_0; this package uses bartowski's Q4_K_M conversion to reduce the download and RAM footprint. Qwen3.5-0.8B was also inspected: it is newer and includes multimodal capabilities, but the smaller text-only model is the conservative starting point for this brief. This is a simplicity/size choice, not a claim that Qwen3-0.6B is the newest or best model overall. Thinking mode is disabled for shorter responses.

Sources checked when building:

- [Official Qwen3-0.6B model](https://huggingface.co/Qwen/Qwen3-0.6B)
- [Official Qwen GGUF card](https://huggingface.co/Qwen/Qwen3-0.6B-GGUF)
- [Selected quantized file and checksum](https://huggingface.co/bartowski/Qwen_Qwen3-0.6B-GGUF/blob/60b85c0e3d8fe0f6474f406922a26d12aca4550d/Qwen_Qwen3-0.6B-Q4_K_M.gguf)
- [Newer small model considered](https://huggingface.co/Qwen/Qwen3.5-0.8B)
- [llama.cpp repository](https://github.com/ggml-org/llama.cpp)
- [Pinned build](https://github.com/ggml-org/llama.cpp/releases/tag/b11009)
- [Pinned server documentation](https://github.com/ggml-org/llama.cpp/blob/b11009/tools/server/README.md)

## Windows installation

These automated instructions target **Windows 10/11 x64**, not Windows ARM or 32-bit Windows.

1. Install Node.js 22 or 24 LTS from [nodejs.org](https://nodejs.org/). Choose the Windows x64 installer. Close and reopen Command Prompt afterwards.
2. Extract both ZIPs in Downloads. You should now have `jenga-mini-ai-server` and `jenga-mini-ai-web` folders, each directly containing its README and project files.
3. Open **Command Prompt** and paste:

```bat
cd /d "%USERPROFILE%\Downloads\jenga-mini-ai-server"
node --version
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-windows.ps1
```

`ExecutionPolicy Bypass` applies to this one PowerShell process; it does not permanently change your policy. Adjust the folder path if you extracted elsewhere.

The installer retrieves the pinned official Windows CPU archive (~18 MB) and the exact 484 MB model. It verifies SHA-256 checksums, extracts the runtime, checks `llama-server --version`, and copies `.env.example` to `.env` only if `.env` does not exist. It needs an internet connection during installation. It never replaces your existing `.env`.

If a DLL is missing, install Microsoft's [Visual C++ Redistributable x64](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist) and rerun the installer. An antivirus block or an unsupported CPU may also prevent the official binary starting.

## Windows startup

In the server folder, **double-click `start-windows.bat`**. Or paste into Command Prompt:

```bat
cd /d "%USERPROFILE%\Downloads\jenga-mini-ai-server"
start-windows.bat
```

Wait for `Jenga Mini AI ready`. Keep that window open. Ctrl+C stops the API and the model. First startup may take several seconds.

Check [http://127.0.0.1:3001/api/health](http://127.0.0.1:3001/api/health). It should report `"status":"ready"`.

### Open the website locally

Open a **second** Command Prompt:

```bat
cd /d "%USERPROFILE%\Downloads\jenga-mini-ai-web"
node serve-local.mjs
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Send a message. Leave both windows open. Do not open `index.html` by double-clicking: `file://` has a different origin and will not pass CORS.

## Linux installation

The automated download targets **Linux x86_64**. A recent Ubuntu/Debian system with Node.js 22+ and `tar` is a sensible starting point. An ARM server requires a source build or a separately verified matching official ARM build.

Install Node.js 22/24 LTS using the distribution instructions on [nodejs.org](https://nodejs.org/en/download), then:

```bash
node --version
unzip jenga-mini-ai-server.zip
unzip jenga-mini-ai-web.zip
cd jenga-mini-ai-server
bash install-linux.sh
```

The installer downloads the pinned Linux CPU archive (~17 MB) and model, verifies both hashes, extracts the archive and preserves its libraries/notices. It does not run as root or install system packages. No `npm install` is required.

## Linux startup

```bash
cd jenga-mini-ai-server
bash start-linux.sh
```

In another terminal:

```bash
cd jenga-mini-ai-web
node serve-local.mjs
```

Open `http://127.0.0.1:8000`. Ctrl+C stops each program.

### Linux binary incompatible with your OS / building from source

Only use this if the supplied official binary cannot run. It needs Git, CMake, a C++ compiler and development libraries. On Ubuntu/Debian, after installing Node separately:

```bash
sudo apt update
sudo apt install -y git cmake build-essential libcurl4-openssl-dev
cd jenga-mini-ai-server
git clone --depth 1 --branch b11009 https://github.com/ggml-org/llama.cpp llama.cpp
cmake -S llama.cpp -B llama.cpp/build -DGGML_CUDA=OFF -DGGML_NATIVE=ON -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF
cmake --build llama.cpp/build --config Release -j 2 --target llama-server
mkdir -p runtime
printf '%s\n' '{"binary":"llama.cpp/build/bin/llama-server"}' > runtime/location.json
```

If the installer stopped before downloading the model, retrieve and verify it explicitly:

```bash
mkdir -p models
curl --fail --location --output models/Qwen_Qwen3-0.6B-Q4_K_M.gguf 'https://huggingface.co/bartowski/Qwen_Qwen3-0.6B-GGUF/resolve/60b85c0e3d8fe0f6474f406922a26d12aca4550d/Qwen_Qwen3-0.6B-Q4_K_M.gguf'
printf '%s\n' '9acfc1e001311f34b4252001b626f2e466d592a42065f66571bff3790d4e1b14  models/Qwen_Qwen3-0.6B-Q4_K_M.gguf' | sha256sum --check
cp -n .env.example .env
bash start-linux.sh
```

This source-build fallback is documented but was not compiled in the build environment; the actual tested runtime was the official Linux binary. Source builds need more temporary disk/RAM. `GGML_NATIVE=ON` builds for the current computer, so do not copy that binary to an older CPU.

## Web deployment to iFastNet

1. In the **web folder**, edit `js/config.js` before upload:

```js
window.JENGA_AI_CONFIG = Object.freeze({
  API_BASE_URL: "https://ai-api.jenga-code.com"
});
```

This is an example hostname. You must create it and point it to your CPU server; this package does not register domains or make a server exist.

2. In your hosting file manager, create `public_html/ai/` (or the corresponding document root for your domain).
3. Upload `index.html`, `css/`, `js/` and `images/` **inside** `ai/`.
4. Open `https://jenga-code.com/ai/`.
5. You do not need to upload `serve-local.mjs`, README, the guide or licences to make the static page work. Keeping licence documentation with a redistributed source ZIP is appropriate.

The header uses the supplied reference's Jenga Code typography, navy/blue colours and navigation. Because no logo bitmap was attached, it uses the reference's text logo treatment. Navigation uses absolute Jenga Code links, so moving the app to another folder will not break header paths. These are links copied from your reference; existence of every external Jenga Code destination was not independently verified.

**Never upload the server ZIP, model, `.env`, runtime or server source into `public_html`.**

## Server deployment and iFastNet suitability

Static/shared hosting is suitable for the web folder. The backend needs:

- Two persistent processes: Node and llama.cpp.
- Permission to execute downloaded native binaries.
- Sustained CPU allocation and sufficient RAM/disk.
- Private loopback TCP ports 3001 and 8081.
- An HTTPS reverse proxy reachable on public TCP ports 80/443.
- Permission to manage services or another reliable process supervisor.

A plan that supplies only ordinary PHP/static shared hosting **cannot run this backend**. Node support alone also does not establish that persistent native inference is permitted. I could not verify the permissions or resource allowance of your exact iFastNet account. Ask the host to confirm all the requirements above before trying it there. A VPS or your own always-on computer can run it while the webpage remains on iFastNet. The package is not deployed to a live server for you.

### Example Linux VPS deployment

Assumes a sudo-capable Ubuntu/Debian account, Node at `/usr/bin/node`, extracted server folder in the current directory and [Caddy](https://caddyserver.com/docs/install) already installed using its official OS instructions. Replace the example domain with one you control. Do not overwrite an existing multi-site Caddyfile without merging the site block.

```bash
sudo useradd --system --home /opt/jenga-mini-ai-server --shell /usr/sbin/nologin jenga
sudo cp -a jenga-mini-ai-server /opt/jenga-mini-ai-server
sudo chown -R jenga:jenga /opt/jenga-mini-ai-server
sudo -u jenga bash /opt/jenga-mini-ai-server/install-linux.sh
sudo nano /opt/jenga-mini-ai-server/.env
```

Set these production values:

```dotenv
API_HOST=127.0.0.1
ALLOWED_ORIGIN=https://jenga-code.com,https://www.jenga-code.com
DEV_ORIGINS=
TRUST_LOCAL_PROXY=true
```

Keep the other defaults. `TRUST_LOCAL_PROXY=true` is safe only with the provided local proxy overwriting `X-Real-IP`. Then:

```bash
sudo cp /opt/jenga-mini-ai-server/config/jenga-mini-ai.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now jenga-mini-ai
sudo systemctl status jenga-mini-ai --no-pager
sudo journalctl -u jenga-mini-ai -n 30 --no-pager
```

Set the DNS A record for `ai-api.jenga-code.com` to your VPS IPv4 address. Add an AAAA record only if IPv6 is also correctly routed. The web domain can continue pointing to iFastNet.

Open `/etc/caddy/Caddyfile` and copy in the site block from `config/Caddyfile`. With DNS resolving and ports 80/443 accessible:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl --fail https://ai-api.jenga-code.com/api/health
```

Caddy provides HTTPS and forwards only `/api/chat` and `/api/health`. Do not forward `/v1`, `/completion`, `/tokenize` or the whole llama.cpp server. Restrict ports 3001 and 8081 to loopback; do not open them in your cloud firewall. If enabling a firewall, preserve SSH access before applying changes.

The systemd example starts the supervisor, which starts both services and stops them together. If Node is installed elsewhere, change `ExecStart` to the actual absolute Node path. The Windows and Linux scripts are for foreground operation; running on your laptop stops working for visitors whenever it sleeps or shuts down. Home hosting additionally requires reachable networking, DNS and HTTPS; it is not solved by uploading a ZIP.

## Connecting the two / changing the server URL

Only change `API_BASE_URL` in `jenga-mini-ai-web/js/config.js`. Do not add `/api` at the end; the code adds `/api/chat` and `/api/health` itself. Use HTTPS whenever the webpage is HTTPS.

On the server, `ALLOWED_ORIGIN` means the **website's origin**, not the API hostname, and must contain scheme + host, with no path or trailing slash. Multiple origins are comma-separated. Restart the backend after changing `.env`:

```bash
sudo systemctl restart jenga-mini-ai
```

For a foreground local run, press Ctrl+C then start again. Reupload the changed `config.js`, then hard-refresh the webpage (Ctrl+F5) if an old address remains cached.

## Using the chat page

- Enter sends; Shift+Enter inserts a newline. The Send button also works on phones.
- Stop aborts the browser request and cancels the upstream generation.
- Retry regenerates the latest response, replacing the interrupted or previous answer.
- New Chat creates a separate conversation; earlier conversations remain on this device.
- Clear Chat removes the current conversation's messages after confirmation.
- Delete Saved Chats removes all chat history in this browser after confirmation.
- Chats are stored in localStorage, at most 20 conversations. Storage limits/private mode may prevent saving; a message explains this.
- The menu and chat history collapse on phones. Code blocks scroll horizontally without widening the page.
- Basic Markdown supports headings, lists, emphasis, inline code, quotes, fenced code and HTTP(S) links. Common code languages receive simple syntax colouring. This is deliberately a small Markdown subset, not full CommonMark: no tables, nested-list parsing, embedded HTML, images or plugins.
- Code is displayed only. It is never executed. Copy Code needs browser clipboard permission and a secure context (HTTPS or localhost).
- Older completed turns are omitted as necessary. The API counts actual model tokens, discards oldest pairs when necessary, and rejects a single oversized prompt rather than silently truncating it. Interrupted answers do not become model context.

## API endpoints

`GET /api/health`: ready/offline, busy indicator and selected model label. Model health is briefly cached to avoid excess internal polling.

`POST /api/chat`, JSON:

```json
{"message":"Explain binary search in two sentences.","stream":false}
```

Response:

```json
{"reply":"...actual model response...","trimmedMessages":0,"finishReason":"stop"}
```

Or use conversation history:

```json
{
  "messages": [
    {"role":"user","content":"What is Java?"},
    {"role":"assistant","content":"A programming language."},
    {"role":"user","content":"Give me a small example."}
  ],
  "stream": true
}
```

Streaming (the default) uses server-sent event lines over a POST fetch. Each `data:` line is JSON with type `meta`, `delta`, `done` or `error`. The frontend handles packets split across network reads. `done.finishReason === "length"` means the output limit was reached. A partial stream without `done` is an error, not a successful answer.

Command-line smoke test:

```bash
curl http://127.0.0.1:3001/api/chat -H 'Content-Type: application/json' --data '{"message":"Hello","stream":false}'
```

In Windows PowerShell:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:3001/api/chat -Method Post -ContentType 'application/json' -Body '{"message":"Hello","stream":false}'
```

## Security

- Explicit allowed origins; no wildcard CORS and no `file://` origin.
- 32 KiB body limit, maximum 25 alternating messages, 8,000 characters/message and 16,000 characters/request.
- 10 chat requests/minute/IP by default, bounded rate-limit memory and 100 API connections per process.
- One active model request; 120-second generation timeout; output capped at 512 tokens.
- Server-side system prompt; clients cannot supply paths, commands, model settings or tool calls.
- llama.cpp runs on `127.0.0.1` with its UI disabled, restrictive internal CORS and a freshly generated backend-only API key. The key is passed to the child through its environment and is never placed in browser files or logged. Starting through `npm start` shares it in memory with the API. It changes on restart.
- No database or server-side transcript persistence in the Jenga API. Browser history is local; messages still travel to the configured server. The model may retain recent prompt data in process memory until reuse/shutdown. Do not enable llama prompt logging for private conversations. Host/proxy logs depend on your configuration.
- Safe DOM rendering: model text cannot inject executable HTML. Links are HTTP(S) only, with opener protection. No automatic remote images.
- Errors contain useful visitor-facing messages, not stack traces. Server logs contain technical errors without request bodies.

**CORS is not authentication.** A non-browser client can call a public API directly, and distributed callers can evade a basic per-IP limit. This version is a modest public experiment, not an abuse-proof multi-user platform. For private access, add authentication at a reverse proxy or extend the API with server-managed sessions. For substantial public traffic, add stronger edge rate limiting, identity controls and monitoring. Do not embed a reusable secret in frontend JavaScript. The rate limiter is in memory and resets on restart; run one API instance unless replacing it with shared limiting.

## Changing the model

1. Stop the server.
2. Download another **chat/instruction GGUF model** compatible with the pinned llama.cpp build. Verify its source, checksum and licence.
3. Place it in `models/`.
4. Set `MODEL_PATH=models/your-model.gguf` in `.env`.
5. Keep the model's required context/sampling/template settings in mind. This version uses `enable_thinking:false` for Qwen; adjust server code for models that require different settings.
6. Update the model label in `server/api.mjs` and `index.html`; model labels are descriptive and not automatically inferred.
7. Restart and test. A larger model will need more RAM and CPU time.

Changing `MODEL_PATH` does not change the automatic installer manifest. Keep the original model if you want the supplied installer to remain repeatable, or deliberately update `config/downloads.json` with a reviewed URL, revision and hash. No browser request can change model paths.

## Updating llama.cpp

The package pins a build rather than downloading a moving “latest” every time. Before changing it, copy your server directory/config or keep a versioned backup. Then:

1. Choose a release from the official repository.
2. Review the server API and required command-line flags, including key handling, CORS, `--jinja` and `--no-webui`.
3. Update `config/downloads.json`: build tag, official Linux/Windows CPU asset URLs and their SHA-256 digests from GitHub release metadata.
4. Stop the old server and rerun the installer. It uses a separate versioned runtime directory and records its path in `runtime/location.json`.
5. Run `npm test`, start the new server, and test an actual streamed/nonstreamed reply and Stop.
6. Roll back by restoring the old manifest and `runtime/location.json` if needed. Keep the model unchanged unless intentionally upgrading it too.

Do not paste unverified checksums or blindly substitute a CUDA archive. The source build fallback can be repointed to a reviewed tag too.

## Troubleshooting

| Symptom | Action |
|---|---|
| `node` is not recognised | Install Node 22/24 LTS and reopen the terminal. |
| Download failed | Check internet access to GitHub, its release asset CDN, Hugging Face and its model CDN; retry the installer. Partial downloads are removed; verified completed files are reused. Proxy setup is environment-specific. |
| Hash mismatch | Do not bypass verification. Retry; confirm the pinned source/manifest if it repeats. |
| Unsupported platform | Automatic binaries are x64 Windows/Linux only; use a verified matching build or source fallback. |
| DLL / GLIBC / shared library error | Preserve the entire extracted runtime directory. On Windows install VC++ x64 runtime; on older Linux build from source. |
| `Illegal instruction` | CPU may lack required instructions; build for your actual CPU. |
| `EADDRINUSE` | Another service already uses port 3001 or 8081. Stop it or change the corresponding `.env` port. |
| Offline in the webpage | Start the backend, open `/api/health`, verify `API_BASE_URL`. Click the connection indicator to recheck. |
| HTTPS page cannot reach HTTP server | Put HTTPS in front of the API and update config. |
| CORS / origin error | Add the exact webpage origin to `.env`; restart. No `/ai/` in an origin. |
| Responses arrive all at once | Check reverse-proxy buffering. The supplied Caddy config flushes immediately. |
| Busy / 503 | Wait for the active generation to finish, or check model logs if unavailable. |
| 429 | Wait a minute. If all users share a limit, verify proxy trust and overwritten `X-Real-IP`. |
| Message too long | Send a shorter question. The model has deliberately limited context. |
| Very slow | Reduce THREADS on an oversubscribed host, close other programs, check RAM swapping and CPU quota. A GPU is not required. |
| Silly/wrong answer | This is a 0.6B model. Ask a simple specific question, or experiment with another small model. |
| History missing | History belongs to the current browser/origin. Private mode, storage clearing or another device won't share it. |
| Header link goes elsewhere | Header links intentionally lead to your main Jenga Code site. |

## Optional future image generation and browser inference

There is **no image generator in version 1**. A future `/api/image` endpoint can call a separate image service with its own resource limits, authentication, job queue and storage. Keep heavyweight image inference away from the small chat process. The chat API routing is explicit, so adding that endpoint does not require exposing llama.cpp to the browser.

[WebLLM](https://webllm.mlc.ai/) can run compatible models using WebGPU on a visitor's computer. This needs a supported browser/GPU and a substantial first download; mobile support and memory vary. It uses its own supported model format rather than treating this GGUF as a drop-in browser asset. WASM runtimes are another experiment but can be slow. Neither mode is implemented here; both are optional future work and do not remove this version's backend requirement.

## Tests and limitations

See `TEST-REPORT.md` inside each ZIP for the actual checks performed and omissions. The server ZIP contains repeatable API boundary tests (`npm test`); those use an explicitly labelled local fixture to verify error/security behaviour. Production has no mock responses or fallback chatbot. Real model integration was tested separately.

No Windows execution, public DNS/HTTPS provisioning, iFastNet deployment or real-phone hardware testing was possible in the Linux build environment. Those are not claimed as tested. No accounts, billing, uploads, web search, agents, executable tools, image generation or cross-device history are included.
