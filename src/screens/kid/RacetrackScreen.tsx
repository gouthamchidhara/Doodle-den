// Racetrack world (A5): cars cruise their lanes; Go! = a 3-lap race where every car finishes, confetti for all, no winner.
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { PrimaryButton } from "@/components/kid/PrimaryButton";
import { SparkleBurst } from "@/components/kid/SparkleBurst";
import { carMotion, raceSeconds } from "@/games/worlds/racetrack/carMotion";
import { RacetrackBackground } from "@/games/worlds/racetrack/RacetrackBackground";
import { SAMPLE_CAR_ID, SampleCar } from "@/games/worlds/racetrack/SampleCar";
import { spriteParams } from "@/games/worlds/spriteParams";
import { useWorldCreatures } from "@/games/worlds/useWorldCreatures";
import { WORLDS } from "@/games/worlds/worldConfig";
import { WorldScreen } from "@/games/worlds/WorldScreen";
import { playSound } from "@/services/audio";
import { say } from "@/services/voice";

import { useIntroVoice } from "./shared/useIntroVoice";

const cfg = WORLDS.racetrack;
const COUNTDOWN_SEC = 1;
const PARK_SEC = 3;

// Total race length for a set of cars (the slowest one decides).
export function raceLength(
  ids: string[],
  width: number,
  height: number,
): number {
  return Math.max(
    0,
    ...ids.map((id) => raceSeconds(spriteParams(id), width, height)),
  );
}

// Racetrack screen.
export function RacetrackScreen() {
  useIntroVoice("intro_racetrack");
  const ext = useSharedValue<number[]>([]);
  const clock = useSharedValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [racing, setRacing] = useState(false);
  const [party, setParty] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { onScreen } = useWorldCreatures(cfg.key, cfg.max);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const go = () => {
    if (racing || size.w === 0) return;
    const len = raceLength(
      onScreen.length > 0 ? onScreen.map((c) => c.entity.id) : [SAMPLE_CAR_ID],
      size.w,
      size.h,
    );
    const t0 = clock.get() + COUNTDOWN_SEC;
    ext.set([t0, t0 + len + PARK_SEC]);
    setRacing(true);
    playSound("vroom");
    timer.current = setTimeout(
      () => {
        setParty((n) => n + 1);
        playSound("cheer");
        say("mascot_great_job");
        setRacing(false);
      },
      (COUNTDOWN_SEC + len) * 1000,
    );
  };

  return (
    <WorldScreen
      cfg={cfg}
      motion={carMotion}
      ext={ext}
      clock={clock}
      onSize={(w, h) => setSize({ w, h })}
      background={(w, h) => <RacetrackBackground width={w} height={h} />}
      foreground={(w, h) => (
        <>
          {onScreen.length === 0 ? <SampleCar width={w} height={h} clock={clock} ext={ext} /> : null}
          {party > 0 ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <SparkleBurst key={party} radius={size.w * 0.4} />
            </View>
          ) : null}
        </>
      )}
      extraButton={
        <PrimaryButton
          label="Go!"
          disabled={racing || size.w === 0}
          onPress={go}
        />
      }
    />
  );
}
