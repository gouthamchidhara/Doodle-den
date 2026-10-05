// On-device speech → short color name for Big mode (A5 Naming mic). Blocklist-checked, max 20 chars.
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useState } from 'react';

import { isTextAllowed } from '@/content/blocklist';
import { MAX_SPOKEN_NAME } from '@/content/colorNames';

// Cleans a transcript into a Title Case name; null when blocked or empty.
export function cleanSpokenName(text: string): string | null {
  const t = text.replace(/[^a-zA-Z ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_SPOKEN_NAME).trim();
  if (!t || !isTextAllowed(t)) return null;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Listening state and the last accepted name.
export function useSpeechName() {
  const [listening, setListening] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useSpeechRecognitionEvent('result', (e) => {
    if (!e.isFinal) return;
    const n = cleanSpokenName(e.results[0]?.transcript ?? '');
    setBlocked(n === null);
    setName(n);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', () => setListening(false));

  // Starts on-device listening (asks for mic + speech permission the first time).
  const listen = async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return;
      setBlocked(false);
      setListening(true);
      ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false, requiresOnDeviceRecognition: ExpoSpeechRecognitionModule.supportsOnDeviceRecognition() });
    } catch (e) {
      console.warn('[mixing] speech failed', e);
      setListening(false);
    }
  };

  return { listening, name, blocked, listen, clear: () => setName(null) };
}
