// Snapshot and behavior tests for shared kid components (T-004).
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ActivityTile } from '@/components/kid/ActivityTile';
import { BrushSizeButton } from '@/components/kid/BrushSizeButton';
import { ColorDot } from '@/components/kid/ColorDot';
import { IconButton } from '@/components/kid/IconButton';
import { HomeIcon } from '@/components/kid/icons/HomeIcon';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { TimePill, timePillText } from '@/components/kid/TimePill';
import { ToolButton } from '@/components/kid/ToolButton';

async function snap(el: ReactElement) {
  const r = await render(el);
  return r.toJSON();
}

describe('kid components', () => {
  it('IconButton snapshot + press', async () => {
    const onPress = jest.fn();
    expect(await snap(<IconButton icon={<HomeIcon />} accessibilityLabel="Home" onPress={onPress} />)).toMatchSnapshot();
    await fireEvent.press(screen.getByLabelText('Home'));
    expect(onPress).toHaveBeenCalled();
  });

  it('PrimaryButton snapshot', async () => {
    expect(await snap(<PrimaryButton label="I'm done!" />)).toMatchSnapshot();
  });

  it('TimePill text never shows seconds and goes sleepy under 5 min', async () => {
    expect(timePillText(25)).toBe('25 min of play left');
    expect(timePillText(5)).toBe('5 min of play left');
    expect(timePillText(4.9)).toBe('Getting sleepy…');
    expect(await snap(<TimePill minutesLeft={25} />)).toMatchSnapshot();
    expect(await snap(<TimePill minutesLeft={3} />)).toMatchSnapshot();
  });

  it('ActivityTile: locked tile does not call onPress', async () => {
    const onPress = jest.fn();
    const onLockedPress = jest.fn();
    await render(
      <ActivityTile title="Magic" tint="grape" icon={<HomeIcon />} locked onPress={onPress} onLockedPress={onLockedPress} />,
    );
    await fireEvent.press(screen.getByLabelText('Magic'));
    expect(onPress).not.toHaveBeenCalled();
    expect(onLockedPress).toHaveBeenCalled();
  });

  it('ActivityTile snapshot with badge', async () => {
    expect(await snap(<ActivityTile title="Aquarium" tint="sky" badge="NEW" icon={<HomeIcon />} />)).toMatchSnapshot();
  });

  it('SpeechBubble, ToolButton, ColorDot, BrushSizeButton snapshots', async () => {
    expect(await snap(<SpeechBubble text="Hi!" />)).toMatchSnapshot();
    expect(await snap(<ToolButton tool="crayon" selected />)).toMatchSnapshot();
    expect(await snap(<ToolButton tool="eraser" selected={false} />)).toMatchSnapshot();
    expect(await snap(<ColorDot color="tomato" selected />)).toMatchSnapshot();
    expect(await snap(<ColorDot color="rainbow" selected={false} />)).toMatchSnapshot();
    expect(await snap(<BrushSizeButton size="M" selected />)).toMatchSnapshot();
  });
});
