/**
 * Morse Code Audio Studio - Full Tab Controller (Manifest V3)
 * Full desktop experience for microphone listening, file decoding, and audio synthesis.
 */

'use strict';

// ============================================================
// MORSE CODE DICTIONARY
// ============================================================
const morseCodeMap = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
};

const reverseMorseCodeMap = {};
for (const [key, value] of Object.entries(morseCodeMap)) {
  if (key !== ' ') reverseMorseCodeMap[value] = key;
}
reverseMorseCodeMap['/'] = ' ';

// ============================================================
// WAV CONVERTER: AudioBuffer -> WAV Blob
// ============================================================
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length    = len * numOfChan * 2 + 44;
  const buffer    = new ArrayBuffer(length);
  const view      = new DataView(buffer);
  const channels  = [];
  let i, sample, offset = 0, pos = 0;

  function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);          // PCM uncompressed
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));
  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

// ============================================================
// STUDIO INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const textInput        = document.getElementById('text-input');
  const morseInput       = document.getElementById('morse-input');
  const textCounter      = document.getElementById('text-counter');
  const morseCounter     = document.getElementById('morse-counter');
  const statSource       = document.getElementById('stat-source');
  const statPitch        = document.getElementById('stat-pitch');
  const statWpm          = document.getElementById('stat-wpm');
  const statState        = document.getElementById('stat-state');
  const signalInd        = document.getElementById('signal-ind');
  const visCanvas        = document.getElementById('vis-canvas');
  const visCtx           = visCanvas ? visCanvas.getContext('2d') : null;
  const fileInput        = document.getElementById('file-input');
  const optVibrate       = document.getElementById('opt-vibrate');
  const optAutotune      = document.getElementById('opt-autotune');
  const optLoop          = document.getElementById('opt-loop');
  const speedSlider      = document.getElementById('speed-slider');
  const farnsworthSlider = document.getElementById('farnsworth-slider');
  const pitchSlider      = document.getElementById('pitch-slider');
  const volSlider        = document.getElementById('volume-slider');
  const thresholdSlider  = document.getElementById('threshold-slider');
  const toastEl          = document.getElementById('toast');

  if (!textInput || !morseInput) return;

  // ---- Toast Feedback ----
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => { toastEl.classList.remove('show'); }, 2500);
  }

  // ---- Counters ----
  function updateCounters() {
    if (textCounter) textCounter.textContent = `${textInput.value.length} chars`;
    if (morseCounter) {
      const symbols = (morseInput.value.match(/[.\-]/g) || []).length;
      morseCounter.textContent = `${symbols} symbols`;
    }
  }

  // ---- Build Reference Chart ----
  const chartBody = document.getElementById('chart-body');
  const chartToggle = document.getElementById('chart-toggle');
  const chartArrow = document.getElementById('chart-arrow');

  if (chartBody) {
    for (const [char, code] of Object.entries(morseCodeMap)) {
      if (char === ' ') continue;
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.innerHTML = `<span class="char">${char}</span><span class="code">${code}</span>`;
      card.addEventListener('click', () => {
        morseInput.value = (morseInput.value + ' ' + code).trim();
        morseInput.dispatchEvent(new Event('input'));
        showToast(`Added ${char} (${code})`);
      });
      chartBody.appendChild(card);
    }
  }

  if (chartToggle && chartBody && chartArrow) {
    chartToggle.addEventListener('click', () => {
      chartBody.classList.toggle('open');
      chartArrow.textContent = chartBody.classList.contains('open') ? '▲' : '▼';
    });
  }

  // ---- Sliders Live Labels ----
  if (speedSlider) {
    speedSlider.addEventListener('input', e => {
      const val = document.getElementById('speed-val');
      if (val) val.textContent = e.target.value + ' WPM';
    });
  }
  if (farnsworthSlider) {
    farnsworthSlider.addEventListener('input', e => {
      const val = document.getElementById('farnsworth-val');
      if (val) val.textContent = e.target.value + ' WPM';
    });
  }
  if (pitchSlider) {
    pitchSlider.addEventListener('input', e => {
      const val = document.getElementById('pitch-val');
      if (val) val.textContent = e.target.value + ' Hz';
    });
  }
  if (volSlider) {
    volSlider.addEventListener('input', e => {
      const val = document.getElementById('volume-val');
      if (val) val.textContent = e.target.value + '%';
    });
  }
  if (thresholdSlider) {
    thresholdSlider.addEventListener('input', e => {
      const val = document.getElementById('threshold-val');
      if (val) val.textContent = e.target.value + ' dB';
    });
  }

  // ---- Canvas Resize ----
  function resizeCanvas() {
    if (visCanvas && visCanvas.parentElement) {
      visCanvas.width = visCanvas.parentElement.clientWidth || 980;
      visCanvas.height = visCanvas.parentElement.clientHeight || 75;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(resizeCanvas);

  // ---- Two-Way Translation ----
  let isTranslating = false;
  textInput.addEventListener('input', (e) => {
    if (isTranslating) return;
    isTranslating = true;
    morseInput.value = e.target.value.toUpperCase().split('').map(char => morseCodeMap[char] || '').filter(Boolean).join(' ');
    updateCounters();
    isTranslating = false;
  });

  morseInput.addEventListener('input', (e) => {
    if (isTranslating) return;
    isTranslating = true;
    textInput.value = e.target.value.trim().split(/\s+/).map(code => reverseMorseCodeMap[code] || '').join('').replace(/\s+/g, ' ');
    updateCounters();
    isTranslating = false;
  });

  function appendDecodedMorse(symbol) {
    isTranslating = true;
    morseInput.value = (morseInput.value + symbol).trimStart();
    textInput.value = morseInput.value.trim().split(/\s+/).map(code => reverseMorseCodeMap[code] || '').join('').replace(/\s+/g, ' ');
    updateCounters();
    isTranslating = false;
    morseInput.scrollTop = morseInput.scrollHeight;
    textInput.scrollTop = textInput.scrollHeight;
  }

  function setFullDecodedMorse(fullMorse) {
    isTranslating = true;
    morseInput.value = fullMorse.trim();
    textInput.value = morseInput.value.trim().split(/\s+/).map(code => reverseMorseCodeMap[code] || '').join('').replace(/\s+/g, ' ');
    updateCounters();
    isTranslating = false;
  }

  // ---- Copy & Export Actions ----
  function copyToClipboard(text, successMsg) {
    if (!text) { showToast('Nothing to copy!'); return; }
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      showToast('Copied to clipboard');
    });
  }

  const btnClear = document.getElementById('btn-clear');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      textInput.value = '';
      morseInput.value = '';
      updateCounters();
      stopPlayback();
      stopDecoding();
      showToast('Cleared all');
    });
  }

  const btnCopyText = document.getElementById('btn-copy-text');
  if (btnCopyText) {
    btnCopyText.addEventListener('click', () => copyToClipboard(textInput.value, 'Plain text copied!'));
  }

  const btnCopyMorse = document.getElementById('btn-copy-morse');
  if (btnCopyMorse) {
    btnCopyMorse.addEventListener('click', () => copyToClipboard(morseInput.value, 'Morse code copied!'));
  }

  const btnExportTxt = document.getElementById('btn-export-txt');
  if (btnExportTxt) {
    btnExportTxt.addEventListener('click', () => {
      if (!textInput.value && !morseInput.value) {
        showToast('Nothing to export!');
        return;
      }
      const content = `TEXT:\n${textInput.value}\n\nMORSE CODE:\n${morseInput.value}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'morse_translation.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Exported TXT file');
    });
  }

  // ============================================================
  // AUDIO DECODER ENGINE
  // ============================================================
  let audioCtx      = null;
  let analyser      = null;
  let sourceNode    = null;
  let filterNode    = null;
  let decodeAnimId  = null;
  let isDecoding    = false;
  let micStream     = null;

  let stableSignalOn       = false;
  let lastStableChangeTime = 0;
  let rawSignalOn          = false;
  let rawSignalCounter     = 0;
  let currentDotMs         = 100;
  let selectedAudioFile    = null;

  const btnChooseAudio = document.getElementById('btn-choose-audio');
  if (btnChooseAudio && fileInput) {
    btnChooseAudio.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) {
        selectedAudioFile = e.target.files[0];
        if (statSource) statSource.textContent = `File: ${selectedAudioFile.name}`;
        showToast('Audio file loaded');
      }
    });
  }

  async function initAudioCtx() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    if (!analyser) {
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
    }
  }

  function stopDecoding() {
    isDecoding = false;
    if (decodeAnimId) cancelAnimationFrame(decodeAnimId);
    if (sourceNode) {
      try { sourceNode.stop(); } catch (e) {}
      try { sourceNode.disconnect(); } catch (e) {}
      sourceNode = null;
    }
    if (filterNode) {
      try { filterNode.disconnect(); } catch (e) {}
      filterNode = null;
    }
    if (micStream) {
      try { micStream.getTracks().forEach(track => track.stop()); } catch (e) {}
      micStream = null;
    }
    if (optVibrate && optVibrate.checked && navigator.vibrate) navigator.vibrate(0);
    if (statState) statState.textContent = 'idle';
    if (signalInd) signalInd.classList.remove('active');
    if (visCtx && visCanvas) visCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);
  }

  const btnStopDecode = document.getElementById('btn-stop-decode');
  if (btnStopDecode) {
    btnStopDecode.addEventListener('click', () => {
      stopDecoding();
      showToast('Decoding stopped');
    });
  }

  const btnListenMic = document.getElementById('btn-listen-mic');
  if (btnListenMic) {
    btnListenMic.addEventListener('click', async () => {
      stopDecoding();
      textInput.value = '';
      morseInput.value = '';

      await initAudioCtx();
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        sourceNode = audioCtx.createMediaStreamSource(micStream);

        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'highpass';
        filterNode.frequency.value = 250;

        sourceNode.connect(filterNode);
        filterNode.connect(analyser);

        if (statSource) statSource.textContent = 'Microphone';
        showToast('Listening to microphone...');
        startAnalysisLoop();
      } catch (err) {
        showToast('Microphone access denied or unavailable.');
        console.warn('Mic access failed:', err);
      }
    });
  }

  // --- Offline Buffer Decoding for Audio Files ---
  function decodeAudioBufferOffline(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate  = audioBuffer.sampleRate;
    const windowSize  = Math.floor(sampleRate * 0.005); // 5ms frames
    const numWindows  = Math.floor(channelData.length / windowSize);

    const rmsArray = new Float32Array(numWindows);
    let maxRms = 0;
    let minRms = Infinity;

    for (let i = 0; i < numWindows; i++) {
      let sumSq = 0;
      const start = i * windowSize;
      for (let j = 0; j < windowSize; j++) {
        const sample = channelData[start + j];
        sumSq += sample * sample;
      }
      const rms = Math.sqrt(sumSq / windowSize);
      rmsArray[i] = rms;
      if (rms > maxRms) maxRms = rms;
      if (rms < minRms) minRms = rms;
    }

    if (maxRms < 0.005) return '';

    const threshold = minRms + (maxRms - minRms) * 0.28;
    const states = new Array(numWindows);
    for (let i = 0; i < numWindows; i++) {
      states[i] = rmsArray[i] > threshold;
    }

    const segments = [];
    let currentSignal = states[0];
    let currentLen = 0;

    for (let i = 0; i < numWindows; i++) {
      if (states[i] === currentSignal) {
        currentLen++;
      } else {
        segments.push({ signal: currentSignal, durationMs: currentLen * 5 });
        currentSignal = states[i];
        currentLen = 1;
      }
    }
    if (currentLen > 0) {
      segments.push({ signal: currentSignal, durationMs: currentLen * 5 });
    }

    const onDurations = segments.filter(s => s.signal && s.durationMs >= 25).map(s => s.durationMs).sort((a, b) => a - b);
    if (onDurations.length === 0) return '';

    const shortOnDurations = onDurations.slice(0, Math.max(1, Math.floor(onDurations.length / 2)));
    const estDotMs = shortOnDurations[Math.floor(shortOnDurations.length / 2)] || 80;

    let morseResult = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.signal) {
        if (seg.durationMs >= 25) {
          morseResult += (seg.durationMs > estDotMs * 2.1) ? '-' : '.';
        }
      } else {
        if (seg.durationMs > estDotMs * 4.8) {
          morseResult += ' / ';
        } else if (seg.durationMs > estDotMs * 1.8) {
          morseResult += ' ';
        }
      }
    }

    return morseResult.replace(/\s+/g, ' ').trim();
  }

  const btnDecodeFile = document.getElementById('btn-decode-file');
  if (btnDecodeFile) {
    btnDecodeFile.addEventListener('click', async () => {
      if (!selectedAudioFile) {
        showToast('Choose an audio file first using "Choose Audio"');
        return;
      }
      stopDecoding();
      textInput.value = '';
      morseInput.value = '';

      await initAudioCtx();
      showToast('Decoding file...');

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          const offlineDecodedMorse = decodeAudioBufferOffline(audioBuffer);
          if (offlineDecodedMorse) {
            setFullDecodedMorse(offlineDecodedMorse);
            showToast('Decoded file successfully!');
          }

          sourceNode = audioCtx.createBufferSource();
          sourceNode.buffer = audioBuffer;

          filterNode = audioCtx.createBiquadFilter();
          filterNode.type = 'highpass';
          filterNode.frequency.value = 250;

          sourceNode.connect(filterNode);
          filterNode.connect(analyser);
          analyser.connect(audioCtx.destination);

          sourceNode.start(0);
          if (statSource) statSource.textContent = `File: ${selectedAudioFile.name}`;

          startAnalysisLoop(!!offlineDecodedMorse);
          sourceNode.onended = () => stopDecoding();
        } catch (err) {
          showToast('Unable to decode audio format (use WAV/MP3/OGG)');
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(selectedAudioFile);
    });
  }

  function startAnalysisLoop(skipAppend = false) {
    isDecoding = true;
    stableSignalOn = false;
    rawSignalOn = false;
    rawSignalCounter = 0;
    lastStableChangeTime = performance.now();
    currentDotMs = 100;

    if (statState) statState.textContent = 'playing & decoding';
    analysisLoop(skipAppend);
  }

  function analysisLoop(skipAppend = false) {
    if (!isDecoding || !analyser) return;
    decodeAnimId = requestAnimationFrame(() => analysisLoop(skipAppend));

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeData);

    let sumSq = 0;
    for (let i = 0; i < bufferLength; i++) {
      const norm = (timeData[i] - 128) / 128.0;
      sumSq += norm * norm;
    }
    const rms = Math.sqrt(sumSq / bufferLength);

    const freqData = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(freqData);

    const nyquist = audioCtx.sampleRate / 2;
    const minIdx  = Math.max(1, Math.floor((250 * bufferLength) / nyquist));
    const maxIdx  = Math.min(bufferLength - 1, Math.ceil((1800 * bufferLength) / nyquist));

    let maxVol = -Infinity;
    let peakIdx = minIdx;
    for (let i = minIdx; i <= maxIdx; i++) {
      if (freqData[i] > maxVol) {
        maxVol = freqData[i];
        peakIdx = i;
      }
    }

    const detectedPitch = Math.round((peakIdx * nyquist) / bufferLength);

    if (optAutotune && optAutotune.checked && pitchSlider && Math.abs(pitchSlider.value - detectedPitch) > 25 && detectedPitch > 300 && detectedPitch < 1200) {
      pitchSlider.value = detectedPitch;
      const pitchValEl = document.getElementById('pitch-val');
      if (pitchValEl) pitchValEl.textContent = `${detectedPitch} Hz`;
    }

    const dbThreshold = thresholdSlider ? parseInt(thresholdSlider.value) : -55;
    const isSignalOnNow = (maxVol > dbThreshold && maxVol > -80) || (rms > 0.05);
    const now = performance.now();

    if (isSignalOnNow !== rawSignalOn) {
      rawSignalOn = isSignalOnNow;
      rawSignalCounter = 0;
    } else {
      rawSignalCounter++;
    }

    if (rawSignalCounter >= 2 && rawSignalOn !== stableSignalOn) {
      const duration = now - lastStableChangeTime;

      if (stableSignalOn) {
        if (duration > 30) {
          if (!skipAppend) {
            if (duration > currentDotMs * 2.1) {
              appendDecodedMorse('-');
            } else {
              appendDecodedMorse('.');
              currentDotMs = (currentDotMs * 3 + duration) / 4;
              currentDotMs = Math.max(35, Math.min(250, currentDotMs));
              const estWpm = Math.round(1200 / currentDotMs);
              if (statWpm) statWpm.textContent = estWpm;
            }
          }
        }
        if (optVibrate && optVibrate.checked && navigator.vibrate) navigator.vibrate(0);
      } else {
        if (duration > 30) {
          if (!skipAppend) {
            if (duration > currentDotMs * 4.5) {
              appendDecodedMorse(' / ');
            } else if (duration > currentDotMs * 2.1) {
              appendDecodedMorse(' ');
            }
          }
        }
        if (optVibrate && optVibrate.checked && navigator.vibrate) navigator.vibrate(10000);
      }

      stableSignalOn = rawSignalOn;
      lastStableChangeTime = now;
    } else if (!stableSignalOn && !skipAppend) {
      const duration = now - lastStableChangeTime;
      if (duration > currentDotMs * 6 && !morseInput.value.endsWith(' / ') && morseInput.value.length > 0) {
        appendDecodedMorse(' / ');
        lastStableChangeTime = now;
      }
    }

    // Signal Light
    if (signalInd) {
      if (stableSignalOn) {
        signalInd.classList.add('active');
        if (statPitch) statPitch.textContent = `${detectedPitch} Hz`;
      } else {
        signalInd.classList.remove('active');
      }
    }

    // Oscilloscope Visualizer
    if (visCtx && visCanvas) {
      visCtx.fillStyle = '#000000';
      visCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);

      visCtx.lineWidth = 2;
      visCtx.strokeStyle = stableSignalOn ? '#ffffff' : '#52525b';
      visCtx.beginPath();

      const sliceWidth = (visCanvas.width * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * visCanvas.height) / 2;
        if (i === 0) visCtx.moveTo(x, y);
        else visCtx.lineTo(x, y);
        x += sliceWidth;
      }
      visCtx.lineTo(visCanvas.width, visCanvas.height / 2);
      visCtx.stroke();
    }
  }

  // ============================================================
  // PLAYBACK ENGINE
  // ============================================================
  let playOscs    = [];
  let isPlaying   = false;
  let playTimeout = null;

  function stopPlayback() {
    if (audioCtx) {
      playOscs.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch (e) {} });
      playOscs = [];
    }
    if (playTimeout) clearTimeout(playTimeout);
    isPlaying = false;
  }

  const btnStopPlay = document.getElementById('btn-stop-play');
  if (btnStopPlay) {
    btnStopPlay.addEventListener('click', () => {
      stopPlayback();
      showToast('Playback stopped');
    });
  }

  async function startPlayback() {
    if (isPlaying) stopPlayback();

    if (!morseInput.value.trim() && textInput.value.trim()) {
      morseInput.value = textInput.value.toUpperCase().split('').map(char => morseCodeMap[char] || '').filter(Boolean).join(' ');
      updateCounters();
    }

    const morse = morseInput.value.trim();
    if (!morse) {
      showToast('Type Plain Text or Morse code first');
      return;
    }

    await initAudioCtx();
    const wpm             = speedSlider ? parseInt(speedSlider.value) : 20;
    const farnsworthWpm   = farnsworthSlider ? parseInt(farnsworthSlider.value) : 15;
    const pitch           = pitchSlider ? parseInt(pitchSlider.value) : 600;
    const volume          = volSlider ? parseInt(volSlider.value) / 100 : 0.5;
    const dotDuration     = 1.2 / wpm;
    const farnsworthRatio = wpm > farnsworthWpm ? (1.2 / farnsworthWpm) / (1.2 / wpm) : 1;

    let timeOffset = audioCtx.currentTime + 0.05;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = pitch;
    gainNode.gain.setValueAtTime(0, 0);

    const chars = morse.split('');
    chars.forEach(char => {
      if (char === '.') {
        gainNode.gain.setValueAtTime(0, timeOffset);
        gainNode.gain.setTargetAtTime(volume, timeOffset, 0.005);
        gainNode.gain.setTargetAtTime(0, timeOffset + dotDuration - 0.005, 0.005);
        timeOffset += dotDuration * 2;
      } else if (char === '-') {
        gainNode.gain.setValueAtTime(0, timeOffset);
        gainNode.gain.setTargetAtTime(volume, timeOffset, 0.005);
        gainNode.gain.setTargetAtTime(0, timeOffset + (dotDuration * 3) - 0.005, 0.005);
        timeOffset += dotDuration * 4;
      } else if (char === ' ') {
        timeOffset += dotDuration * 2 * farnsworthRatio;
      } else if (char === '/') {
        timeOffset += dotDuration * 6 * farnsworthRatio;
      }
    });

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(timeOffset + 0.1);
    playOscs.push(osc);
    isPlaying = true;
    showToast('Playing Morse audio');

    const durationMs = (timeOffset - audioCtx.currentTime) * 1000;
    playTimeout = setTimeout(() => {
      isPlaying = false;
      if (optLoop && optLoop.checked) startPlayback();
    }, durationMs + 200);
  }

  const btnPlay = document.getElementById('btn-play');
  if (btnPlay) btnPlay.addEventListener('click', startPlayback);

  // ============================================================
  // WAV AUDIO DOWNLOAD GENERATOR
  // ============================================================
  const btnDownloadWav = document.getElementById('btn-download-wav');
  if (btnDownloadWav) {
    btnDownloadWav.addEventListener('click', async () => {
      if (!morseInput.value.trim() && textInput.value.trim()) {
        morseInput.value = textInput.value.toUpperCase().split('').map(char => morseCodeMap[char] || '').filter(Boolean).join(' ');
        updateCounters();
      }

      const morse = morseInput.value.trim();
      if (!morse) {
        showToast('Type text or morse first to download');
        return;
      }

      showToast('Rendering WAV audio...');
      const wpm             = speedSlider ? parseInt(speedSlider.value) : 20;
      const farnsworthWpm   = farnsworthSlider ? parseInt(farnsworthSlider.value) : 15;
      const pitch           = pitchSlider ? parseInt(pitchSlider.value) : 600;
      const volume          = volSlider ? parseInt(volSlider.value) / 100 : 0.5;
      const dotDuration     = 1.2 / wpm;
      const farnsworthRatio = wpm > farnsworthWpm ? (1.2 / farnsworthWpm) / (1.2 / wpm) : 1;

      let totalDuration = 0.3;
      const chars = morse.split('');
      chars.forEach(char => {
        if (char === '.') totalDuration += dotDuration * 2;
        else if (char === '-') totalDuration += dotDuration * 4;
        else if (char === ' ') totalDuration += dotDuration * 2 * farnsworthRatio;
        else if (char === '/') totalDuration += dotDuration * 6 * farnsworthRatio;
      });

      const sampleRate = 44100;
      const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offlineCtx = new OfflineCtxClass(1, Math.ceil(totalDuration * sampleRate), sampleRate);

      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = pitch;
      gain.gain.setValueAtTime(0, 0);

      let timeOffset = 0.1;
      chars.forEach(char => {
        if (char === '.') {
          gain.gain.setValueAtTime(0, timeOffset);
          gain.gain.setTargetAtTime(volume, timeOffset, 0.005);
          gain.gain.setTargetAtTime(0, timeOffset + dotDuration - 0.005, 0.005);
          timeOffset += dotDuration * 2;
        } else if (char === '-') {
          gain.gain.setValueAtTime(0, timeOffset);
          gain.gain.setTargetAtTime(volume, timeOffset, 0.005);
          gain.gain.setTargetAtTime(0, timeOffset + (dotDuration * 3) - 0.005, 0.005);
          timeOffset += dotDuration * 4;
        } else if (char === ' ') {
          timeOffset += dotDuration * 2 * farnsworthRatio;
        } else if (char === '/') {
          timeOffset += dotDuration * 6 * farnsworthRatio;
        }
      });

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(0);
      osc.stop(timeOffset + 0.1);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morse_code_${wpm}wpm.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('WAV file downloaded!');
    });
  }

  updateCounters();
});
