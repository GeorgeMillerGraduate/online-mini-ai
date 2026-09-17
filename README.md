# Jenga Mini AI

Jenga Mini AI is a lightweight, self-hosted conversational AI web application that demonstrates how a ChatGPT-style interface can be connected to an open-source Large Language Model (LLM).

Instead of relying on a commercial AI API for every request, the project runs a **Qwen language model locally on the server** and exposes it through a browser-based chat interface.

The project explores the complete architecture of a self-hosted AI application: **frontend → backend → LLM inference → generated response**.

---

## Features

* ChatGPT-style conversational interface
* Self-hosted **Qwen** language model
* Server-side AI inference
* No commercial AI API required for normal inference
* Conversation history within the interface
* Responsive desktop and mobile frontend
* JavaScript client/server communication
* Node.js backend
* API-based architecture
* Replaceable underlying language model
* Suitable for experimenting with locally hosted AI

---

## How It Works

Jenga Mini AI consists of three main components:

```text
┌───────────────────────────────┐
│          Web Browser          │
│                               │
│   HTML + CSS + JavaScript     │
│   Chat Interface              │
└──────────────┬────────────────┘
               │
               │ HTTP Request
               ▼
┌───────────────────────────────┐
│        Node.js Backend        │
│                               │
│   Receives User Prompts       │
│   Handles Model Requests      │
│   Returns Generated Text      │
└──────────────┬────────────────┘
               │
               │ Inference
               ▼
┌───────────────────────────────┐
│       Open-Source LLM         │
│                               │
│            Qwen               │
│                               │
│    Local Model Inference      │
└───────────────────────────────┘
```

When a user enters a message, the browser sends the prompt to the backend.

The backend passes the request to the locally running Qwen model.

The model generates a response, which is returned through the backend and displayed in the browser.

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Fetch API
* Responsive web design

### Backend

* Node.js
* JavaScript / CommonJS (`.cjs`)
* HTTP API
* JSON requests and responses
* Environment-variable configuration

### Artificial Intelligence

* Qwen open-source Large Language Model
* Local/server-side inference
* No commercial LLM API required for standard operation

---

## Request Flow

```text
User
 │
 ▼
Web Interface
 │
 │ HTTP Request
 ▼
Node.js Backend
 │
 ▼
Qwen LLM
 │
 │ Generated Response
 ▼
Node.js Backend
 │
 │ JSON Response
 ▼
Web Interface
 │
 ▼
User
```

The browser itself does not perform the computationally expensive language-model inference.

Instead, the frontend acts as the user interface while the backend communicates with the locally hosted model.

---

## Why Self-Host an AI Model?

Most AI web applications use an external commercial API:

```text
Browser
   ↓
Application Server
   ↓
Commercial AI API
```

Jenga Mini AI instead uses:

```text
Browser
   ↓
Application Server
   ↓
Self-Hosted Qwen Model
```

This provides greater control over the AI infrastructure and removes the requirement to pay a commercial provider for every model request.

The computational cost still exists, but it is handled by the hardware running the model rather than through per-request API charges.

---

## Running the Project

The application requires both the web frontend and AI backend to be running.

A typical deployment involves:

1. Installing the required server dependencies.
2. Installing or downloading the required Qwen model.
3. Configuring the server environment.
4. Starting the model inference service.
5. Starting the Node.js backend.
6. Serving the frontend through a web server.
7. Configuring the frontend to communicate with the backend.

The exact commands depend on the operating system, hosting environment and model runtime.

---

## Configuration

Sensitive configuration should be stored using environment variables.

For example:

```env
JENGA_TEST_PASSWORD=your-secure-password
```

Passwords and other secrets should **never** be committed to the repository.

Add sensitive files to `.gitignore`:

```gitignore
.env
.env.*
node_modules/
*.log
```

An example configuration can instead be provided:

```text
.env.example
```

---

## Example Usage

Once the frontend, backend and model are running, open the web interface and enter a prompt:

```text
Explain binary search in simple terms.
```

The application will:

1. Read the user's message.
2. Send it to the Node.js backend.
3. Pass the prompt to Qwen.
4. Generate an AI response.
5. Return the response to the browser.
6. Display it in the conversation.

---

## Example Applications

Jenga Mini AI can be used for experimentation with:

* General conversation
* Programming questions
* Code explanations
* Technical questions
* Brainstorming
* Text generation
* Summarisation
* Educational explanations
* Locally hosted AI
* LLM integration
* AI web development

---

## Project Structure

A typical deployment structure is:

```text
jenga-mini-ai/
│
├── web/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── server/
│   └── server.cjs
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

Separating the frontend and backend allows either component to be modified independently.

---

## Limitations

Jenga Mini AI is an experimental project and is not intended to compete directly with large commercial AI platforms.

Model performance depends on factors including:

* Qwen model variant
* Model size
* Quantisation
* Available RAM
* CPU performance
* GPU performance
* Context-window size
* Inference configuration
* Server workload

Smaller models can run on considerably more modest hardware than frontier-scale models, but generally provide lower reasoning capability and less extensive knowledge.

Like other Large Language Models, Qwen can also produce incorrect or fabricated information.

AI-generated responses should therefore not automatically be treated as factual.

---

## Project Goals

The purpose of Jenga Mini AI is to explore the complete process of integrating an LLM into a real web application.

The project demonstrates experience with:

* Large Language Models
* Local AI inference
* Node.js backend development
* Frontend/backend integration
* REST-style APIs
* Asynchronous JavaScript
* HTTP requests
* JSON
* Environment variables
* Server configuration
* Web deployment
* AI application architecture

---

## Future Development

Possible future improvements include:

* Streaming AI responses
* Markdown response rendering
* Syntax-highlighted code blocks
* Persistent conversation history
* Multiple conversations
* Model selection
* Adjustable generation parameters
* Custom system prompts
* Improved authentication
* Rate limiting
* Conversation export
* File uploads
* Retrieval-Augmented Generation (RAG)
* Image generation
* Multiple locally hosted models
* Improved mobile interface
* Model performance statistics
* Token usage information

---

## Security

An unrestricted AI inference endpoint should not be exposed directly to the public internet.

A production deployment should consider:

* Authentication
* HTTPS
* Rate limiting
* Request-size limits
* Input validation
* CORS configuration
* Secure environment variables
* Resource limits
* Logging
* Abuse prevention

These protections are particularly important for self-hosted models because unrestricted requests can consume significant CPU, GPU and memory resources.

---

## Educational Purpose

Jenga Mini AI demonstrates the technologies surrounding a modern conversational AI system.

The language model itself is pre-trained, while the surrounding application demonstrates how an LLM can be incorporated into a complete software system:

```text
Frontend
   ↓
Backend API
   ↓
LLM Inference
   ↓
Generated Response
   ↓
Frontend
```

This provides a practical demonstration of both **AI integration** and **full-stack web development**.

---

## Author

**George Miller**

BSc (Hons) Natural Sciences — Computer Science & Business
Durham University

### Jenga Code

https://jenga-code.com/

### GitHub

https://github.com/GeorgeMillerGraduate

---

## Disclaimer

Jenga Mini AI generates responses automatically using a Large Language Model.

Generated responses may contain mistakes, outdated information or fabricated information.

The software should not be relied upon as the sole source of information for medical, legal, financial, safety-critical or other high-stakes decisions.

---

## License

See the repository's `LICENSE` file for licensing information.

Third-party models, libraries and dependencies remain subject to their respective licences.
