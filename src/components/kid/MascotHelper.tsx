// Canvas-corner mascot (A5/A7): tap → "Guess my drawing!", "Give me an idea!" and, with 10+ strokes, "Magic!".
// Without Magic (no consent / offline) it offers a local drawing idea instead.
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { coachIdea, GUESS_GAP_MS, GUESS_MIN_STROKES, guessLine, IDEA_GAP_MS, MAGIC_MIN_STROKES, randomIdea, ready } from '@/games/mascot/mascotAi';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { getCoachIdea, guessDrawing, mascotLineFor } from '@/services/ai';
import { playSound } from '@/services/audio';
import { useAiStatus } from '@/services/useAiStatus';
import { say, sayText } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';
import { space } from '@/theme/tokens';

import { MascotCorner } from './MascotCorner';
import { PrimaryButton } from './PrimaryButton';

export interface MascotHelperProps {
  strokes: number;
  getImage: () => Promise<string>; // 512 px PNG base64 on white
  onMagic?: () => void;
}

type Mode = 'closed' | 'menu' | 'thinking' | 'asking';

// Mascot + bubbles.
export function MascotHelper({ strokes, getImage, onMagic }: MascotHelperProps) {
  const ai = useAiStatus();
  const kidId = useSessionStore((s) => s.activeKidId);
  const ageMode = useSessionStore((s) => s.ageMode);
  const [mode, setMode] = useState<Mode>('closed');
  const [bubble, setBubble] = useState<{ text: string; voice?: string; id: number } | null>(null);
  const lastGuess = useRef<number | null>(null);
  const lastIdea = useRef<number | null>(null);
  const counter = useRef(0);
  const clear = useCallback(() => setBubble(null), []);
  const show = (text: string, voice?: string) => {
    counter.current += 1;
    setBubble({ text, voice, id: counter.current });
  };

  const tap = () => {
    if (!ai.consented || !ai.online) {
      const idea = randomIdea();
      show(idea.text, idea.voice);
      return;
    }
    setMode((m) => (m === 'menu' ? 'closed' : 'menu'));
  };

  const doGuess = async () => {
    const now = Date.now();
    if (strokes < GUESS_MIN_STROKES || !ready(lastGuess.current, now, GUESS_GAP_MS)) {
      show('Draw a little more first!');
      setMode('closed');
      return;
    }
    lastGuess.current = now;
    setMode('thinking');
    show('Hmm, let me think…', 'mascot_thinking');
    const [r] = await Promise.all([guessDrawing({ ageMode, imageBase64: await getImage() }), new Promise((res) => setTimeout(res, 2000))]);
    if (!r.ok) {
      const line = mascotLineFor(r.code);
      show(line.text, line.voice);
      setMode('closed');
      return;
    }
    const line = guessLine(r.data.guesses);
    playSound('giggle');
    sayText(line);
    show(line);
    setMode('asking');
  };

  const answer = (yes: boolean) => {
    setMode('closed');
    if (yes) {
      playSound('cheer');
      say('mascot_yay');
      show('Yay! I got it!');
      if (kidId) void checkRewards(kidId, 'GUESS_YES');
    } else {
      say('mascot_silly_me');
      show('Silly me!');
    }
  };

  const doIdea = async () => {
    const now = Date.now();
    setMode('closed');
    if (!ready(lastIdea.current, now, IDEA_GAP_MS)) {
      const idea = randomIdea();
      show(idea.text, idea.voice);
      return;
    }
    lastIdea.current = now;
    const r = await getCoachIdea({ ageMode, imageBase64: await getImage() });
    const idea = r.ok ? coachIdea(r.data.id) : randomIdea();
    show(idea.text, idea.voice);
  };

  return (
    <>
      {mode === 'menu' || mode === 'asking' ? (
        <View style={styles.menu} pointerEvents="box-none">
          {mode === 'menu' ? (
            <>
              <PrimaryButton label="Guess my drawing!" onPress={() => void doGuess()} />
              <PrimaryButton label="Give me an idea!" onPress={() => void doIdea()} />
              {onMagic && strokes >= MAGIC_MIN_STROKES ? <PrimaryButton label="Magic!" tone="tomato" onPress={() => (setMode('closed'), onMagic())} /> : null}
            </>
          ) : (
            <>
              <PrimaryButton label="Yes!" onPress={() => answer(true)} />
              <PrimaryButton label="No!" tone="tomato" onPress={() => answer(false)} />
            </>
          )}
        </View>
      ) : null}
      <MascotCorner bubble={bubble} onPress={tap} onBubbleDone={clear} mood={mode === 'thinking' ? 'sleepy' : 'idle'} />
    </>
  );
}

const styles = StyleSheet.create({
  menu: { position: 'absolute', right: space.md, bottom: 80, alignItems: 'flex-end', gap: space.sm },
});
