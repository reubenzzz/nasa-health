/**
 * AstroPulse - NASA Artemis Astronaut Health Telemetry System
 * Core Application & Telemetry Engine
 */

// Application State
const state = {
  activeScenario: 'nominal', // 'nominal', 'hypoxia', 'cardio', 'hypothermia'
  isStreaming: true,
  streamIntervalMs: 2000,
  isFahrenheit: false,
  audioMuted: false,
  overallStatus: 'NORMAL', // 'NORMAL', 'WARNING', 'CRITICAL'
  missionSeconds: 142 * 86400 + 8 * 3600 + 34 * 60 + 12, // Sol 142 08:34:12

  // Current Biometric Telemetry
  vitals: {
    heartRate: 72,       // BPM (Nom: 60-100, Warn: 101-120/50-59, Crit: >120/<50)
    spo2: 98.4,          // % (Nom: >=95, Warn: 90-94.9, Crit: <90)
    temperature: 36.8,   // °C (Nom: 36.5-37.5, Warn: 37.6-38.4/35.6-36.4, Crit: >38.5/<35.5)
    sleepDuration: 7.6,  // Hours (24h period)
    exerciseTime: 94,    // Minutes (out of 120 goal)
    respiration: 14,     // breaths/min
    pressure: 101.3,     // kPa suit pressure
    co2: 0.28,           // % CO2 fraction
    hrv: 68              // Heart Rate Variability (ms)
  },

  // Active alerts list
  activeAlerts: []
};

// =====================================================================
// AUDIO SYNTHESIZER (WEB AUDIO API - ZERO EXTERNAL ASSETS REQUIRED)
// =====================================================================
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playNominalBeep() {
    if (state.audioMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  playWarningChime() {
    if (state.audioMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playCriticalSiren() {
    if (state.audioMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.25);
      osc.frequency.linearRampToValueAtTime(900, now + 0.5);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.55);
    } catch (e) {}
  }
}

const audioSynth = new AudioSynthesizer();

// =====================================================================
// ECG OSCILLOSCOPE SIMULATOR (CANVAS)
// =====================================================================
class ECGWaveform {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.points = [];
    this.maxPoints = 180;
    this.phase = 0;
    this.initPoints();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initPoints() {
    for (let i = 0; i < this.maxPoints; i++) {
      this.points.push(0);
    }
  }

  generateCardiacSample(phase, isCritical) {
    // Standard P-Q-R-S-T wave model
    const p = phase % 1;
    if (p > 0.15 && p < 0.25) {
      // P wave
      return Math.sin((p - 0.15) / 0.1 * Math.PI) * 0.18;
    } else if (p >= 0.28 && p < 0.31) {
      // Q dip
      return -0.15;
    } else if (p >= 0.31 && p < 0.37) {
      // R spike
      return (isCritical ? 1.4 : 1.0) * Math.sin((p - 0.31) / 0.06 * Math.PI);
    } else if (p >= 0.37 && p < 0.41) {
      // S dip
      return -0.25;
    } else if (p > 0.48 && p < 0.65) {
      // T wave
      return Math.sin((p - 0.48) / 0.17 * Math.PI) * 0.28;
    }
    // Baseline noise
    return (Math.random() - 0.5) * 0.04;
  }

  animate() {
    if (!this.canvas) return;

    // Advance phase based on Heart Rate BPM
    const speed = (state.vitals.heartRate / 60) * 0.035;
    this.phase += speed;

    const isCrit = state.overallStatus === 'CRITICAL';
    const sample = this.generateCardiacSample(this.phase, isCrit);

    this.points.shift();
    this.points.push(sample);

    // Draw
    const w = this.canvas.width;
    const h = this.canvas.height;
    const midY = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    // Glow effect
    this.ctx.lineWidth = 2.2;
    if (state.overallStatus === 'CRITICAL') {
      this.ctx.strokeStyle = '#ff2a5f';
      this.ctx.shadowColor = '#ff2a5f';
      this.ctx.shadowBlur = 12;
    } else if (state.overallStatus === 'WARNING') {
      this.ctx.strokeStyle = '#ffb800';
      this.ctx.shadowColor = '#ffb800';
      this.ctx.shadowBlur = 8;
    } else {
      this.ctx.strokeStyle = '#00e5a3';
      this.ctx.shadowColor = '#00e5a3';
      this.ctx.shadowBlur = 8;
    }

    this.ctx.beginPath();
    const step = w / (this.maxPoints - 1);

    for (let i = 0; i < this.points.length; i++) {
      const x = i * step;
      // Invert Y so positive is up
      const y = midY - this.points[i] * (h * 0.38);
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // Reset shadow blur
    this.ctx.shadowBlur = 0;

    // Trailing glow cursor dot
    const lastX = (this.points.length - 1) * step;
    const lastY = midY - this.points[this.points.length - 1] * (h * 0.38);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    this.ctx.fill();

    requestAnimationFrame(this.animate);
  }
}

// =====================================================================
// TELEMETRY EVALUATOR & ALERT ENGINE
// =====================================================================
function evaluateBiometrics() {
  const { heartRate, spo2, temperature } = state.vitals;
  const alerts = [];
  let worstSeverity = 'NORMAL'; // NORMAL < WARNING < CRITICAL

  // --- Rule 1: Blood Oxygen (SpO2) ---
  // Mandatory Hackathon Condition: If oxygen level < 90% -> CRITICAL ALERT
  let spo2Status = 'NORMAL';
  if (spo2 < 90) {
    spo2Status = 'CRITICAL';
    worstSeverity = 'CRITICAL';
    alerts.push({
      param: 'Blood Oxygen (SpO₂)',
      severity: 'CRITICAL',
      value: `${spo2.toFixed(1)}%`,
      msg: `CRITICAL ALERT: Severe Hypoxia! SpO₂ dropped to ${spo2.toFixed(1)}% (< 90% threshold). Automated O₂ injection initiated!`
    });
  } else if (spo2 < 95) {
    spo2Status = 'WARNING';
    if (worstSeverity !== 'CRITICAL') worstSeverity = 'WARNING';
    alerts.push({
      param: 'Blood Oxygen (SpO₂)',
      severity: 'WARNING',
      value: `${spo2.toFixed(1)}%`,
      msg: `WARNING: Sub-optimal SpO₂ (${spo2.toFixed(1)}%). Monitor suit ventilation.`
    });
  }

  // --- Rule 2: Heart Rate (BPM) ---
  let hrStatus = 'NORMAL';
  if (heartRate > 120 || heartRate < 45) {
    hrStatus = 'CRITICAL';
    worstSeverity = 'CRITICAL';
    alerts.push({
      param: 'Heart Rate',
      severity: 'CRITICAL',
      value: `${Math.round(heartRate)} BPM`,
      msg: `CRITICAL ALERT: Acute Cardiac Strain! Heart rate at ${Math.round(heartRate)} BPM (Safe bounds: 50-120 BPM).`
    });
  } else if (heartRate > 100 || heartRate < 55) {
    hrStatus = 'WARNING';
    if (worstSeverity !== 'CRITICAL') worstSeverity = 'WARNING';
    alerts.push({
      param: 'Heart Rate',
      severity: 'WARNING',
      value: `${Math.round(heartRate)} BPM`,
      msg: `WARNING: Elevated pulse rate (${Math.round(heartRate)} BPM). Astronaut in active physical exertion.`
    });
  }

  // --- Rule 3: Body Temperature (°C) ---
  let tempStatus = 'NORMAL';
  if (temperature > 38.5 || temperature < 35.5) {
    tempStatus = 'CRITICAL';
    worstSeverity = 'CRITICAL';
    alerts.push({
      param: 'Core Temperature',
      severity: 'CRITICAL',
      value: `${temperature.toFixed(1)}°C`,
      msg: `CRITICAL ALERT: Thermal Dysregulation! Core temp ${temperature.toFixed(1)}°C outside survival envelope.`
    });
  } else if (temperature > 37.5 || temperature < 36.4) {
    tempStatus = 'WARNING';
    if (worstSeverity !== 'CRITICAL') worstSeverity = 'WARNING';
    alerts.push({
      param: 'Core Temperature',
      severity: 'WARNING',
      value: `${temperature.toFixed(1)}°C`,
      msg: `WARNING: Thermal deviation (${temperature.toFixed(1)}°C). Liquid Cooling Garment adjusting.`
    });
  }

  const prevOverall = state.overallStatus;
  state.overallStatus = worstSeverity;
  state.activeAlerts = alerts;

  // Sound triggers on state shift or critical repeats
  if (worstSeverity === 'CRITICAL') {
    audioSynth.playCriticalSiren();
  } else if (worstSeverity === 'WARNING' && prevOverall !== 'WARNING') {
    audioSynth.playWarningChime();
  }

  return { spo2Status, hrStatus, tempStatus, alerts, worstSeverity };
}

// =====================================================================
// TELEMETRY SIMULATOR (STOCHASTIC RANDOM FLUCTUATIONS)
// =====================================================================
function simulateNextTelemetryStep() {
  const v = state.vitals;

  if (state.activeScenario === 'nominal') {
    // Normal small random walk around safe baseline
    v.heartRate = clamp(v.heartRate + (Math.random() - 0.49) * 2.2, 64, 84);
    v.spo2 = clamp(v.spo2 + (Math.random() - 0.48) * 0.3, 96.8, 99.6);
    v.temperature = clamp(v.temperature + (Math.random() - 0.5) * 0.06, 36.6, 37.2);
    v.respiration = Math.round(clamp(v.respiration + (Math.random() - 0.5) * 0.8, 12, 16));
    v.pressure = clamp(v.pressure + (Math.random() - 0.5) * 0.1, 100.8, 101.8);
    v.co2 = clamp(v.co2 + (Math.random() - 0.5) * 0.02, 0.22, 0.34);
  } else if (state.activeScenario === 'hypoxia') {
    // Hypoxia Crisis: Oxygen drops below 90% (e.g. 86 - 89.5%)
    v.spo2 = clamp(v.spo2 + (Math.random() - 0.52) * 0.5, 84.5, 89.2);
    v.heartRate = clamp(v.heartRate + (Math.random() - 0.45) * 3, 98, 128); // Tachycardia response
    v.respiration = Math.round(clamp(v.respiration + (Math.random() - 0.4) * 1.2, 22, 30));
  } else if (state.activeScenario === 'cardio') {
    // High Exertion EVA
    v.heartRate = clamp(v.heartRate + (Math.random() - 0.48) * 3.5, 122, 145);
    v.temperature = clamp(v.temperature + (Math.random() - 0.48) * 0.1, 37.7, 38.3);
    v.spo2 = clamp(v.spo2 + (Math.random() - 0.5) * 0.4, 93.5, 96.0);
    v.respiration = Math.round(clamp(v.respiration + (Math.random() - 0.5) * 1.5, 24, 32));
  } else if (state.activeScenario === 'hypothermia') {
    // Thermoregulation suit drop
    v.temperature = clamp(v.temperature - Math.random() * 0.15, 34.2, 35.4);
    v.heartRate = clamp(v.heartRate - Math.random() * 1.5, 42, 54);
    v.spo2 = clamp(v.spo2 + (Math.random() - 0.5) * 0.3, 93.0, 96.5);
  }

  // Slightly increment exercise minutes over time
  if (Math.random() < 0.25 && v.exerciseTime < 120) {
    v.exerciseTime += 1;
  }

  // Increment MET seconds
  state.missionSeconds += 2;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// =====================================================================
// UI RENDERER
// =====================================================================
function updateUI() {
  const { spo2Status, hrStatus, tempStatus, alerts, worstSeverity } = evaluateBiometrics();

  // --- 1. Mission Time & UTC ---
  const metStr = formatMET(state.missionSeconds);
  document.getElementById('met-clock').textContent = metStr;
  const now = new Date();
  document.getElementById('earth-utc').textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // --- 2. Overall Status Badge & Profile Ring ---
  const statusBadge = document.getElementById('overall-status-badge');
  const statusText = document.getElementById('status-text');
  const avatarRing = document.getElementById('avatar-status-ring');

  statusBadge.className = 'status-indicator-badge';
  avatarRing.className = 'avatar-ring';

  if (worstSeverity === 'CRITICAL') {
    statusBadge.classList.add('critical');
    avatarRing.classList.add('critical');
    statusText.textContent = 'CRITICAL ALERT';
  } else if (worstSeverity === 'WARNING') {
    statusBadge.classList.add('warning');
    avatarRing.classList.add('warning');
    statusText.textContent = 'WARNING';
  } else {
    statusText.textContent = 'NORMAL';
  }

  // --- 3. Alert Banner ---
  const banner = document.getElementById('global-alert-banner');
  const alertTitle = document.getElementById('alert-title');
  const alertMsg = document.getElementById('alert-message');
  const alertIcon = document.getElementById('alert-icon-symbol');
  const alertTime = document.getElementById('alert-time');

  banner.className = 'alert-banner';
  alertTime.textContent = metStr.split(' : ')[1] + ' MET';

  if (worstSeverity === 'CRITICAL') {
    banner.classList.add('state-critical');
    alertIcon.textContent = '🚨';
    alertTitle.textContent = 'CRITICAL BIOMEDICAL EMERGENCY DETECTED';
    alertMsg.textContent = alerts.map(a => a.msg).join(' | ');
  } else if (worstSeverity === 'WARNING') {
    banner.classList.add('state-warning');
    alertIcon.textContent = '⚠️';
    alertTitle.textContent = 'BIOMEDICAL WARNING: VITAL PARAMETER DEVIATION';
    alertMsg.textContent = alerts.map(a => a.msg).join(' | ');
  } else {
    banner.classList.add('state-normal');
    alertIcon.textContent = '🛡️';
    alertTitle.textContent = 'SYSTEM STATUS NOMINAL';
    alertMsg.textContent = 'All astronaut biometric parameters within safe operational thresholds.';
  }

  // --- 4. Vital Card: Heart Rate ---
  const hrCard = document.getElementById('card-heart-rate');
  const hrValEl = document.getElementById('hr-value');
  const hrPill = document.getElementById('hr-status-pill');
  const hrTrend = document.getElementById('hr-trend');

  hrValEl.textContent = Math.round(state.vitals.heartRate);
  updatePillAndCard(hrCard, hrPill, hrStatus, hrTrend, 'BPM');

  // --- 5. Vital Card: Blood Oxygen (SpO2) ---
  const spo2Card = document.getElementById('card-oxygen');
  const spo2ValEl = document.getElementById('spo2-value');
  const spo2Pill = document.getElementById('spo2-status-pill');
  const spo2Gauge = document.getElementById('spo2-gauge');
  const spo2Trend = document.getElementById('spo2-trend');

  spo2ValEl.textContent = state.vitals.spo2.toFixed(1);
  spo2Gauge.style.width = `${Math.min(100, Math.max(10, state.vitals.spo2))}%`;
  spo2Gauge.className = `gauge-bar-fill ${spo2Status.toLowerCase()}`;
  updatePillAndCard(spo2Card, spo2Pill, spo2Status, spo2Trend, 'SpO₂');

  // --- 6. Vital Card: Body Temperature ---
  const tempCard = document.getElementById('card-temperature');
  const tempValEl = document.getElementById('temp-value');
  const tempUnitEl = document.getElementById('temp-unit');
  const tempPill = document.getElementById('temp-status-pill');
  const tempGauge = document.getElementById('temp-gauge');
  const tempTrend = document.getElementById('temp-trend');

  let displayTemp = state.vitals.temperature;
  if (state.isFahrenheit) {
    displayTemp = (state.vitals.temperature * 9 / 5) + 32;
    tempUnitEl.textContent = '°F';
  } else {
    tempUnitEl.textContent = '°C';
  }
  tempValEl.textContent = displayTemp.toFixed(1);

  // Map 35°C (0%) to 39°C (100%) for gauge visual
  const tempPct = clamp(((state.vitals.temperature - 35) / 4) * 100, 5, 100);
  tempGauge.style.width = `${tempPct}%`;
  updatePillAndCard(tempCard, tempPill, tempStatus, tempTrend, 'Temp');

  // --- 7. Vital Card: Sleep Duration ---
  document.getElementById('sleep-value').textContent = state.vitals.sleepDuration.toFixed(1);

  // --- 8. Vital Card: Exercise Time ---
  const exValEl = document.getElementById('exercise-value');
  const exGauge = document.getElementById('exercise-gauge');
  exValEl.textContent = state.vitals.exerciseTime;
  exGauge.style.width = `${(state.vitals.exerciseTime / 120) * 100}%`;

  // --- 9. Respiration & Life Support ---
  document.getElementById('resp-value').textContent = state.vitals.respiration;
  document.getElementById('pressure-value').textContent = state.vitals.pressure.toFixed(1);
  document.getElementById('co2-value').textContent = state.vitals.co2.toFixed(2);

  // --- 10. Auto-log new events if state changed or critical ---
  if (alerts.length > 0 && Math.random() < 0.65) {
    alerts.forEach(a => addLogEntry(a.severity, a.msg));
  }
}

function updatePillAndCard(cardEl, pillEl, status, trendEl, label) {
  cardEl.classList.remove('warning-border', 'critical-border');
  pillEl.className = 'card-status-pill';

  if (status === 'CRITICAL') {
    cardEl.classList.add('critical-border');
    pillEl.classList.add('critical');
    pillEl.textContent = 'CRITICAL';
    if (trendEl) {
      trendEl.className = 'vital-trend critical';
      trendEl.innerHTML = `<span class="trend-icon">⚠️</span><span>ALERT TRIGGERED</span>`;
    }
  } else if (status === 'WARNING') {
    cardEl.classList.add('warning-border');
    pillEl.classList.add('warning');
    pillEl.textContent = 'WARNING';
    if (trendEl) {
      trendEl.className = 'vital-trend warning';
      trendEl.innerHTML = `<span class="trend-icon">⚡</span><span>ELEVATED</span>`;
    }
  } else {
    pillEl.textContent = 'NOMINAL';
    if (trendEl) {
      trendEl.className = 'vital-trend';
      trendEl.innerHTML = `<span class="trend-icon">✓</span><span>STABLE</span>`;
    }
  }
}

function formatMET(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const remainder = totalSeconds % 86400;
  const hours = String(Math.floor(remainder / 3600)).padStart(2, '0');
  const mins = String(Math.floor((remainder % 3600) / 60)).padStart(2, '0');
  const secs = String(remainder % 60).padStart(2, '0');
  return `DAY ${days} : ${hours}:${mins}:${secs}`;
}

// =====================================================================
// LOG STREAM ENGINE
// =====================================================================
const loggedMessages = new Set();

function addLogEntry(type, message) {
  const stream = document.getElementById('telemetry-log-stream');
  if (!stream) return;

  const timeStr = formatMET(state.missionSeconds).split(' : ')[1] + ' MET';
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  let tagClass = 'sys';
  let tagText = 'SYS';
  if (type === 'CRITICAL') { tagClass = 'crit'; tagText = 'CRIT'; }
  else if (type === 'WARNING') { tagClass = 'warn'; tagText = 'WARN'; }
  else if (type === 'NOMINAL') { tagClass = 'nom'; tagText = 'NOM'; }

  entry.innerHTML = `
    <span class="log-time">[${timeStr}]</span>
    <span class="log-tag ${tagClass}">${tagText}</span>
    <span class="log-msg">${escapeHtml(message)}</span>
  `;

  stream.insertBefore(entry, stream.firstChild);

  // Keep max 60 entries
  while (stream.children.length > 60) {
    stream.removeChild(stream.lastChild);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =====================================================================
// SCENARIO SWITCHER (FOR SCREENSHOTS & TESTING)
// =====================================================================
function applyScenario(scenarioKey) {
  state.activeScenario = scenarioKey;

  // Highlight active button
  document.querySelectorAll('.scenario-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`scenario-${scenarioKey}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (scenarioKey === 'nominal') {
    state.vitals.heartRate = 72;
    state.vitals.spo2 = 98.4;
    state.vitals.temperature = 36.8;
    state.vitals.respiration = 14;
    state.vitals.pressure = 101.3;
    addLogEntry('NOMINAL', 'Scenario Applied: NOMINAL FLIGHT MODE. All parameters reset to standard baseline.');
  } else if (scenarioKey === 'hypoxia') {
    // Critical alert scenario (< 90% SpO2)
    state.vitals.spo2 = 87.2;
    state.vitals.heartRate = 118;
    state.vitals.respiration = 26;
    addLogEntry('CRITICAL', 'EMERGENCY SCENARIO TRIGGERED: Blood Oxygen dropped to 87.2% (< 90% Threshold)! Hypoxia Protocol initiated.');
  } else if (scenarioKey === 'cardio') {
    state.vitals.heartRate = 138;
    state.vitals.temperature = 38.2;
    state.vitals.spo2 = 94.2;
    addLogEntry('WARNING', 'SCENARIO TRIGGERED: Extravehicular Activity (EVA) High Exertion. Heart Rate 138 BPM, Core Temp 38.2°C.');
  } else if (scenarioKey === 'hypothermia') {
    state.vitals.temperature = 34.8;
    state.vitals.heartRate = 48;
    addLogEntry('CRITICAL', 'SCENARIO TRIGGERED: Suit Heat Exchange Failure. Core Temp dropped to 34.8°C (< 35.5°C Critical).');
  }

  updateUI();
}

// =====================================================================
// EVENT LISTENERS & INITIALIZATION
// =====================================================================
let streamTimer = null;

function setupTimer() {
  if (streamTimer) clearInterval(streamTimer);
  streamTimer = setInterval(() => {
    if (state.isStreaming) {
      simulateNextTelemetryStep();
      updateUI();
    }
  }, state.streamIntervalMs);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize ECG
  new ECGWaveform('ecg-canvas');

  // Initial UI render & initial logs
  updateUI();
  addLogEntry('SYS', 'Telemetry link established with Gateway Station via Deep Space Network (Goldstone Dish 14).');
  addLogEntry('SYS', 'xEMU Suit Mark IV bio-sensors calibrated. Autonomous telemetry monitor online.');
  addLogEntry('NOMINAL', 'Initial crew vitals nominal. Dr. Elena Rostova ready for mission operations.');

  setupTimer();

  // Audio initialize on first click
  document.body.addEventListener('click', () => {
    audioSynth.init();
  }, { once: true });

  // Audio Toggle Button
  const audioBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const audioText = document.getElementById('audio-text');
  audioBtn.addEventListener('click', () => {
    audioSynth.init();
    state.audioMuted = !state.audioMuted;
    if (state.audioMuted) {
      audioIcon.textContent = '🔇';
      audioText.textContent = 'MUTED';
      audioBtn.style.opacity = '0.7';
    } else {
      audioIcon.textContent = '🔊';
      audioText.textContent = 'AUDIO ON';
      audioBtn.style.opacity = '1';
      audioSynth.playNominalBeep();
    }
  });

  // Temperature unit toggle
  const unitToggle = document.getElementById('unit-toggle-btn');
  unitToggle.addEventListener('click', () => {
    state.isFahrenheit = !state.isFahrenheit;
    unitToggle.textContent = state.isFahrenheit ? '[ SWITCH TO °C ]' : '[ SWITCH TO °F ]';
    updateUI();
  });

  // Acknowledge Alert Button
  const ackBtn = document.getElementById('ack-alert-btn');
  ackBtn.addEventListener('click', () => {
    addLogEntry('SYS', `Commander acknowledged alert notifications at ${formatMET(state.missionSeconds)}.`);
    ackBtn.textContent = 'ACKNOWLEDGED';
    setTimeout(() => { ackBtn.textContent = 'ACKNOWLEDGE'; }, 2000);
  });

  // Scenario buttons
  document.getElementById('scenario-nominal').addEventListener('click', () => applyScenario('nominal'));
  document.getElementById('scenario-hypoxia').addEventListener('click', () => applyScenario('hypoxia'));
  document.getElementById('scenario-cardio').addEventListener('click', () => applyScenario('cardio'));
  document.getElementById('scenario-hypothermia').addEventListener('click', () => applyScenario('hypothermia'));

  // Simulation speed buttons
  const speedButtons = document.querySelectorAll('.speed-btn');
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const factor = parseInt(btn.getAttribute('data-speed'), 10);
      if (factor === 1) state.streamIntervalMs = 2000;
      else if (factor === 2) state.streamIntervalMs = 1000;
      else if (factor === 5) state.streamIntervalMs = 400;
      setupTimer();
      addLogEntry('SYS', `Telemetry sampling rate updated to ${factor}X (${state.streamIntervalMs}ms).`);
    });
  });

  // Stream Pause / Resume
  const streamToggleBtn = document.getElementById('stream-toggle-btn');
  streamToggleBtn.addEventListener('click', () => {
    state.isStreaming = !state.isStreaming;
    streamToggleBtn.textContent = state.isStreaming ? 'PAUSE' : 'RESUME';
    addLogEntry('SYS', state.isStreaming ? 'Telemetry stream resumed.' : 'Telemetry stream paused.');
  });

  // Clear Log
  document.getElementById('clear-log-btn').addEventListener('click', () => {
    document.getElementById('telemetry-log-stream').innerHTML = '';
    addLogEntry('SYS', 'Telemetry event log cleared by ground control.');
  });

  // Modal Screenshot Helper
  const modal = document.getElementById('screenshot-modal');
  document.getElementById('screenshot-btn').addEventListener('click', () => {
    modal.classList.add('open');
  });
  document.getElementById('close-modal-btn').addEventListener('click', () => {
    modal.classList.remove('open');
  });
  document.getElementById('apply-scenario-1').addEventListener('click', () => {
    applyScenario('nominal');
    modal.classList.remove('open');
  });
  document.getElementById('apply-scenario-2').addEventListener('click', () => {
    applyScenario('hypoxia');
    modal.classList.remove('open');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
});
