// Lock check used at startup; the real lock engine is wired in T-033.

// Returns whether the kid is currently locked.
export async function startupLockCheck(kidId: string): Promise<boolean> {
  void kidId;
  return false;
}
