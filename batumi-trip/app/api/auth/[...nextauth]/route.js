// файл: app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabaseClient';

export const authOptions = {
  // 1) Провайдер Credentials без пароля
  providers: [
    CredentialsProvider({
      name: '',
      credentials: {
        username: { label: 'Как мне стоит тебя называть?🧐', type: 'text', placeholder: 'Введите имя' },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        if (!username) return null;

        // 1. Добавление или обновление пользователя в Supabase
        const { error } = await supabase
          .from('users')
          .upsert({ id: username }, { returning: 'minimal' });
        if (error) {
          console.error('Ошибка при upsert пользователя:', error);
          throw new Error('Не удалось создать пользователя');
        }

        // 2. Возвращаем объект пользователя для NextAuth
        return { id: username };
      },
    }),
  ],

  // 2) Сессии и JWT
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  // 3) Колбэки для наполнения токена и session.user
  callbacks: {
    async jwt({ token, user }) {
      // При первом логине сохраняем id пользователя в token
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      // Считываем из Supabase всю запись о пользователе
      if (token.id) {
        const { data: userRecord, error } = await supabase
          .from('users')
          .select('id, created_at, updated_at')
          .eq('id', token.id)
          .single();
        if (error) {
          console.error('Ошибка при получении пользователя:', error);
          session.user = { id: token.id };
        } else {
          session.user = userRecord;
        }
      }
      return session;
    },
  },

  // 4) Явная конфигурация HTTP-only cookie
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // 5) Secret для подписи JWT и CSRF токенов
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
