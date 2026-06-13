'use server';

import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function loginOrSignup(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const mode = formData.get('mode') as string; // 'login' or 'signup'

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const hashedPassword = hashPassword(password);

  try {
    if (mode === 'signup') {
      // Sign up — create a new user
      if (!name) {
        return { error: 'Name is required for sign up' };
      }

      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        return { error: 'An account with this email already exists. Please log in instead.' };
      }

      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });

      await setSession(user.id);
    } else {
      // Login — verify credentials
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.password !== hashedPassword) {
        return { error: 'Invalid email or password' };
      }

      await setSession(user.id);
    }
  } catch (e: any) {
    console.error('Auth error:', e);
    return { error: 'A database error occurred. If on Vercel, SQLite writes may be restricted.' };
  }

  redirect('/dashboard');
}
