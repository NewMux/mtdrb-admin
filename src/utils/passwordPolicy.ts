export interface PasswordPolicy {
  minLength: number;
  requireSpecialChars: boolean;
}

// Used wherever no tenant is known yet (e.g. a brand-new gym owner signing
// up - there's no gym_settings row to configure a policy in until the
// tenant exists).
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireSpecialChars: false,
};

const SPECIAL_CHARS_PATTERN = /[!@#$%^&*(),.?":{}|<>[\]\\/~`_\-+=;']/;

// Returns an error message if the password violates the policy, or null if
// it's valid.
export function validatePassword(
  password: string,
  policy: PasswordPolicy,
): string | null {
  if (password.length < policy.minLength) {
    return `Password must be at least ${policy.minLength} characters`;
  }
  if (policy.requireSpecialChars && !SPECIAL_CHARS_PATTERN.test(password)) {
    return "Password must include at least one special character";
  }
  return null;
}
