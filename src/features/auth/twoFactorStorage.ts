export type TwoFactorChallengeState = {
  challengeId: string;
  email?: string | null;
  redirectTo?: string | null;
};

const STORAGE_KEY = "x-bid:twofactor";

export const saveTwoFactorChallenge = (state: TwoFactorChallengeState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
};

export const readTwoFactorChallenge = (): TwoFactorChallengeState | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TwoFactorChallengeState;
    if (!parsed?.challengeId) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearTwoFactorChallenge = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
};
