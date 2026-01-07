import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, { message: 'Must contain at least 8 characters.' })
  .regex(/[a-zA-Z]/, { message: 'Must contain at least one letter.' })
  .regex(/[0-9]/, { message: 'Must contain at least one number.' })
  .regex(/[^a-zA-Z0-9]/, {
    message: 'Must contain at least one special character.',
  })
  .trim();

const login = z.object({
  email: z.email({ message: 'Please enter a valid email address.' }).trim(),
  password: z.string().min(1, 'Password is required'),
});

const register = z.object({
  email: z.email({ message: 'Please enter a valid email address.' }).trim(),
  password: passwordSchema,
});

const authSchema = {
  login,
  register,
};

export default authSchema;
