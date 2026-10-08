/**
 * Morse Code Audio Decoder - Background Service Worker (Manifest V3)
 * Handles context menus, quick translations, and full-page launch.
 */

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

function textToMorse(text) {
  if (!text) return '';
  return text.toUpperCase().split('').map(char => morseCodeMap[char] || '').filter(Boolean).join(' ');
}

function morseToText(morse) {
  if (!morse) return '';
  return morse.trim().split(/\s+/).map(code => reverseMorseCodeMap[code] || '').join('').replace(/\s+/g, ' ');
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'morse_encode_selection',
    title: 'Translate "%s" to Morse Code',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'morse_decode_selection',
    title: 'Decode Morse "%s" to Plain Text',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'morse_open_full',
    title: 'Open Morse Audio Studio (Full Page)',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'morse_open_full') {
    chrome.tabs.create({ url: chrome.runtime.getURL('fulltab.html') });
    return;
  }

  const selectedText = (info.selectionText || '').trim();
  if (!selectedText) return;

  if (info.menuItemId === 'morse_encode_selection') {
    const morse = textToMorse(selectedText);
    chrome.storage.local.set({ lastSelectedText: selectedText, lastTranslatedMorse: morse });
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Morse Code Translated',
      message: morse.substring(0, 100) + (morse.length > 100 ? '...' : '')
    });
  } else if (info.menuItemId === 'morse_decode_selection') {
    const text = morseToText(selectedText);
    chrome.storage.local.set({ lastSelectedMorse: selectedText, lastTranslatedText: text });
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Morse Code Decoded',
      message: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
  }
});
