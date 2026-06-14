import { clearSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  await clearSession();
  const origin = request.nextUrl.origin;
  return NextResponse.redirect(`${origin}/`);
}

export async function POST(request: NextRequest) {
  await clearSession();
  const origin = request.nextUrl.origin;
  return NextResponse.redirect(`${origin}/`, 303);
}
