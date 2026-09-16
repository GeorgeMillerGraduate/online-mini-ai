# Test report — 16 September 2026

## Actual real-model tests

- Downloaded the official llama.cpp b11009 Linux x64 binary archive and the source archive; inspected its server documentation and API/argument implementation.
- Downloaded the selected 484,220,320-byte Qwen3-0.6B Q4_K_M model from the pinned Hugging Face revision.
- Ran the provided Linux installer using those predownloaded files: SHA-256 verification, extraction, binary version check, runtime location file and `.env` creation passed. Files were fetched directly in the build environment; the installer's network-fetch branch was not exercised there. Windows download metadata/hash was inspected, but its archive was not executed.
- Ran the provided supervisor/startup path with CPU-only inference, four threads, 4,096-token context, one slot. Model loaded successfully.
- Sent a direct authenticated `/v1/chat/completions` prompt; the real model replied: “Hello! How can I assist you today?”
- Sent a nonstreamed prompt through the Node `/api/chat` endpoint and received actual model-generated text.
- Sent a streamed prompt through `/api/chat`; received incremental delta events and a completion event.
- Verified an unauthenticated inference request to the private model server is rejected (HTTP 401) after adding the generated internal key.
- Inspected server logs. No fatal runtime errors during successful flows. The model emits an upstream tokenizer metadata warning about the `</s>` token; llama.cpp reports that it overrides the token type and generation works.
- Observed approximately 61–63 output tokens/second for a short ten-token direct answer on an AMD EPYC 9V74 environment. This is a small smoke-test observation, not a sustained benchmark.

## Browser tests with the actual backend

Automated headless Chromium, plus visual inspection of desktop and phone-size screenshots:

- Page connected to the local Node API.
- Enter sent a message and the real model's streamed answer appeared.
- Follow-up message used conversation history.
- Reload restored saved messages.
- Stop interrupted generation; Retry replaced the previous answer.
- Shift+Enter inserted a newline without sending.
- Markdown headings, code blocks, basic syntax highlighting and Copy Code worked.
- HTML injection text remained inert; a `javascript:` link was not made clickable.
- No horizontal page overflow at 1440×1000, 768×1024, 390×844 and 320×740.
- Mobile menu opened/closed; mobile history initially collapsed.
- A real message/answer worked at 390×844 with mobile/touch emulation.
- Clear Chat removed the messages after confirmation.
- No JavaScript exceptions or browser console errors during successful interactions.
- Stopping the backend caused a visible connection error with Retry available. Expected failed-network browser messages during this intentional outage are not classified as successful-flow errors.

A final cosmetic adjustment replaced an unavailable plus-sign glyph with ASCII `+` and removed a redundant inner textarea focus outline; the enclosing form still provides focus indication.

## API boundary tests: 8 passing tests (`npm test`)

These tests use an explicitly labelled HTTP test fixture to isolate transport/security conditions. They do not count as real-inference evidence; the separate checks above do.

1. Validation of roles, message sizes, histories and streaming option type.
2. CORS rejection/allowance, invalid JSON, wrong content type and inaccessible internal routes.
3. Structured nonstream responses and streamed packets split across network chunks.
4. Old-pair context trimming and rejection of oversized single-message contexts.
5. Model failure and incomplete-stream error reporting.
6. Single active request, timeout, upstream cancellation and subsequent slot reuse.
7. 32 KiB request limit.
8. Per-IP rate limiting and Retry-After header.

JavaScript syntax and Linux shell syntax checks also passed. There is no production bundler/build: the web app is static and the API has zero third-party runtime dependencies.

## Not tested / not supplied

- Windows execution, PowerShell archive extraction, Windows process shutdown or DLL compatibility.
- Linux source compilation fallback, ARM binaries, old CPUs, alternate models or GPU acceleration.
- Public DNS, TLS, Caddy/systemd deployment, real iFastNet account permissions or a live public endpoint.
- Safari/Firefox, physical phones, on-screen keyboard behaviour or exhaustive accessibility audit.
- Peak RAM profiling, sustained benchmarks, high-load testing or distributed abuse resistance.
- Installer download interruption/checksum-failure simulations.
- Full CommonMark support (the renderer intentionally implements a limited safe subset).
- Image generation, accounts, uploads, browser inference, search or cross-device chat syncing.

Model/runtime files are deliberately omitted from the source ZIP. Installation downloads the exact pinned artifacts. Existing shared hosting should serve only the web files; the backend requires persistent native processes on suitable compute infrastructure.
