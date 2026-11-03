// "Forgot PIN?": with a parent account, a magic link resets the PIN; otherwise the only way is reinstalling.
import { getSupabase } from '@/services/supabase';
import { sendMagicLink } from '@/services/auth';

type AlertFn = (title: string, message?: string) => void;

// Sends the reset link or explains the reinstall route.
export async function forgotPin(alert: AlertFn): Promise<void> {
  const sb = getSupabase();
  const email = sb ? (await sb.auth.getSession()).data.session?.user.email : undefined;
  if (email && (await sendMagicLink(email, true))) {
    alert('Check your email', `We sent a link to ${email}. Open it on this device to set a new PIN.`);
    return;
  }
  alert('Reset your PIN', 'Without a parent account the only way to reset the PIN is to delete and reinstall the app. Art that is not backed up will be lost.');
}
