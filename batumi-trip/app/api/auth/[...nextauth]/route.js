import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabaseClient';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Login',
      credentials: {
        username: { label: 'Логин', type: 'text', placeholder: 'ivan' },
      },
      async authorize(creds) {
        const username = creds?.username?.trim();
        const re = /^[A-Za-z\u0400-\u04FF]{3,32}$/; // допустимые символы

        if (!username || !re.test(username)) return null;

        const { error } = await supabase
          .from('users')
          .upsert({ id: username }, { onConflict: 'id' });

        if (error) {
          console.error('Supabase upsert error', error);
          return null;
        }
        return { id: username };
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 }, // 30 дней

  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token?.id) session.user = { id: token.id };
      return session;
    },
  },

  pages: { signIn: '/' },      // остаёмся на / — LoginModal всё перекроет
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
