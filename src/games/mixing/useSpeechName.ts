// On-device speech → a short name (colors: max 20 chars, creatures: max 12). Blocklist-checked.
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useState } from 'react';

import { isTextAllowed } from '@/content/blocklist';
import { MAX_SPOKEN_NAME } from '@/content/colorNames';

// Cleans a transcript into a Title Case name; null when blocked or empty.
export function cleanSpokenName(text: string, max = MAX_SPOKEN_NAME): string | null {
  const t = text.replace(/[^a-zA-Z ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim();
  if (!t || !isTextAllowed(t)) return null;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Listening state and the last accepted name.
export function useSpeechName(max = MAX_SPOKEN_NAME) {
  const [listening, setListening] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useSpeechRecognitionEvent('result', (e) => {
    if (!e.isFinal) return;
    const n = cleanSpokenName(e.results[0]?.transcript ?? '', max);
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
