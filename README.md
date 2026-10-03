# AstroPulse // NASA Astronaut Health Telemetry Dashboard

> **NASA Space Apps Challenge Pre-Selection**  
> **Category:** Software & App Development — Astronaut Health Monitor  
> **Karma:** 100 Points | **Submission Tag:** `#evn-sp-webdev`

---

## 🚀 Live Demo & Repository
- **Web App / Hosted Link:** [Host on GitHub Pages in 1-Click](#-how-to-host-on-github-pages-free--instant)
- **Local Preview:** Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari). No `npm install` or build step required!

---

## 📋 Challenge Requirements Checklist

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Step 1: Dashboard for 1 astronaut** | **Commander Dr. Elena Rostova** (Astrobiologist, Artemis VII Mission, Gateway Lunar Orbit). Includes profile photo, suit link status, habitat location, and telemetry stats. | ✅ Complete |
| **Step 2: Display at least 4 health parameters** | Displays **5 core parameters + 3 environmental metrics**: <br>1. **Heart Rate (BPM)** with live dynamic ECG oscilloscope.<br>2. **Blood Oxygen (SpO₂ %)** with visual safe/warning/critical gauge.<br>3. **Core Body Temperature (°C / °F)** with switchable units.<br>4. **Sleep Duration (hrs)** with REM, Deep, and Light sleep breakdown.<br>5. **Exercise Regimen Time (mins)** tracking the 120-min daily countermeasure goal.<br>*(Auxiliary: Respiration rate, Suit pressure, CO₂ fraction)*. | ✅ Complete |
| **Step 3: Simple health-status indicator** | 3-tier reactive badge system:<br>🟢 **Normal** (Nominal flight parameters)<br>🟡 **Warning** (Elevated exertion / threshold approach)<br>🔴 **Critical** (Biomedical emergency) | ✅ Complete |
| **Step 4: Alert condition based on health data** | **Primary Condition:** <br>`If Blood Oxygen (SpO₂) < 90% → CRITICAL ALERT: Severe Hypoxia Detected`<br>*Auxiliary safeguards: Heart Rate > 120 or < 45 BPM → Critical Alert; Body Temp > 38.5°C or < 35.5°C → Critical Alert.* | ✅ Complete |
| **Step 5: Mission-day/time indicator** | Real-time ticking **Mission Elapsed Time (MET)** (`DAY 142 : HH:MM:SS`) synced with Earth UTC timestamp and Deep Space Network (DSN) latency. | ✅ Complete |
| **Step 6: Clear, readable, user-friendly UI** | Deep space glassmorphism HUD interface, glowing telemetry neon accents, responsive grid layout, audio telemetry alarms (Web Audio API), and instant scenario switcher. | ✅ Complete |
| **Note: Random health data varying over time** | Continuous stochastic random-walk engine that dynamically varies biometric data realistically every tick (with 1x, 2x, 5x speed controls and pause/resume). | ✅ Complete |

---

## 🧠 Alert Condition & Logic Explanation

The biomedical engine continuously evaluates all vitals on each telemetry cycle. The alert priority follows a strict severity hierarchy (**Critical > Warning > Normal**):

### 1. Blood Oxygen ($SpO_2$) — Primary Alert Rule
- **Safe / Nominal:** $\ge 95\%$ $\rightarrow$ Health Status: **NORMAL** 🟢
- **Warning:** $90.0\% \le SpO_2 < 95.0\%$ $\rightarrow$ Health Status: **WARNING** 🟡  
  *Action:* Suit environmental control alerts ground station of mild hypoxemia.
- **Critical Trigger:** $\mathbf{SpO_2 < 90.0\% \rightarrow}$ **CRITICAL ALERT** 🔴  
  *Action:* Flashing visual alert banner, urgent siren pulse, astronaut card critical glow ring, and immediate entry into the Mission Biomedical Log: `"CRITICAL ALERT: Severe Hypoxia! SpO₂ dropped to X%. Automated O₂ injection initiated!"`

### 2. Heart Rate (BPM)
- **Normal:** $60 - 100 \text{ BPM}$
- **Warning:** $101 - 120 \text{ BPM}$ or $50 - 59 \text{ BPM}$
- **Critical:** $> 120 \text{ BPM}$ (Severe Tachycardia / Arrhythmia) or $< 45 \text{ BPM}$ (Severe Bradycardia)

### 3. Core Body Temperature
- **Normal:** $36.5^\circ\text{C} - 37.5^\circ\text{C}$
- **Warning:** $37.6^\circ\text{C} - 38.4^\circ\text{C}$ or $35.6^\circ\text{C} - 36.4^\circ\text{C}$
- **Critical:** $> 38.5^\circ\text{C}$ (Hyperthermia) or $< 35.5^\circ\text{C}$ (Hypothermia)

---

## 📸 How to Capture the 2 Required Screenshots

The dashboard includes dedicated **Test Scenario Buttons** on the left column to make taking the required submission screenshots effortless:

1. **Screenshot 1 (Nominal / Normal State):**
   - Click the button **"1. Nominal (Normal)"**.
   - The status badge turns green **NORMAL**, vitals stabilize in nominal ranges, and the global banner shows **SYSTEM STATUS NOMINAL**.
   - Capture your screen (e.g. press `Windows Key + Shift + S` or `PrtScn`).

2. **Screenshot 2 (Critical Alert State):**
   - Click the button **"2. Hypoxia Emergency (SpO₂ < 90%)"**.
   - The dashboard instantly triggers **CRITICAL ALERT**, the SpO₂ card turns crimson with warning borders, the astronaut badge pulses red, and the emergency banner displays the active hypoxia intervention protocol.
   - Capture your screen!

---

## 🌐 How to Host on GitHub Pages (Free & Instant)

1. Create a new public repository on GitHub (e.g. `astronaut-health-monitor`).
2. Push or upload these files (`index.html`, `styles.css`, `app.js`, `README.md`) to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Astronaut Health Monitor"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/astronaut-health-monitor.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** > **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Branch**, select `main` and root folder `/ (root)`, then click **Save**.
4. Within 1 minute, GitHub will provide your live URL:  
   `https://YOUR_USERNAME.github.io/astronaut-health-monitor/`

*(Alternatively, drag and drop the folder into [Netlify Drop](https://app.netlify.com/drop) or [Vercel](https://vercel.com) for a 10-second instant deployment!)*

---

## 💬 Discord Submission Format

Copy and paste this template into the **#nasa-space-app-submissions** channel:

```markdown
#evn-sp-webdev
**Project:** AstroPulse — NASA Astronaut Health Telemetry Dashboard
**Challenge:** Astronaut Health Monitor (100 Karma)

**Live Hosted Link:** <INSERT YOUR GITHUB PAGES OR NETLIFY LINK HERE>
**GitHub Repository:** <INSERT YOUR GITHUB REPO LINK HERE>

**Screenshots:** (Attached 2 images: 1 Nominal Dashboard view, 1 Critical Hypoxia Alert view)

**Brief Explanation of Alert Condition & Logic:**
The telemetry monitor evaluates continuous stochastic biometric streams against NASA flight safety thresholds:
1. Primary Alert: If blood oxygen (SpO₂) drops below 90%, the system triggers an immediate CRITICAL ALERT state. The dashboard flashes emergency indicators, plays an audible alarm, and logs the hypoxia emergency event.
2. Multi-tier safeguards also monitor Heart Rate (Critical if >120 or <45 BPM) and Core Body Temperature (Critical if >38.5°C or <35.5°C). Any parameter exceeding critical thresholds triggers the global mission alert banner and shifts the astronaut's status badge from Normal to Critical.
```

---

## 🛠️ Technology Stack
- **HTML5 & Modern Semantic Elements**
- **Vanilla CSS3** (Custom Glassmorphism, CSS Grid, Flexbox, Keyframe Pulse Animations)
- **Vanilla JavaScript (ES6+)** (Zero third-party library dependencies)
- **HTML5 Canvas API** (Real-time ECG Cardiac Oscilloscope)
- **Web Audio API** (Pure mathematical audio synthesis for telemetry beeps and alarm sirens)
- **Google Fonts** (*Chakra Petch*, *Inter*, *Share Tech Mono*)
