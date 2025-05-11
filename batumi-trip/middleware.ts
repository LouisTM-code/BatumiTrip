// файл: middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Разрешаем доступ к публичным маршрутам и статике
  if (
    pathname.startsWith('/api/auth') ||  // NextAuth endpoints
    pathname === '/' ||                  // главная страница (login modal)
    pathname.startsWith('/_next') ||     // внутренние файлы Next.js
    pathname.startsWith('/static') ||    // статика
    pathname.includes('.')                // файлы типа *.css, *.js, *.png и т.п.
  ) {
    return NextResponse.next();
  }

  // 2) Проверяем наличие валидного JWT в HTTP-only cookie
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 3) Если токена нет — редирект на главную (modal login)
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/';
    return NextResponse.redirect(loginUrl);
  }

  // 4) Иначе — пропускаем дальше
  return NextResponse.next();
}

// Применять middleware только к приватным страницам `/locations/*`
export const config = {
  matcher: ['/locations/new'],
};
