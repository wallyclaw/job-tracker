import { NextRequest, NextResponse } from 'next/server';

const AUTH_PASSWORD = process.env.JT_PASSWORD || 'cloudcode2026';
const AUTH_COOKIE = 'jt-auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === AUTH_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE, password, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
}
