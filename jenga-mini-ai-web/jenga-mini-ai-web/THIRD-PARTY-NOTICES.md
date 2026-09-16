# Third-party notices

- llama.cpp — ggml-org and contributors, MIT. https://github.com/ggml-org/llama.cpp
  The installer downloads official b11009 CPU binaries and leaves their archive contents intact. Its upstream MIT licence is also included in licenses/LLAMA-LICENSE.txt. Dependencies and notices contained in the official archives remain with them. The underlying C/C++ engine is third-party work, not original Jenga Code work.
- Qwen3-0.6B — Qwen Team / Alibaba Cloud, Apache License 2.0. https://huggingface.co/Qwen/Qwen3-0.6B
  Model licence in licenses/QWEN-LICENSE.txt. Downloaded weights are bartowski's Q4_K_M GGUF conversion at https://huggingface.co/bartowski/Qwen_Qwen3-0.6B-GGUF. Quantization is a third-party transformation; the installer manifest identifies its exact revision and checksum. The model was not trained by Jenga Code.
- The Node API, installers and vanilla browser application in this project are newly generated project code. The site's visual identity and navigation derive from the user's supplied HTML/CSS. These components use no npm runtime dependencies.

The distributed ZIP contains no third-party model weights or native binaries; installation retrieves them. Retain upstream notices if redistributing installed runtime or model files.
