// Pan gesture → live stroke (A5 Input rules): one finger only, pressure from stylus, 2 px thinning.
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import type { Stroke } from '@/types/models';

import { StrokeTracker, type PanEvt, type StrokeInputOpts } from './strokeTracker';

export type { StrokeInputOpts } from './strokeTracker';

// Builds the gesture and exposes the in-progress stroke for live rendering.
export function useStrokeInput(o: StrokeInputOpts) {
  const [live, setLive] = useState<Stroke | null>(null);
  const [tracker] = useState(() => new StrokeTracker(o, setLive));

  useLayoutEffect(() => {
    tracker.setOpts(o);
  });
  useEffect(() => () => tracker.dispose(), [tracker]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .maxPointers(1)
        .runOnJS(true)
        .enabled(o.enabled)
        .onBegin((e: PanEvt) => tracker.begin(e))
        .onUpdate((e: PanEvt) => tracker.update(e))
        .onFinalize(() => tracker.end()),
    [tracker, o.enabled],
  );

  return { gesture, live };
}
