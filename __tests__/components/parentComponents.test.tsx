// Parent component tests (T-006).
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { SettingRow } from '@/components/parent/SettingRow';
import { ringFraction, StatRing } from '@/components/parent/StatRing';
import { barHeight, WeekBars } from '@/components/parent/WeekBars';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({ label, minutes: [46, 52, 30, 48, 38, 0, 0][i], isToday: i === 4 }));

describe('parent components', () => {
  it('ring fraction clamps', () => {
    expect(ringFraction(32, 45)).toBeCloseTo(0.711, 2);
    expect(ringFraction(60, 45)).toBe(1);
    expect(ringFraction(5, 0)).toBe(0);
  });
  it('bar heights scale to 52 max', () => {
    expect(barHeight(52, 52)).toBe(52);
    expect(barHeight(26, 52)).toBe(26);
    expect(barHeight(0, 52)).toBe(4);
  });
  it('SettingRow press + snapshot', async () => {
    const onPress = jest.fn();
    const r = await render(<SettingRow label="Daily limit" value="45 min" onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText('Daily limit: 45 min'));
    expect(onPress).toHaveBeenCalled();
    expect(r.toJSON()).toMatchSnapshot();
  });
  it('snapshots', async () => {
    expect((await render(<ParentCard title="Play time this week"><WeekBars days={DAYS} /></ParentCard>)).toJSON()).toMatchSnapshot();
    expect((await render(<StatRing used={32} limit={45} />)).toJSON()).toMatchSnapshot();
    expect((await render(<ParentButton label="Next" />)).toJSON()).toMatchSnapshot();
    expect((await render(<ParentButton label="Back" variant="secondary" />)).toJSON()).toMatchSnapshot();
    expect((await render(<SettingRow label="Extra 2 min" toggle={{ value: true, onChange: () => undefined }} />)).toJSON()).toMatchSnapshot();
    expect((await render(<Text>ok</Text>)).toJSON()).toBeTruthy();
  });
});
