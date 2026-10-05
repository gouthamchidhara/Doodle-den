// Props shared by the Free Draw tablet and phone layouts.
import type { ReactNode } from 'react';

import type { useDrawingSession } from '../shared/useDrawingSession';

export interface DrawLayoutProps {
  session: ReturnType<typeof useDrawingSession>;
  canvas: ReactNode;
  onDone: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAskClear: () => void;
  onCycleBackground: () => void;
  onSpeaker: () => void;
}
