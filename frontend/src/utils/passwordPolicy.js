/**
 * The password policy, in one place.
 *
 * Must stay in step with the validator on the User model
 * (backend/src/models/user.model.js: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/). The create-user
 * form used to ask for "min 6 characters" while the model demanded 8 with an uppercase, a
 * lowercase and a number, so a password the form accepted was rejected by the server afterwards —
 * and the failure landed on the user-creation step, once the form had already moved on.
 */
export const PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";

export const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "uppercase", label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { key: "lowercase", label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "One number (0–9)", test: (v) => /\d/.test(v) },
];

export const isStrongPassword = (value = "") => PASSWORD_RULES.every((rule) => rule.test(value));

/**
 * Drop into a Form.Item's `rules` next to `{ required: true }` — an empty box is left to the
 * required rule, so the whole policy is not shouted at someone who has not typed yet.
 */
export const passwordRule = {
  validator: (_, value) =>
    !value || isStrongPassword(value) ? Promise.resolve() : Promise.reject(new Error(PASSWORD_MESSAGE)),
};
