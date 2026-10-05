// "Forgot PIN?" handling. With a parent account (T-071) a magic-link sign-in resets the PIN.
type AlertFn = (title: string, message?: string) => void;

// Explains how to reset the PIN.
export async function forgotPin(alert: AlertFn): Promise<void> {
  alert(
    'Reset your PIN',
    'Without a parent account the only way to reset the PIN is to delete and reinstall the app. Art that is not backed up will be lost.',
  );
}
