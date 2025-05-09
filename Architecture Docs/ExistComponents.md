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
### LocationListPage (Главная страница списка)

* **Назначение:** Страница-лендинг, отображающая весь интерфейс поиска и просмотра списка локаций текущего пользователя.
* **Пропсы:** Нет (получает данные через хук и глобальные параметры).
* **Взаимодействие:** На странице располагаются `SearchBar`, `AddLocationButton` и `LocationList`. При загрузке инициируется хук `useLocations`, который подгружает первые локации. Пользователь может вводить текст поиска (сохраняется в Zustand), и запрос динамически фильтруется. Когда данных нет или пользователь только что вошел, `LocationList` показывает `SkeletonCard`.
* **Используемые библиотеки:** React Query (через `useLocations`), Zustand (для фильтров), shadcn для кнопок и форм, Tailwind/Framer Motion для стилей и анимаций.
**Актаульный код LocationListPage:**
```js
// app/page.js  (роут /)
import LocationList from '@/components/LocationList';
import AddLocationButton from '@/components/AddLocationButton'
import Header from '@/components/Header';

export default function LocationListPage() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <Header />
      <LocationList />
      <AddLocationButton />
    </main>
  );
}
```

---
### AddLocationPage - `app/locations/new/page.js`

* **Назначение:** Страница с формой создания новой локации.
* **Пропсы:** Нет.
* **Взаимодействие:** Содержит `LocationForm` без `initialData`. Сабмит формы вызывает `useAddLocation().mutate(data)`, а при успехе перенаправляет на детальную страницу новой локации.
* **Используемые библиотеки:** React Hook Form (или аналог) для обработки формы, shadcn для элементов формы, Tailwind для верстки.
**Актаульный код AddLocationPage:**
```js
'use client';
import React from 'react';
import LocationForm from '@/components/LocationForm';

export default function AddLocationPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Добавить локацию</h1>
      <LocationForm />
    </main>
  );
}
```

---
### Header

* **Назначение:** Навигационная панель (обычно шапка страницы) с названием приложения и кнопкой авторизации/выхода.
* **Пропсы:** Нет пропсов (информацию о пользователе получает через глобальное состояние или `useAuth`).
* **Взаимодействие:** Показывает название или логотип приложения. Если пользователь не авторизован, отображает кнопку "Войти". Нажатие на кнопку "Войти" открывает `LoginModal` (контролируется глобальным состоянием, например Zustand). Если пользователь авторизован, может показывать приветствие и кнопку "Выйти", вызывающую функцию `signOut()` из `useAuth`.
* **Используемые библиотеки:** Шаблоны стилей через Tailwind, компоненты `Button` из shadcn.
**Актаульный код Header:**
```js
"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/LoginModal";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, LogIn, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";

export default function Header({ className }) {
  const { user, signOut } = useAuth();
  const setLoginModal = useUIStore((s) => s.setLoginModal);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const handleLoginClick = () => setLoginModal(true);
  const toggleSearch = () => setSearchOpen((o) => !o);

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-30 flex w-full items-center justify-between px-4 py-3",
          "bg-primary/90 backdrop-blur-md supports-[backdrop-filter]:bg-foreground/80",
          "shadow-md text-primary-foreground",
          className
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Batumi Trip logo"
            width={150}
            height={100}
            className="object-contain"
          />
          <span className="sr-only">Batumi Trip</span>
        </Link>
        {/* Search Icon */}
        <button
          onClick={toggleSearch}
          aria-label="Поиск"
          className="p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
        >
          <Search className="h-6 w-6" aria-hidden="true" />
        </button>
        {/* Auth section */}
        {user ? (
          <div className="flex items-center gap-4">
            <span className="select-none text-base font-semibold">
              {user.id}
            </span>
            <Button
              size="md"
              variant="secondary"
              onClick={() => signOut()}
              aria-label="Выйти"
              className="gap-2 px-4 py-2"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span className="not-sr-only">Выйти</span>
            </Button>
          </div>
        ) : (
          <Button
            size="md"
            onClick={handleLoginClick}
            aria-label="Войти"
            className="gap-2 px-4 py-2"
          >
            <LogIn className="h-5 w-5" aria-hidden="true" />
            <span className="not-sr-only">Войти</span>
          </Button>
        )}
      </motion.header>
      {/* Search bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-4 py-2 flex justify-end">
              <SearchBar placeholder="Найти локацию..." />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LoginModal />
    </>
  );
}
```
---
### SearchBar

* **Назначение:** Поле поиска по заголовкам
* **Пропсы:** Опционально `placeholder: string` (текст подсказки).
* **Взаимодействие:** Пользователь вводит текст, он сохраняется в глобальном состоянии (например, Zustand) как текущий поисковый запрос (`searchQuery`). Поисковое состояние используют `useLocations` или компонент списка для фильтрации вывода. Возможна функциональность debounce (задержка поиска после ввода) для оптимизации запросов.
* **Используемые библиотеки:** shadcn (`Input`), Tailwind для стилей, Zustand для хранения `searchQuery`. Framer Motion для анимации появления
**Актаульный код SearchBar:**
```js
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
/**
 * SearchBar — поле ввода для поиска локаций по заголовку и тегам.
 * Самостоятельно сохраняет текст запроса в global‑store (Zustand).
 *
 * Props:
 *  @param {string} [placeholder] — текст плейсхолдера ввода (по умолчанию «Поиск локаций…»)
 */
export default function SearchBar({ placeholder = "Поиск локаций…", className }) {
  /* Глобальный Zustand store */
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  /* Локальное состояние ввода */
  const [value, setValue] = useState(searchQuery);
  /* Debounce (1000 мс) перед обновлением Zustand */
  useEffect(() => {
    const id = window.setTimeout(() => {
      // Обновляем global‑state только если строка изменилась
      if (value !== searchQuery) {
        setSearchQuery(value);
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [value, searchQuery, setSearchQuery]);
  /* Сбрасываем локальный инпут, если глобальное состояние поменялось извне */
  useEffect(() => {
    if (searchQuery !== value) setValue(searchQuery);
  }, [searchQuery]);

  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поле поиска локаций"
        className="w-full" // Tailwind: растягиваем на 100 %
      />
    </motion.div>
  );
}
```

---
### AddLocationButton

* **Назначение:** Кнопка для перехода к форме создания новой локации.
* **Пропсы:** Нет (или `onClick?: () => void` если не использует навигацию по ссылке).
* **Взаимодействие:** На главной странице располагается в удобном месте (например, в шапке или снизу). При нажатии переводит на маршрут `/locations/new`. Использует Next.js `<Link>` или `useRouter().push`. Может быть всегда видимой при прокрутке страницы (fixed position).
* **Используемые библиотеки:** shadcn (`Button`), Tailwind для стилизации.
**Актаульный код AddLocationButton:**
```js
'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AddLocationButton({ className = '' }) {
  return (
    <Button
      asChild
      className={`fixed bottom-4 right-4 sm:static flex items-center gap-2 ${className}`}
      aria-label="Добавить локацию"
    >
      <Link href="/locations/new">
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Добавить локацию</span>
      </Link>
    </Button>
  );
}
```

---
### LocationList (список локаций)

* **Назначение:** Контейнер для отображения коллекции карточек локаций с поддержкой бесконечной прокрутки.
* **Пропсы: нет** — компонент **всегда** забирает данные через кастомный хук `useLocations()` это исключает неоднозначность API и упрощает автогенерацию.
* **Взаимодействие:** 
  * При монтировании вызывает useLocations() (useInfiniteQuery) и получает локации, отфильтрованные по searchQuery и selectedTags из Zustand.
  * При прокрутке до конца списка вызывает fetchNextPage() для подгрузки данных (infinite scroll).
  * Во время загрузки отображает SkeletonCard. Для каждой локации рендерит LocationCard.
* **Используемые библиотеки:** React Query для запросов к API, Framer Motion для анимации появления новых карточек, Tailwind для сетки/стилей.
**Актаульный код LocationList:**
```js
"use client";

import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useLocations } from "@/hooks/useLocations";
import SkeletonCard from "@/components/SkeletonCard";
import LocationCard from "@/components/LocationCard";

/**
 * LocationList — контейнер для списка карточек локаций.
 * При монтировании вызывает useLocations() (useInfiniteQuery).
 * Пока isLoading — рендерит несколько SkeletonCard.
 * Затем выводит LocationCard для каждой локации.
 * При скролле до конца (Intersection Observer) — вызывает fetchNextPage().
 */
const LocationList = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLocations();
  const { ref, inView } = useInView();

  // При появлении таргета вьюпорт вызывает загрузку следующей страницы
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) {
    // Рендерим 6 скелетонов пока идёт загрузка :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Ошибка загрузки локаций</div>;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.pages.map(page =>
          page.items.map(location => (
            <LocationCard key={location.id} location={location} />
          ))
        )}
      </div>
      {/* Целевая точка для Intersection Observer */}
      <div ref={ref} className="py-8 text-center">
        {isFetchingNextPage
          ? "Загрузка..."
          : hasNextPage
          ? "Прокрутите вниз для загрузки новых"
          : "Больше нет локаций"}
      </div>
    </>
  );
};

export default LocationList;

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
"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginModal() {
  const show = useUIStore((s) => s.showLoginModal);
  const setShow = useUIStore((s) => s.setLoginModal);
  const { status } = useSession();

  const [error, setError] = useState("");
  const [login, setLogin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Закрыть при авторизации
  useEffect(() => {
    if (status === "authenticated") setShow(false);
  }, [status, setShow]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = login.trim();
    const re = /^[A-Za-z\u0400-\u04FF]{3,32}$/;
    if (!re.test(trimmed)) {
      setError(
        "Неверное имя: только буквы латиницы и кириллицы, без цифр и спецсимволов, 3–32 символа."
        );
      return;
    }
    setIsSubmitting(true);
    await signIn("credentials", {
      username: trimmed,
      redirect: false,
    });
    setIsSubmitting(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <Dialog open={show} onOpenChange={setShow}>
          <DialogPortal>                                  {/* ① */}
            <DialogOverlay />                              {/* ② */}
            <DialogContent>                                {/* ③ */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-card text-card-foreground rounded-xl shadow-lg w-full max-w-sm overflow-hidden"
              >
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle className="text-center text-xl font-semibold">
                    Войти без пароля
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 px-6 pb-6 pt-4"
                  aria-label="Форма входа"
                >
                  <Input
                    id="username"
                    placeholder="Ваш логин"
                    autoComplete="username"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-red-100 border border-red-300 text-red-800 rounded p-2 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Входим…" : "Войти"}
                    </Button>
                  </DialogFooter>
                </form>
              </motion.div>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
```

---
### LocationCard

* **Назначение:** Карточка-превью локации, отображающая краткую информацию (изображение, заголовок, часть описания, теги, стоимость). При клике ведет на детальную страницу локации.
* **Пропсы:**
  * `id: string` — идентификатор локации.
  * `title: string` — заголовок локации.
  * `description: string` — краткое описание.
  * `imageUrl: string` — URL изображения.
  * `tags: string[]` — список названий тегов.
  * `cost?: string` — стоимость или ценовая категория.
  * `isFavourite?: boolean` — локация в избранном
* **Контракты:** Передаваемые пропсы формируются из данных API (Supabase) по таблице `locations` с объединением тегов.
* **Взаимодействие:** 
  * При рендере отображает картинку (с обрезкой по размеру), заголовок, первые 2–3 строки описания и `TagBadge` для каждого тега, иконку `избранное`⭐ (filled / outline).
  * При наведении или загрузке карточка может слегка масштабироваться или появляться с анимацией Framer Motion (повышенный UX). По клику на карточку или кнопку "Подробнее" вызывает `router.push('/locations/${id}')`.
  * Клик по иконке вызывает хук useToggleFavourite(id) →
  – если не было любимо, POST /rest/v1/favourites (или RPC add_favourite)
  – если было, DELETE /rest/v1/favourites?user_id=eq.{uid}&location_id=eq.{id}. Хук оптимистично обновляет favourites в Zustand и invalidates ['favourites', userId].
* **Используемые библиотеки:** Tailwind для макета карточки, shadcn для типографики и кнопок внутри карточки, Framer Motion для анимации появления (fade-in, scale).
**Актаульный код LocationCard:**:
```js
"use client";
import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import TagBadge from "@/components/TagBadge";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

const LocationCard = ({ location }) => {
  const { id, title, description, imgUrl, tags = [], isFavourite } = location;
  // текущее состояние фильтра  
  const selectedTags = useUIStore((s) => s.selectedTags);
  // карточка видна, только если содержит ВСЕ выбранные теги
  const matchesFilter =
    selectedTags.length === 0 ||
    selectedTags.every((tag) => tags.includes(tag));

  if (!matchesFilter) return null;           

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-2xl bg-white p-4 shadow transition-shadow"
    >
      <Link href={`/locations/${id}`}>
        <Image
          src={imgUrl || "https://cataas.com/cat/gif"}
          alt={title}
          width={400}
          height={240}
          className="h-40 w-full rounded-lg object-cover"
        />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">
          {description}
        </p>
      </Link>
      {/* теги — теперь без пропа onClick, TagBadge управляет фильтром сам */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagBadge key={tag} name={tag} />
        ))}
      </div>

      <div
        className={cn(
          "absolute top-4 right-4 rounded-full p-2 shadow",
          isFavourite && "text-yellow-500"
        )}
        aria-label={
          isFavourite ? "Удалено из избранного" : "Добавлено в избранное"
        }
      >
        <Star size={20} />
      </div>
    </motion.div>
  );
};
export default memo(LocationCard);
```

---
### TagBadge

* **Назначение:** Визуальный компонент для отображения отдельного тега (например, категории) локации.
* **Пропсы:** `name: string` — текст тега. Возможно `onClick?: (tag: string) => void` для обработки клика.
* **Контракты:** Получает имя тега из данных. Теги формируются из таблицы `tags` или через запрос связей `locations_tags`.
* **Взаимодействие:** Показывает слово в рамке или подложке (badge), стиль — фоновый цвет и скругления через Tailwind. При клике (если задан `onClick`) может обновлять глобальное состояние фильтра (Zustand), чтобы отфильтровать список по выбранному тегу. Используется внутри `LocationCard` и `LocationDetail`.
* **Используемые библиотеки:** Tailwind для стиля бейджа, shadcn возможен для Badge-стиля, Framer Motion — опционально для эффекта наведения.
**Актаульный код TagBadge:**
```js
"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
/**
 * Бейдж‑тег, который сам переключает фильтр.
 * Выбранные теги берём из Zustand, поэтому отдельный
 * prop `onClick` больше не нужен.
 */
export default function TagBadge({ name, className }) {
  // селектор через zustand — важно, чтобы объект не пересоздавался лишний раз
  const selectedTags =  useUIStore((s) => s.selectedTags);
  const toggleTag = useUIStore((s) => s.toggleTag);
  const isActive = selectedTags.includes(name);

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleTag(name);
      }}
      role="button"
      aria-pressed={isActive}
      aria-label={`Фильтр по тегу «${name}»`}
      className={cn(
        // базовые стили
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium select-none transition",
        // состояние
        isActive
          ? "bg-secondary text-secondary-foreground border-secondary"
          : "bg-muted text-muted-foreground border-border hover:bg-secondary/20",
        className
      )}
    >
      {name}
    </motion.span>
  );
}
```
---
### ChooseTag

* **Назначение:** компонент множественного выбора/добавления тегов внутри LocationForm.
* **Взаимодействие:** Выбрать существующий тег одним кликом. Добавить собственный тег, которого ещё нет в базе. Загружает список тегов через useTags(); Интеграция с react-hook-form (useController) → field.value = string[]; При вводе нового тега вызывает INSERT через Supabase;После успешного создания инвали дация ['tags'] и автоматическое добавление к выбранным тегам;
* **Используемые библиотеки:** Tailwind для стиля бейджа, shadcn возможен для Badge-стиля, Framer Motion — опционально для эффекта наведения.
**Актаульный код ChooseTag:**
```js
"use client";
import React, { useState } from "react";
import { useController } from "react-hook-form";
import { useTags } from "@/hooks/useTags";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ChooseTag({ control, name = "tags", rules }) {
  const {
    field: { value: selected = [], onChange },
  } = useController({ control, name, rules });

  const { data: tags = [], isLoading, isError } = useTags();
  const [newTag, setNewTag] = useState("");
  const queryClient = useQueryClient();

  const createTag = useMutation({
    mutationFn: async (name) => {
      const trimmed = name.trim();
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: trimmed })
        .select()
        .single();
      if (error && error.code !== "23505") throw error;
      return data ?? { name: trimmed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["tags"]);
      if (!selected.includes(data.name)) onChange([...selected, data.name]);
      setNewTag("");
    },
  });

  const toggle = (tag) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const exists = tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      if (!selected.includes(trimmed)) toggle(trimmed);
      setNewTag("");
      return;
    }
    createTag.mutate(trimmed);
  };

  return (
    <div className="space-y-3">
      {/* Существующие теги */}
      <div className="flex flex-wrap gap-2">
        {isLoading && <span className="text-sm text-muted-foreground">Загрузка тегов…</span>}
        {isError && <span className="text-sm text-destructive-foreground">Ошибка загрузки тегов</span>}
        {tags.map((tag) => (
          <motion.span
            key={tag.id}
            whileTap={{ scale: 0.95 }}
            role="button"
            aria-pressed={selected.includes(tag.name)}
            onClick={() => toggle(tag.name)}
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium select-none transition cursor-pointer",
              selected.includes(tag.name)
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "bg-muted text-muted-foreground border-border hover:bg-secondary/20"
            )}
          >
            {tag.name}
          </motion.span>
        ))}
      </div>

      {/* Добавить свой тег */}
      <div className="flex gap-2" role="form">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Добавить тег…"
          aria-label="Новый тег"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button type="button" disabled={createTag.isLoading || !newTag.trim()} onClick={handleAdd}>
          {createTag.isLoading ? "…" : "Добавить"}
        </Button>
      </div>

      {/* Ошибка создания тега */}
      <AnimatePresence>
        {createTag.isError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-sm text-destructive-foreground"
          >
            Ошибка: {createTag.error?.message || 'не удалось добавить тег'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```
---
### AttachImage

* **Назначение:** предназначен для загрузки и предварительного просмотра изображений в `LocationForm`
* **Пропсы:** `control` – объект управления из react-hook-form; `imageFile`
* **Взаимодействие:**
  * Позволяет выбрать изображение с устройства.
  * Отображает предпросмотр выбранного изображения.
  * Предоставляет возможность удалить выбранное изображение.
  * Очищает ссылку URL.createObjectURL, чтобы избежать утечек памяти.
* **Используемые библиотеки:** `react-hook-form`, `lucide-react`
**Актаульный код AttachImage.js:**
```js
'use client';
import React, { useEffect, useRef, useState } from "react";
import { useController } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AttachImage({ control, name = "imageFile", rules, className }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const {
    field: { value, onChange, ref },
    fieldState: { error },
  } = useController({ control, name, rules });
  // передаём весь FileList, а не один файл
  const handleSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    onChange(files);
    const url = URL.createObjectURL(files[0]);
    setPreview(url);
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  return (
    <div className={cn("space-y-2", className)}>
      {!preview && (
        <label
          className="flex flex-col items-center justify-center w-full max-w-xs gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer text-sm text-muted-foreground hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Загрузить изображение"
        >
          <Upload className="h-6 w-6" aria-hidden="true" />
          <span>Нажмите чтобы выбрать фото</span>
          <input
            type="file"
            accept="image/*"
            ref={(el) => {
              ref(el);
              inputRef.current = el;
            }}
            onChange={handleSelect}
            className="sr-only"
          />
        </label>
      )}
      {preview && (
        <div className="relative w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Предпросмотр изображения"
            className="h-48 w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Удалить изображение"
            className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white backdrop-blur hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {error && <p className="text-sm text-destructive-foreground">{error.message}</p>}
    </div>
  );
}
```
---
### LocationForm

* **Назначение:** Универсальная форма для добавления или редактирования локации.
* **Пропсы:** Возможно `initialData?: Location` (для редактирования) и `onSubmit?: (data) => void`.
* **Контракты:** Поля формы соответствуют колонкам таблицы `locations`: заголовок, описание, адрес, стоимость, URL, а также выбор тегов и загрузка изображения.
* **Взаимодействие:** В режиме добавления (`initialData` отсутствует) при сабмите вызывает `useMutation` для `POST /locations`. В режиме редактирования вызывает `PATCH` с существующим `id`. Для тегов использует список из таблицы `tags` (подача либо select-опций, либо ввод/предложение). Для загрузки изображения вызывает Supabase Storage или другую API. После успешной операции могут быть вызваны callback и навигация.
* **Работа с тегами:** При изменении списка тегов вызываются RPC‑функции: `add_location_tag({ location_id, tag_id })` для добавления, `remove_location_tag({ location_id, tag_id })` для удаления. Эти вызовы обёрнуты в useMutation‑хуки и сопровождаются оптимистическим обновлением кеша `['location', id]`.
* **Используемые библиотеки:** React Hook Form (взаимодействие с полями), shadcn (`Form`, `Input`, `Textarea`, `Select`, `Button`, `File Upload`), Tailwind. Framer Motion может анимировать динамический добавление полей (например, новые теги).
**Актаульный код LocationForm:**
```js
// components/LocationForm.js
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ChooseTag from '@/components/ChooseTag';
import AttachImage from './AttachImage';
import { useAddLocation } from '@/hooks/useAddLocation';
import { useRouter } from 'next/navigation';

/**
 * Форма добавления/редактирования локации.
 * Теперь использует ChooseTag для работы с массивом тегов.
 */
export default function LocationForm({ initialData } = {}) {
  const router = useRouter();
  const addLocation = useAddLocation();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...initialData,
      tags: initialData?.tags || [],     // обязательно задаём tags: [] по-умолчанию
    },
  });

  const onSubmit = (data) => {
    addLocation.mutate(data, {
      onSuccess: (location) => {
        console.log('send');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Заголовок, описание, адрес и т.д. */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Заголовок
        </label>
        <Input
          id="title"
          {...register('title', { required: 'Обязательное поле' })}
          className="mt-1 w-full"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Описание
        </label>
        <Textarea
          id="description"
          {...register('description')}
          className="mt-1 w-full"
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Адрес
        </label>
        <Input
          id="address"
          {...register('address')}
          className="mt-1 w-full"
        />
      </div>

      <div>
        <label htmlFor="cost" className="block text-sm font-medium">
          Стоимость
        </label>
        <Input
          id="cost"
          type="number"
          {...register('cost')}
          className="mt-1 w-full"
        />
      </div>

      <div>
        <label htmlFor="sourceUrl" className="block text-sm font-medium">
          Ссылка на источник
        </label>
        <Input
          id="sourceUrl"
          {...register('sourceUrl')}
          className="mt-1 w-full"
        />
      </div>

      {/* Блок выбора/добавления тегов */}
      <div>
        <label className="block text-sm font-medium">Теги</label>
        <ChooseTag control={control} name="tags" />
      </div>

      {/* Загрузка изображения */}
      <div>
        <label className="block text-sm font-medium">Изображение</label>
        <AttachImage control={control} name="imageFile" className="mt-1" />
      </div>

      <Button type="submit" disabled={addLocation.isLoading}>
        {addLocation.isLoading ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </form>
  );
}
```
---
### SkeletonCard

* **Назначение:** Заглушка-карточка для отображения во время загрузки данных (placeholder skeleton).
* **Пропсы:** Не требует пропсов или может принимать `count?: number` для генерации нескольких, но обычно используется как отдельный компонент (несколько рендерятся).
* **Взаимодействие:** Отображает серый блок с анимацией пульсации (используя классы Tailwind `animate-pulse` или Framer Motion) вместо реальной карточки. Используется в том же контейнере `LocationList` при загрузке данных.
* **Используемые библиотеки:** Tailwind (классы skeleton), Framer Motion (или CSS) для анимации эффекта пульсации.
**Актаульный код SkeletonCard:**
```js
"use client";
import React from "react";

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl bg-gray-200 p-4 shadow">
    <div className="h-40 w-full rounded-lg bg-gray-300"></div>
    <div className="mt-4 h-6 w-3/4 rounded bg-gray-300"></div>
    <div className="mt-2 h-4 w-1/2 rounded bg-gray-300"></div>
    <div className="mt-4 flex space-x-2">
      <div className="h-6 w-16 rounded bg-gray-300"></div>
      <div className="h-6 w-16 rounded bg-gray-300"></div>
    </div>
  </div>
);
export default SkeletonCard;
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
### useAddLocation

* **Назначение:** Мутация для создания новой локации.
* **Функционал:** 
  * `useMutation(addLocationFn, { onSuccess }).`
  * `addLocationFn` загружает изображение в Supabase Storage (если файл присутствует), получает `publicUrl`, затем `POST /rest/v1/locations` c телом `{ …payload, image_url: publicUrl }`.
  * В `onSuccess` инвалидируются `['locations']` и `['tags']`.
* **Использование:** `LocationForm` в `AddLocationPage`
**Актаульный код useAddLocation:**
```js
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';

export function useAddLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;

  return useMutation({
    mutationFn: async (formData) => {
      if (!session?.user?.id) {
        throw new Error('Пользователь не авторизован');
      }
      const user_id = session.user.id;
      const { imageFile, tags, ...rest } = formData;
      console.log("▶ imageFile:", formData.imageFile);

      // 1. Нормализация тегов в массив строк
      let tagList = [];
      if (Array.isArray(tags)) {
        tagList = tags;
      } else if (typeof tags === 'string' && tags.trim()) {
        tagList = tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }

      // 2. Загрузка картинки, если передан FileList
      let image_url = null;
      if (imageFile?.length) {
        const file = imageFile[0];                // первый файл из FileList
        const ext = file.name.split('.').pop();
        const filePath = `${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }
      console.log("▶ imageFile:", formData.imageFile);
      // 3. Atomic RPC: создаёт локацию + теги + связи
      const { data, error } = await supabase.rpc(
        'create_location_with_tags',
        {
          p_user_id:     user_id,
          p_title:       rest.title,
          p_description: rest.description,
          p_address:     rest.address,
          p_cost:        rest.cost,
          p_source_url:  rest.sourceUrl,
          p_image_url:   image_url,
          p_tags:        tagList,
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['locations']);
      queryClient.invalidateQueries(['tags']);
    },
  });
}
```

---
### useLocations.js

* **Назначение:** Кастомный хук для получения и управления списком локаций.
* **Функционал:** Оборачивает React Query (`useInfiniteQuery` или `useQuery`) для обращения к Supabase API (REST) или через клиентский SDK. Поддерживает параметры пагинации (limit, offset или курсор) и фильтрации (по `searchQuery` и выбранным тегам из Zustand). Возвращает `data` (массив локаций), `isLoading`, `isError`, `fetchNextPage`, `hasNextPage` и т. д. Поддерживает оптимистическое обновление при мутациях (добавление, обновление, удаление) через React Query.
* **Использование:** Применяется на главной странице (`LocationListPage`) для загрузки списка; может использоваться и на странице детализации для получения одного элемента (например, через `useQuery(['location', id], ...)`). Также может содержать функции добавления/удаления тегов (`RPC` или патчи через Supabase) как методы `mutate`.
**Актаульный код useLocations.js:** 
```js
'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useUIStore } from '@/store/uiStore';

const PAGE_SIZE = 9;

export function useLocations() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const selectedTags = useUIStore((s) => s.selectedTags);

  const fetchLocations = async ({ pageParam = null }) => {
    let query = supabase
      .from('locations')
      .select('*, locations_tags(tag_id, tags(name))')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    // Курсор: берём записи «старше» (меньше created_at)
    if (pageParam) {
      query = query.lt('created_at', pageParam);
    }
    // Поиск по заголовку (ilike, нечувствительно к регистру)
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }
    // Фильтрация по выбранным тегам (JOIN locations_tags)
   if (selectedTags.length) {
      const {data: tagRows, error: tagError } = await supabase
        .from('tags')
        .select('id,name')
        .in('name', selectedTags);
      if (tagError) throw tagError;
      const tagIds = tagRows.map((t) => t.id);
      query = query.in('locations_tags.tag_id', tagIds);
    }

    const { data, error } = await query;
    console.log('got', data.length, 'items; last created_at =', data[data.length-1]?.created_at);
    if (error) throw error;

    const items = data.map(({ locations_tags, ...loc }) => ({
    ...loc,
    imgUrl: loc.image_url,
    tags: locations_tags.map((lt) => lt.tags.name),
    }));

    return {
      items,
      nextCursor:
        data.length === PAGE_SIZE ? data[data.length - 1].created_at : undefined,
    };
  };

  return useInfiniteQuery({
    queryKey: ['locations', { search: searchQuery, tags: selectedTags }],
    queryFn: fetchLocations,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: { fetch },
  }
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
### useTags

* **Назначение:** Хук для получения и кеширования списка тегов.
* **Функционал:**
  * `useQuery(['tags'], () => GET /rest/v1/tags?select=*)`, `{ staleTime: 5*60_000 }`.
  * Возвращает массив тегов, доступный для фильтрации и автодополнения в формах.
* **Использование:** `SearchBar` (фильтр), `LocationForm` (multi‑select теги), а также страницы аналитики.
**Актаульный код useTags:**
```js
"use client";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

/** Возвращает [{ id, name }] из таблицы `tags` с кэшированием 5 минут. */
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000, // 5 минут
  });
}
```

---