<div align="center">

  <img src="public/logo-full.png" alt="SelfLearn Banner" width="100%" style="border-radius: 16px; margin-bottom: 20px;" />

  # 🎓 SelfLearn

  ### **Learn from YouTube. Without the noise.**

  **Convert any YouTube playlist into an isolated, distraction-free classroom with dual-level progress tracking and an on-demand AI tutor.**

  <br />

  ### 🌐 **Live Application**
  👉 **[Self Learn — Distraction-Free YouTube Classroom & AI Course Hub](https://self-learn-cyan.vercel.app/)** 👈

  <br />

  <!-- Badges -->
  <a href="https://self-learn-cyan.vercel.app/">
    <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Deployment" />
  </a>
  <a href="https://github.com/codeXparadise/selfLearn/stargazers">
    <img src="https://img.shields.io/github/stars/codeXparadise/selfLearn?style=for-the-badge&color=EA4335" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/codeXparadise/selfLearn/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT%20%2B%20REA%20Restriction-34A853?style=for-the-badge" alt="License" />
  </a>
  <a href="https://github.com/codeXparadise/selfLearn">
    <img src="https://img.shields.io/badge/Crafted%20With-Vibe--Coding%20⚡-FF5722?style=for-the-badge" alt="Vibe Coding" />
  </a>

  <br /><br />

  <p align="center">
    <a href="#-what-is-selflearn">What is SelfLearn?</a> •
    <a href="#-how-it-works-workflow">How It Works</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-features-at-a-glance">Features</a> •
    <a href="#-architecture-tree">Architecture</a> •
    <a href="#-vibe-coding">Vibe-Coding</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-legal--reverse-engineering-ban">Legal & REA Ban</a>
  </p>

</div>

---

> [!NOTE]
> **Built with Vibe-Coding ⚡**  
> SelfLearn was engineered through deep-flow **Vibe-Coding**—combining architectural clarity, intuitive UI/UX design, and AI-accelerated development to deliver a fast, reliable, production-grade learning platform.

---

## 💡 What is SelfLearn? (In Plain English)

Have you ever opened YouTube to learn coding or study a new subject, only to get sidetracked by recommended videos, clickbait thumbnails, or comments?

**SelfLearn solves this completely.**

1. You paste **any YouTube playlist link** (or ask our AI curator to find the best course for you).
2. SelfLearn strips away **all distractions**—no recommendations, no ads, no comment sections, and no algorithmic rabbit holes.
3. You get a **clean, structured classroom** with a syllabus sidebar, real-time progress bars, and an AI tutor that can answer questions about what's being taught or summarize the whole lesson for you.
4. When you leave and come back, it resumes playing at the **exact second** you left off.

---

## 🔄 How It Works (Workflow Diagram)

Here is a visual overview of how SelfLearn takes you from discovering a course to mastering it:

```mermaid
flowchart TD
    subgraph Step1["1. Course Ingestion"]
        A["Learner"] -->|"Pastes YouTube Playlist Link"| B["Playlist Ingestion Engine"]
        A -->|"Asks: 'Find Python / Data Science course'"| C["AI Course Curator Widget"]
        C -->|"Auto-discovers Top Playlists"| B
    end

    subgraph Step2["2. Distraction-Free Classroom"]
        B --> D["Hardware-Isolated Video Player (Zero Ads / Zero Noise)"]
        B --> E["Interactive Syllabus (Lesson-by-Lesson Progress)"]
        D --> F["Floating AI Tutor (Ollama / Open LLMs)"]
    end

    subgraph Step3["3. Intelligent Progress & Sync"]
        D -->|"Auto-saves timestamp every 5 seconds"| G["Cloud Firestore Database"]
        E -->|"Calculates overall course % complete"| G
        G --> H["Instant Resume Across All Devices"]
    end
```

---

## 🛠 Tech Stack

A breakdown of every technology powering SelfLearn and its role in the system:

| Technology / Service | What It Does (Role) | Official Logo |
| :--- | :--- | :---: |
| **Next.js 14** | Core full-stack web framework (App Router & Server Actions) | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" alt="Next.js" width="32" /> |
| **React 18** | Interactive user interface components and state hooks | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React" width="32" /> |
| **TypeScript** | Strict end-to-end type safety preventing runtime bugs | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="TypeScript" width="32" /> |
| **Firebase** | User Authentication (Google Sign-In + Email/Password) & Cloud Firestore Database | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/firebase/firebase-plain.svg" alt="Firebase" width="32" /> |
| **Vercel** | Global edge hosting, serverless execution, and deployment | <img src="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png" alt="Vercel" width="32" /> |
| **Ollama** | LLM runtime powering the AI Tutor (`gemma4:31b`, `beam`, `nemotron`) | <img src="public/ollama.png" alt="Ollama" width="32" /> |
| **Tailwind CSS** | Minimalist styling, dark/light themes, and Google Labs design system | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" width="32" /> |
| **Framer Motion** | Glassmorphism blur effects, modal animations, and tactile transitions | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/framermotion/framermotion-original.svg" alt="Framer Motion" width="32" /> |
| **Node.js** | Backend server runtime and YouTube metadata parser | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="Node.js" width="32" /> |
| **Lucide Icons** | Ultra-clean iconography across video player and navigation | <img src="https://lucide.dev/logo.light.svg" alt="Lucide" width="32" /> |

---

## 🎯 Features at a Glance

- 🚫 **100% Distraction-Free Player**  
  No recommended video feeds, no sidebars, no autoplaying rabbit holes, and no comment sections.
- ⏱️ **Second-Level Playback Resumption**  
  Never lose your spot. Pause at 08:59, close your browser, and it resumes at 08:59 when you return.
- 📊 **Dual Progress Tracking**  
  Track individual lesson progress (0% to 100%) and whole-course completion percentages.
- 🤖 **Context-Aware AI Tutor**  
  - Ask questions about the specific second you are watching (`⏱️ Synced at mm:ss`).
  - Or switch to `🌐 Full Video / General` mode to get a complete, structured summary of the entire lesson in seconds.
  - Cites clickable timestamp jump pills (e.g. `⏱️ 02:30`) that seek the video immediately.
- 🔍 **AI Course Curator on Dashboard**  
  Don't know what course to take? Type any topic (e.g., *Python, Machine Learning, React*) and the AI will find, rank, and import complete YouTube playlists for you.
- ⚡ **Zero YouTube API Quota Needed**  
  Scrapes video durations, titles, and thumbnails directly without burning through Google Cloud API quotas.
- ⌨️ **Pro Keyboard Shortcuts**  
  - `Space` / `K`: Play / Pause
  - `←` / `J` & `→` / `L`: Skip 10 seconds backward / forward
  - `↑` / `↓`: Volume adjustment
  - `M`: Mute / Unmute
  - `N` / `P`: Next / Previous lesson in syllabus
  - `F`: Fullscreen toggle
  - `R`: Instant player screen reload
  - `0 - 9`: Jump to 0% - 90% of video
  - `?`: Open keyboard shortcuts cheat sheet
- 🌓 **Smooth Dark & Light Mode**  
  Automatic or manual switching between minimalist dark and clean white themes.

---

## 🌲 Architecture Tree

The visual architecture of SelfLearn connecting user actions to cloud services:

```mermaid
graph TD
    User["Learner / User"] --> WebApp["SelfLearn Web Application"]
    
    subgraph UI["Frontend Layer (Next.js & React)"]
        WebApp --> LP["Minimalist Landing Page (/)"]
        WebApp --> DB["Course Hub Dashboard (/dashboard)"]
        WebApp --> CR["Classroom Workspace (/classroom/[id])"]
        WebApp --> PR["User Profile & Settings (/profile)"]
        
        CR --> VP["Isolated Video Player (Custom Controls)"]
        CR --> SY["Curriculum Syllabus (Search & Progress)"]
        CR --> AI["Ollama AI Tutor Panel (Markdown & Timestamps)"]
        DB --> CC["AI Course Curator Widget (Discovery)"]
    end

    subgraph API["Backend API Layer"]
        VP --> API1["/api/courses/[id]/progress"]
        CC --> API2["/api/ai/curate-playlists"]
        AI --> API3["/api/ai/chat"]
        WebApp --> API4["/api/auth (Login / Register / Google Sync)"]
    end

    subgraph CloudServices["Cloud & Infrastructure"]
        API1 --> FB["Firebase Firestore (User Data & Progress)"]
        API4 --> FA["Firebase Authentication"]
        API3 --> OL["Ollama Runtime (Open LLMs)"]
        WebApp --> VC["Vercel Global Edge Network"]
    end
```

---

## ⚡ Vibe-Coding

```
 __      ___ _            _____          _ _             
 \ \    / (_) |          / ____|        | (_)            
  \ \  / / _| |__   ___ | |     ___   __| |_ _ __   __ _ 
   \ \/ / | | '_ \ / _ \| |    / _ \ / _` | | '_ \ / _` |
    \  /  | | |_) |  __/| |___| (_) | (_| | | | | | (_| |
     \/   |_|_.__/ \___| \_____\___/ \__,_|_|_| |_|\__, |
                                                    __/ |
                                                   |___/ 
```

SelfLearn is a proud demonstration of modern **Vibe-Coding**:
- Built rapidly through deep flow and agentic collaboration.
- Continuous real-time feedback loops between vision, design, and execution.
- Delivering a refined, human-centric learning tool free of corporate clutter.

---

## 🚀 Quick Start (For Developers)

### 1. Clone the Repository
```bash
git clone https://github.com/codeXparadise/selfLearn.git
cd selfLearn
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Firebase Web App Credentials
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Auth Secret for Stateless Sessions
JWT_SECRET=your_secure_random_secret_string
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚖️ Legal & Reverse Engineering Ban

> [!CAUTION]
> **REA (Reverse Engineer Anything) Tool & Automated Decompilation Prohibition**  
> Under the terms of the project's [LICENSE](file:///c:/Users/smart/OneDrive/Desktop/selfLearn/LICENSE) and [COPYRIGHT.md](file:///c:/Users/smart/OneDrive/Desktop/selfLearn/COPYRIGHT.md), any use of automated reverse engineering agents, decompilation harnesses, or **REA ("Reverse Engineer Anything")** inspection pipelines to systematically extract, clone, decompile, or harvest this codebase or its application mechanics without express written permission from the author is **strictly forbidden**.

- **License**: [MIT License](file:///c:/Users/smart/OneDrive/Desktop/selfLearn/LICENSE) with Protective Addendum.
- **Code of Conduct**: [Contributor Covenant v2.1](file:///c:/Users/smart/OneDrive/Desktop/selfLearn/CODE_OF_CONDUCT.md).
- **Trademark Notice**: YouTube™ is a trademark of Google LLC. SelfLearn is an independent project and is not affiliated with or endorsed by YouTube or Google LLC.

---

<div align="center">
  <p><b>Crafted with ❤️ by <a href="https://github.com/codeXparadise">Vishal Prajapati (@codeXparadise)</a> via Vibe-Coding ⚡</b></p>
  <p>Star ⭐ this repo if you find it helpful!</p>
</div>
