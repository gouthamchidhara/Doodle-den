// Mascot renders every mood (T-005).
import { render } from '@testing-library/react-native';

import { Mascot, type MascotMood } from '@/components/kid/Mascot';

describe('Mascot', () => {
  it.each<MascotMood>(['idle', 'happy', 'sleepy', 'sleeping'])('renders %s', async (mood) => {
    const r = await render(<Mascot mood={mood} size={80} />);
    expect(r.toJSON()).toMatchSnapshot();
  });
});
