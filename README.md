Encode text, decode Morse code audio, and practice Morse communication in your browser.
Morse Code Audio Translator is a browser-based tool built with HTML, CSS, and JavaScript. It converts plain text to Morse code and back, analyzes Morse signals from microphone input or uploaded audio files, and generates playable and downloadable Morse audio.
Live Demo
Try the tool online: Morse Code Audio Translator
Features
- Text ↔ Morse conversion: Translate letters, numbers, and supported punctuation using dots and dashes.
- Microphone decoding: Listen for live Morse tones with microphone permission.
- Audio file decoding: Analyze uploaded audio recordings and display detected Morse sequences and text.
- Morse audio playback: Hear generated Morse tones directly in the browser.
- WAV export: Download generated Morse audio as a .wav file.
- Playback customization: Adjust words per minute (WPM), Farnsworth speed, pitch, and volume.
- Decoder controls: Set a noise threshold and enable automatic frequency detection.
- Signal visualizer: See waveform activity and signal status during analysis.
- Copy and export: Copy plain text or Morse code, or export both as a .txt file.
- Reference chart: Browse supported Morse characters and insert codes with a click.
- Extra playback options: Loop playback and use vibration where supported by the device/browser.
Getting Started
1. Download or clone this repository.
2. Open the tool's HTML page in a modern browser, once the project files have been added to the repository.
3. Type in the Plain Text field to generate Morse code, or enter dots and dashes in the Morse Code field to decode them.
4. Select Play Audio to listen or Download Audio (.wav) to save a generated signal.
5. To decode audio, choose Listen (Mic) and grant microphone access, or choose an audio file and click Decode File.
Microphone access may require a secure context (HTTPS or localhost), depending on the browser. Supported audio file types depend on the browser's audio decoder.

Technology
- HTML5 and CSS3 for the interface
- Vanilla JavaScript for translation and interaction
- Web Audio API for signal analysis, playback, and audio rendering
- Canvas API for waveform visualization
- MediaDevices API for microphone input
The core tool uses browser-native APIs rather than a server-side decoding service.
Project Structure
This repository is intended to hold the web tool's HTML, CSS, and JavaScript source. A browser extension package may additionally require a manifest.json, extension icons, and browser-specific configuration. The presence of the web tool alone does not make it an installable extension.
Limitations
Audio decoding is best suited to clear, consistent Morse tones. Background noise, variable timing, overlapping sounds, and incompatible audio formats can reduce accuracy. Do not rely on automatic decoding for safety-critical or emergency communications.
Contributing
Suggestions, bug reports, and improvements are welcome through GitHub Issues. Please include reproduction steps and browser details when reporting a problem.
License
Check the repository's LICENSE file, if one is added, for the applicable usage terms. No open-source license is implied by this README alone.
