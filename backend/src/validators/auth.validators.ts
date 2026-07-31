import { z } from 'zod';
import { UserRole } from '../constants';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be at most 128 characters long');

export const registerSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(2, 'Employee code is required')
    .max(20, 'Employee code must be at most 20 characters'),
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().max(50).optional().default(''),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,15}$/, 'Invalid phone number')
    .optional(),
  role: z.nativeEnum(UserRole).optional(),
  department: z.string().trim().max(100).optional(),
  designation: z.string().trim().max(100).optional(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type LogoutSchema = z.infer<typeof logoutSchema>;

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  logoutSchema,
};
