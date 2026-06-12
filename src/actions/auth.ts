'use server';

import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginOrSignup(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { name, email },
    });
  }

  await setSession(user.id);
  redirect('/dashboard');
}
