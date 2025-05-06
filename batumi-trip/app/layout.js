import '@/styles/globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Batumi Trip',
  description: 'SPA для совместного планирования путешествия друзей в Батуми',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
