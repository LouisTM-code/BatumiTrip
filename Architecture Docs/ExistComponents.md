# **Справочник компонентов и хуков BatumiTrip**

> Этот документ является единым источником истины (source of truth) о текущей структуре и состоянии кода проекта Batumi Trip. Он служит опорой для AI‑генератора кода и всей команды разработчиков, предоставляя детальные описания существующих компонентов, хуков и утилит. Используя этот справочник, AI сможет корректно генерировать и модифицировать код, опираясь на актуальные реализации и внутренние соглашения по стилю.

---
## Актуальный код и описание компонентов

### Layout.js

* **Назначение:** Глобальный макет приложения, оборачивающий все страницы. Отвечает за установку провайдеров (React Query Provider, Context для темы), проверку авторизации и рендеринг общих элементов интерфейса (например, `Header` и `LoginModal`).
* **Пропсы:** `children: ReactNode` — содержимое страницы.
* **Взаимодействие:** Использует хук `useAuth` для проверки сессии пользователя при загрузке страницы. Если пользователь не авторизован, отображает кнопку входа в `Header`. Включает в разметку компоненты `Header` и `LoginModal`.
* **Используемые библиотеки:** Tailwind CSS для стилей макета и фреймворк шрифтов, Context API для передачи темы или локали. В качестве анимации при переходах может использоваться Framer Motion (например, анимированный переключатель страниц).
**Актаульный код Layout.js:**
```js
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
```

---
### `route.js` — NextAuth‑эндпоинт `app/api/auth/[...nextauth]/route.js`
* **Назначение:** Обрабатывает все HTTP‑запросы NextAuth (`GET`, `POST`) и конфигурирует password‑less аутентификацию через Credentials Provider. Создаёт пользователя в таблице `users`, если тот входит впервые.
* **Пропсы:** Файл не экспортирует React‑компонент, поэтому пропсов нет.
* **Взаимодействие:**
  * При `authorize()` апсёртит логин в Supabase `users`.
  * В callback’ах прописывает `token.id` → `session.user.id`, чтобы RLS‑политики «знали» текущего пользователя (см. DataModel‑BatumiTrip.md § 5).
* **Используемые библиотеки:** `next-auth`, `@supabase/supabase-js`, встроенный `Credentials` provider, dotenv‑переменная `NEXTAUTH_SECRET`.
**Актаульный код route.js:**
```js
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
```

---
### AuthProvider.js
* **Назначение:** Оборачивает React‑дерево в `<SessionProvider>`, передавая вниз данные сессии NextAuth.&#x20;
* **Пропсы:** `children: ReactNode`.
* **Взаимодействие:** Используется внутри `Providers.js`; обеспечивает доступ к `useSession()` во всех дочерних компонентах.
* **Используемые библиотеки:** `next-auth/react` (SessionProvider), React.
**Актаульный код AuthProvider.js:**
```js
'use client';
import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```
---
### LoginModal.js

* **Назначение:** Показывает диалог с единственным текстовым полем для логина и кнопкой «Войти». После отправки инициирует `signIn('credentials')`.
* **Пропсы:** Нет; видимость контролируется глобальным Zustand‑стором `uiStore`.
* **Взаимодействие:**

  * Читает `showLoginModal` и `setLoginModal` из Zustand.
  * По `onSubmit` вызывает `signIn`, затем закрывает модалку.
  * При открытии/закрытии использует компоненты `Dialog*` из **shadcn**.
* **Используемые библиотеки:** `next-auth/react`, Zustand, **shadcn** (`Dialog`, `Input`, `Button`), React.
**Актаульный код LoginModal.js:**
```js
'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';

export default function LoginModal() {
  const show    = useUIStore((s) => s.showLoginModal);
  const setShow = useUIStore((s) => s.setLoginModal);
  const [login, setLogin] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!login.trim()) return;
    await signIn('credentials', { username: login, redirect: false });
    setShow(false);              // закрыть модалку после успешного входа
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Войти без пароля</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Введите логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />

          <DialogFooter>
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---
### Providers.js

* **Назначение:** Единожды инициализирует `QueryClient`, оборачивает приложение в React Query, Auth и Theme провайдеры; подключает Devtools в dev‑среде.&#x20;
* **Пропсы:** `children: ReactNode`.
* **Взаимодействие:**

  * Создаёт `queryClient` через `createQueryClient()` (см. `lib/reactQuery.js`).
  * Включает `<ReactQueryDevtools />` только если `NODE_ENV !== 'production'`.
* **Используемые библиотеки:** `@tanstack/react-query`, `@tanstack/react-query-devtools`, React, собственные `AuthProvider`, `ThemeProvider`.
**Актаульный код Providers.js:**
```js
'use client';
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { createQueryClient } from '@/lib/reactQuery';
import AuthProvider from '@/components/AuthProvider';
import ThemeProvider from '@/components/ThemeProvider';

export default function Providers({ children }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>

      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

---
### ThemeProvider.js

* **Назначение:** Делегирует управление темой пакету `next-themes`; добавляет/удаляет класс `dark` на корне документа.&#x20;
* **Пропсы:** `children: ReactNode`.
* **Взаимодействие:** Используется внутри `Providers.js`; читает/записывает тему в `localStorage` (механизм `next-themes`).
* **Используемые библиотеки:** `next-themes`, React.
**Актаульный код Providers.js:**
```js
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="black">
      {children}
    </NextThemesProvider>
  );
}
```

---
## Актуальный код и описание хуков / утилит

### Хук useAuth.js

* **Назначение:** Кастомный хук для управления сессией пользователя.
* **Функционал:** Использует NextAuth.js (`useSession`) или самостоятельно проверяет HTTP-only cookie `next-auth.session-token`. Предоставляет `user` (объект с `id`), флаг `isLoading` и методы `signIn(username)` и `signOut()`. При монтировании `useAuth` восстанавливает сессию из cookie и синхронизирует ее с глобальным состоянием (например, React Context или Zustand).
* **Использование:** Применяется в `Layout` для защиты маршрутов; в `LoginModal` для выполнения входа; в `Header` для определения, какую кнопку показывать. В связи с этим в `Layout` может вызываться `router.push('/login')`, если сессия не обнаружена.
**Актаульный код useAuth.js:**
```js
'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    signIn,
    signOut,
  };
}
```

---
### Глобальное состояние (Zustand и Context)

* **Zustand Store:** Управляет локальным UI-состоянием, не относящимся к серверу. Например:

  * `searchQuery` — текущий текст поиска (из `SearchBar`)
  * `selectedTags: string[]` — массив выбранных тегов для фильтрации
  * `showLoginModal: boolean` — флаг отображения `LoginModal`
  * `favorites: string[]` — список ID отмеченных локаций (из задачи «избранное»; может сохраняться в localStorage)
  * Методы `setSearchQuery`, `toggleTag`, `setLoginModal`, `toggleFavorite` и т.д.
* **Context API:** Используется для предоставления глобальных опций, например `ThemeContext` (светлая/темная тема) или `LocaleContext` (язык интерфейса). Обычно оборачивается в `Layout`.
**Актаульный код uiStore.js:**
```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      searchQuery: '',
      selectedTags: [],
      showLoginModal: false,
      favourites: {},

      setSearchQuery: (q) => set({ searchQuery: q }),
      toggleTag: (tag) =>
        set((s) => ({
          selectedTags: s.selectedTags.includes(tag)
            ? s.selectedTags.filter((t) => t !== tag)
            : [...s.selectedTags, tag],
        })),
      setLoginModal: (v) => set({ showLoginModal: v }),

      toggleFavourite: (id) =>
        set((s) => ({ favourites: { ...s.favourites, [id]: !s.favourites[id] } })),

      hydrateFavourites: (ids) =>
        set(() => ({ favourites: Object.fromEntries(ids.map((id) => [id, true])) })),
    }),
    {
      name: 'batumi-ui',
      partialize: (s) => ({ favourites: s.favourites }),
    }
  )
);
```

---
### reactQuery.js

* **Назначение:** Создаёт стандартизированный `QueryClient` c настройками кеша и ретраев, согласованными с документацией.&#x20;
* **Пропсы:** Не применимо (utility‑функция).
* **Взаимодействие:** Вызывается однократно в `Providers.js`; остальные хуки (`useLocations`, `useAddLocation` и др.) используют тот же экземпляр.
* **Используемые библиотеки:** `@tanstack/react-query`.
**Актаульный код reactQuery.js:**
```js
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,       // 1 минута
        gcTime: 1000 * 60 * 30,  // 30 минут
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        networkMode: 'always',
      },
    },
  });
}
```

---

### supabaseClient.js

* **Назначение:** Инициализирует и экспортирует экземпляр Supabase JS SDK с `anon`‑ключом и URL из env‑переменных.&#x20;
* **Пропсы:** —
* **Взаимодействие:** Используется в API‑роуте `route.js`, пользовательских хуках (CRUD) и загрузке изображений в Storage.
* **Используемые библиотеки:** `@supabase/supabase-js`.
**Актаульный код supabaseClient.js:**
```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

---
### utils.js

* **Назначение:** Объединяет условные классы с помощью `clsx`, а затем «склеивает» возможные дубликаты через `tailwind-merge`.&#x20;
* **Пропсы:** —
* **Взаимодействие:** Импортируется во всех React‑компонентах, где нужно динамически формировать className.
* **Используемые библиотеки:** `clsx`, `tailwind-merge`.
**Актаульный код utils.js:**
```js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---
