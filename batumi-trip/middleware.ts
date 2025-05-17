// файл: middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ——— Legacy-редирект: все /locations/{rest} → /destination/__root__/locations/{rest}
  const legacyMatch = pathname.match(/^\/locations\/(.*)$/);
  if (legacyMatch) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/destination/__root__/locations/${legacyMatch[1]}`;
    return NextResponse.redirect(redirectUrl, 302);
  }

  // 1) Пропускаем публичные маршруты и статику
  if (
    pathname.startsWith('/api/auth') ||  // эндпоинты NextAuth
    pathname === '/' ||                  // главная (login modal)
    pathname.startsWith('/_next') ||     // внутренние файлы Next.js
    pathname.startsWith('/static') ||    // статика
    pathname.includes('.')               // файлы типа *.css, *.js, *.png и т.п.
  ) {
    return NextResponse.next();
  }

  // 2) Проверяем наличие валидного JWT в HTTP-only cookie
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 3) Если токена нет — редирект на главную (login modal)
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/';
    return NextResponse.redirect(loginUrl);
  }

  // 4) Иначе — пропускаем дальше
  return NextResponse.next();
}

// Применяем middleware к legacy-маршрутам /locations/*
export const config = {
  matcher: [
    '/locations/new',       // существующее правило (create)
    '/locations/(.*)',      // новое правило для всех legacy-deep-links
  ],
};
