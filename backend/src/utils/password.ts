import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

const PASSWORD_MIN_LENGTH = 8;

export interface PasswordStrengthResult {
  valid: boolean;
  reasons: string[];
}

/**
 * Validates password strength beyond the basic zod schema check, ensuring
 * a mix of character classes for stronger operator/admin credentials.
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const reasons: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    reasons.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  if (!/[a-z]/.test(password)) {
    reasons.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    reasons.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    reasons.push('Password must contain at least one number');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    reasons.push('Password must contain at least one special character');
  }

  return { valid: reasons.length === 0, reasons };
}

export function generateRandomPassword(length = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

export default {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateRandomPassword,
};
