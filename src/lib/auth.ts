import { cookies } from 'next/headers';

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  return userId || null;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
}
