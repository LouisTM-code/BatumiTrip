# **Справочник компонентов и хуков BatumiTrip**

> Этот документ является единым источником истины (source of truth) о текущей структуре и состоянии кода проекта Batumi Trip. Он служит опорой для AI‑генератора кода и всей команды разработчиков, предоставляя детальные описания существующих компонентов, хуков и утилит. Используя этот справочник, AI сможет корректно генерировать и модифицировать код, опираясь на актуальные реализации и внутренние соглашения по стилю.
---
## Иерархия компонентов
```text
RootLayout
├─ <html>
│  └─ <body>
│     ├─ Providers
│     │  ├─ QueryClientProvider
│     │  │  └─ ReactQueryDevtools   (только в development)
│     │  ├─ AuthProvider
│     │  │  └─ SessionProvider
│     │  └─ ThemeProvider
│     │     └─ NextThemesProvider
│     ├─ FavouriteFetcher
│     └─ {page children}
│
├─ / (LocationListPage)
│  ├─ TagsPrefetcher
│  ├─ Header
│  │  ├─ Logo <Link>
│  │  ├─ Search <button> ─┐
│  │  │                   └─ SearchBar (открывается/закрывается)
│  │  │                      ├─ Input
│  │  │                      └─ TagBadge × N
│  │  ├─ Login/Logout <Button>
│  │  └─ LoginModal (вызывается из Zustand)
│  ├─ LocationList
│  │  ├─ (SkeletonCard × 6)                          – пока идёт начальная загрузка
│  │  ├─ LocationCard × N
│  │  │  ├─ <Image>
│  │  │  ├─ TagBadge × M
│  │  │  └─ Favourite <button>
│  │  └─ Intersection‑observer <div>                 – триггер беск. прокрутки
│  └─ AddLocationButton  → <Link href="/locations/new">
│
├─ /locations/new (AddLocationPage)
│  └─ LocationForm
│     ├─ Input (заголовок)
│     ├─ Textarea (описание)
│     ├─ Input (адрес, стоимость, sourceUrl)
│     ├─ ChooseTag
│     │  ├─ Inline <span> (существующие теги)
│     │  └─ Input + Button (добавить новый тег)
│     ├─ AttachImage
│     │  ├─ <input type="file">
│     │  └─ <img> (предпросмотр / X <button>)
│     └─ Button (Сохранить)
│
├─ /locations/[id] (LocationDetailPage)
│  │  (SkeletonCard — при загрузке)
│  │  (Ошибка <div> — при isError)
│  └─ {!isEditing
│      ├─ LocationDetail
│      │  ├─ <Image>
│      │  ├─ TagBadge × M
│      │  └─ Button (Назад)
│      └─ [если автор] Edit & Delete <Button>
│     : LocationForm (режим Edit) + Button (Отмена)
│
└─ API / служебные компоненты (не попадают в DOM‑дерево страниц)
   ├─ route.js (NextAuth endpoint)
   └─ SkeletonCard, TagBadge, etc. — вспомогательные UI‑элементы
```

---
## Актуальный код и описание компонентов

### Layout.js

* **Назначение:** Глобальный макет приложения, оборачивающий все страницы. Отвечает за установку провайдеров (React Query Provider, Context для темы), проверку авторизации и рендеринг общих элементов интерфейса (например, `Header` и `LoginModal`).
* **Взаимодействие:** Использует хук `useAuth` для проверки сессии пользователя при загрузке страницы. Если пользователь не авторизован, отображает кнопку входа в `Header`. Включает в разметку компоненты `Header` и `LoginModal`.
**Актаульный код Layout.js:**
```js
import '@/styles/globals.css';
import Providers from '@/components/Providers';
import FavouriteFetcher from '@/lib/FavouriteFetcher';
export const metadata = {
  title: 'Batumi Trip',
  description: 'SPA для совместного планирования путешествия друзей в Батуми',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>
          <FavouriteFetcher />
          {children}
          </Providers>
      </body>
    </html>
  );
}
```

---
### LocationListPage (Главная страница списка)

* **Назначение:** Страница-лендинг, отображающая весь интерфейс поиска и просмотра списка локаций текущего пользователя.
* **Взаимодействие:** На странице располагаются `SearchBar`, `AddLocationButton` и `LocationList`. При загрузке инициируется хук `useLocations`, который подгружает первые локации. Пользователь может вводить текст поиска (сохраняется в Zustand), и запрос динамически фильтруется. Когда данных нет или пользователь только что вошел, `LocationList` показывает `SkeletonCard`.
**Актаульный код LocationListPage:**
```js
// app/page.js  (роут /)
import LocationList from '@/components/LocationList';
import AddLocationButton from '@/components/AddLocationButton'
import Header from '@/components/Header';
import TagsPrefetcher from '@/lib/TagsPrefetcher';

export default function LocationListPage() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <TagsPrefetcher />
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
* **Взаимодействие:** Содержит `LocationForm` без `initialData`. Сабмит формы вызывает `useAddLocation().mutate(data)`, а при успехе перенаправляет на детальную страницу новой локации.
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
### LocationDetailPage (Страница подробной информации)

* **Назначение:** Страница с полным описанием выбранной локации.
* **Взаимодействие:** При получении параметра `id` вызывает `useOneLocation(id)` `(useQuery(['location', id]))` для загрузки объекта; данные передаёт в `LocationDetail`. Кнопки `EditButton` и `DeleteButton` используют хуки `useUpdateLocation()` и `useDeleteLocation()` соответственно.
**Актаульный код LocationDetailPage:**
```js
// app/locations/[id]/page.jsx
'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOneLocation } from '@/hooks/useOneLocation';
import { useDeleteLocation } from '@/hooks/useDeleteLocation';
import LocationDetail from '@/components/LocationDetail';
import LocationForm from '@/components/LocationForm';
import SkeletonCard from '@/components/SkeletonCard';
import { Button } from '@/components/ui/button';

export default function LocationDetailPage() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { data: location, isLoading, isError } = useOneLocation(id);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  // хук удаления
  const deleteMutation = useDeleteLocation();
  // пока идёт загрузка данных или авторизации — показываем скелетон
  if (isLoading || authLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <SkeletonCard />
      </main>
    );
  }

  if (isError || !location) {
    return (
      <main className="container mx-auto px-4 py-6 text-destructive">
        Не удалось загрузить локацию.
      </main>
    );
  }
  // только автор (location.user_id) может редактировать / удалять
  const canEdit = user?.id === location.user_id;
  // удаление с подтверждением
  const handleDelete = () => {
    if (!window.confirm('Удалить локацию безвозвратно?')) return;
    deleteMutation.mutate(
      { id, imageUrl: location.imgUrl },
      {
        onSuccess: () => {
          router.push('/');
        },
      },
    );
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* 3. Рендерим либо просмотр, либо форму */}
      {!isEditing ? (
        <>
          <LocationDetail location={location} />
          {/* 1+2. Кнопки «Редактировать» и «Удалить» доступны только автору */}
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Удаляем…' : 'Удалить'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Редактировать локацию</h1>
          <LocationForm
            initialData={location}
            onSuccess={() => {
              setIsEditing(false);
            }}
          />
          <Button variant="link" onClick={() => setIsEditing(false)}>
            Отмена
          </Button>
        </>
      )}
    </main>
  );
}
```

---
### Header

* **Назначение:** Навигационная панель (обычно шапка страницы) с названием приложения и кнопкой авторизации/выхода.
* **Взаимодействие:** Показывает название или логотип приложения. Если пользователь не авторизован, отображает кнопку "Войти". Нажатие на кнопку "Войти" открывает `LoginModal` (контролируется глобальным состоянием, например Zustand). Если пользователь авторизован, может показывать приветствие и кнопку "Выйти", вызывающую функцию `signOut()` из `useAuth`.
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
* **Взаимодействие:** Пользователь вводит текст, он сохраняется в глобальном состоянии (например, Zustand) как текущий поисковый запрос (`searchQuery`). Поисковое состояние используют `useLocations` или компонент списка для фильтрации вывода. Возможна функциональность debounce (задержка поиска после ввода) для оптимизации запросов.
**Актаульный код SearchBar:**
```js
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/uiStore";
import { useTags } from "@/hooks/useTags";
import TagBadge from "@/components/TagBadge";
import { cn } from "@/lib/utils";
/**
 * SearchBar — поле ввода + список тегов‑фильтров.
 *
 * • Данные ввода → Zustand (`searchQuery`) c debounce = 1 сек.  
 * • Теги грузятся через useTags() и отображаются под инпутом.  
 * • Клик по тегу переключает его в Zustand (`toggleTag` внутри TagBadge).  
 *
 * @param placeholder – плейсхолдер строки поиска
 */
export default function SearchBar({
  placeholder = "Поиск локаций…",
  className,
}) {
  /* ---------- глобальный поиск (Zustand) ---------- */
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  /* ---------- локальное состояние ввода ---------- */
  const [value, setValue] = useState(searchQuery);
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value !== searchQuery) setSearchQuery(value);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [value, searchQuery, setSearchQuery]);
  /* если глобальное состояние изменилось извне — синхронизируем input */
  useEffect(() => {
    if (searchQuery !== value) setValue(searchQuery);
  }, [searchQuery]);
  /* ---------- список тегов ---------- */
  const { data: tags = [], isLoading, isError } = useTags();

  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -8, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("w-full space-y-3", className)}
    >
      {/* строка поиска */}
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поле поиска локаций"
        className="w-full"
      />
      {/* блок тегов */}
      <AnimatePresence initial={false}>
        {/** оставляем тег‑бар даже когда идёт загрузка, чтобы высота была стабильна */}
        <motion.div
          key="tag-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {isLoading && (
              <span className="text-sm text-muted-foreground">
                Загружаем теги…
              </span>
            )}
            {isError && (
              <span className="text-sm text-destructive-foreground">
                Не удалось загрузить теги
              </span>
            )}
            {tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
```

---
### AddLocationButton

* **Назначение:** Кнопка для перехода к форме создания новой локации.
* **Взаимодействие:** На главной странице располагается в удобном месте (например, в шапке или снизу). При нажатии переводит на маршрут `/locations/new`. Использует Next.js `<Link>` или `useRouter().push`. Может быть всегда видимой при прокрутке страницы (fixed position).
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
* **Взаимодействие:** 
  * При монтировании вызывает useLocations() (useInfiniteQuery) и получает локации, отфильтрованные по searchQuery и selectedTags из Zustand.
  * При прокрутке до конца списка вызывает fetchNextPage() для подгрузки данных (infinite scroll).
  * Во время загрузки отображает SkeletonCard. Для каждой локации рендерит LocationCard.
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
* **Взаимодействие:**
  * При `authorize()` апсёртит логин в Supabase `users`.
  * В callback’ах прописывает `token.id` → `session.user.id`, чтобы RLS‑политики «знали» текущего пользователя (см. DataModel‑BatumiTrip.md § 5).
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
* **Взаимодействие:** Используется внутри `Providers.js`; обеспечивает доступ к `useSession()` во всех дочерних компонентах.
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
* **Взаимодействие:**
  * Читает `showLoginModal` и `setLoginModal` из Zustand.
  * По `onSubmit` вызывает `signIn`, затем закрывает модалку.
  * При открытии/закрытии использует компоненты `Dialog*` из **shadcn**.
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
* **Контракты:** Передаваемые пропсы формируются из данных API (Supabase) по таблице `locations` с объединением тегов.
* **Взаимодействие:** 
  * При рендере отображает картинку (с обрезкой по размеру), заголовок, первые 2–3 строки описания и `TagBadge` для каждого тега, иконку `избранное`⭐ (filled / outline).
  * При наведении или загрузке карточка может слегка масштабироваться или появляться с анимацией Framer Motion (повышенный UX). По клику на карточку или кнопку "Подробнее" вызывает `router.push('/locations/${id}')`.
  * Клик по иконке вызывает хук useToggleFavourite(id) →
  – если не было любимо, POST /rest/v1/favourites (или RPC add_favourite)
  – если было, DELETE /rest/v1/favourites?user_id=eq.{uid}&location_id=eq.{id}. Хук оптимистично обновляет favourites в Zustand и invalidates ['favourites', userId].
**Актаульный код LocationCard:**:
```js
'use client';
import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import TagBadge from '@/components/TagBadge';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { useToggleFavourite } from '@/hooks/useToggleFavourite';

const LocationCard = ({ location }) => {
  const {
    id,
    title,
    description,
    imgUrl,
    tags = [],
    /* isFavourite из запроса может быть устаревшим — локальный store главнее */
    isFavourite: initialFavourite = false,
  } = location;

  const selectedTags = useUIStore((s) => s.selectedTags);
  const favouritesMap = useUIStore((s) => s.favourites);
  const isFavourite = favouritesMap[id] ?? initialFavourite;

  const matchesFilter =
    selectedTags.length === 0 ||
    selectedTags.every((tag) => tags.includes(tag));

  const toggleFavourite = useToggleFavourite(id);

  if (!matchesFilter) return null;
  // Фолбэк на случай пустого/невалидного URL
  const imageSrc =
    imgUrl && /^https?:\/\//.test(imgUrl)
      ? imgUrl
      : 'https://cataas.com/cat/gif';

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-2xl bg-white p-4 shadow transition-shadow"
    >
      <Link href={`/locations/${id}`} className="block">
        <Image
          src={imageSrc}
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
      {/* теги */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagBadge key={tag} name={tag} />
        ))}
      </div>
      {/* интерактивная звёздочка */}
      <button
        type="button"
        onClick={toggleFavourite}
        aria-label={
          isFavourite ? 'Убрать из избранного' : 'Добавить в избранное'
        }
        className={cn(
          'absolute top-4 right-4 rounded-full p-2 shadow transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
          isFavourite
            ? 'text-yellow-500'
            : 'text-gray-400 hover:text-yellow-500'
        )}
      >
        <Star
          size={20}
          stroke="currentColor"
          fill={isFavourite ? 'currentColor' : 'none'}
        />
      </button>
    </motion.div>
  );
};

export default memo(LocationCard);
```

---
### LocationDetail

* **Назначение:** Компонент отображения подробных данных локации (используется на `LocationDetailPage`).
* **Взаимодействие:** Показывает большие изображение и все текстовые поля локации. Теги выводит через `TagBadge`. Кнопки `EditButton` и `DeleteButton` (связанные с тем же `id`) располагаются рядом. Адрес можно сделать кликабельным (ссылка на Google Maps), `sourceUrl` — внешний ресурс.
**Актаульный код LocationDetail:**
```js
'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import TagBadge from '@/components/TagBadge';
import { useRouter } from 'next/navigation';

/**
 * Компонент подробной информации о локации
 * @param {{ location: import('@/hooks/useOneLocation').Location }} props
 */
export default function LocationDetail({ location }) {
  const router = useRouter();
  const {
    title,
    description,
    imgUrl,
    address,
    cost,
    source_url: sourceUrl,
    tags = [],
  } = location;

  // Фолбэк для некорректных URL
  const imageSrc = imgUrl && /^https?:\/\//.test(imgUrl)
    ? imgUrl
    : 'https://cataas.com/cat/gif';

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="relative h-60 w-full overflow-hidden rounded-lg shadow">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>

      <section className="space-y-2 text-sm leading-relaxed">
        {address && (
          <p>
            <strong>Адрес:&nbsp;</strong>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {address}
            </a>
          </p>
        )}
        {cost && (
          <p>
            <strong>Стоимость:&nbsp;</strong>
            {cost}
          </p>
        )}
        {sourceUrl && (
          <p>
            <strong>Источник:&nbsp;</strong>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline break-all"
            >
              {sourceUrl}
            </a>
          </p>
        )}
      </section>

      {description && (
        <p className="prose dark:prose-invert max-w-none">{description}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => router.push(`/`)}>
          Назад
        </Button>
      </div>
    </motion.article>
  );
}
```

---
### TagBadge

* **Назначение:** Визуальный компонент для отображения отдельного тега (например, категории) локации.
* **Контракты:** Получает имя тега из данных. Теги формируются из таблицы `tags` или через запрос связей `locations_tags`.
* **Взаимодействие:** Показывает слово в рамке или подложке (badge), стиль — фоновый цвет и скругления через Tailwind. При клике (если задан `onClick`) может обновлять глобальное состояние фильтра (Zustand), чтобы отфильтровать список по выбранному тегу. Используется внутри `LocationCard` и `LocationDetail`.
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
* **Взаимодействие:**
  * Позволяет выбрать изображение с устройства.
  * Отображает предпросмотр выбранного изображения.
  * Предоставляет возможность удалить выбранное изображение.
  * Очищает ссылку URL.createObjectURL, чтобы избежать утечек памяти.
**Актаульный код AttachImage.js:**
```js
'use client';
import React, { useEffect, useRef, useState } from "react";
import { useController } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
/**
* @param {Object}   props
* @param {string?}  [props.initialUrl] – URL уже загруженного изображения
*/
// Обновлённый AttachImage: сохраняем один File вместо FileList
export default function AttachImage({ control, name = "imageFile", rules, initialUrl = null, className }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(initialUrl);

  const {
    field: { value, onChange, ref },
    fieldState: { error },
  } = useController({ control, name, rules });

  // Сохраняем один File, а не FileList
  const handleSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    onChange(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleRemove = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Очищаем preview при unmount
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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
* **Контракты:** Поля формы соответствуют колонкам таблицы `locations`: заголовок, описание, адрес, стоимость, URL, а также выбор тегов и загрузка изображения.
**Актаульный код LocationForm:**
```js
'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ChooseTag from '@/components/ChooseTag';
import AttachImage from './AttachImage';
import { useAddLocation } from '@/hooks/useAddLocation';
import { useUpdateLocation } from '@/hooks/useUpdateLocation';
import { useRouter } from 'next/navigation';

/**
 * Форма создания или редактирования локации.
 * Если передан initialData.id — режим редактирования, иначе — создания.
 */
export default function LocationForm({ initialData = {}, onSuccess }) {
  const router = useRouter();
  const addLocation = useAddLocation();
  const updateLocation = useUpdateLocation();
  const isEditMode = Boolean(initialData.id);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title:       initialData.title       || '',
      description: initialData.description || '',
      address:     initialData.address     || '',
      cost:        initialData.cost        || '',
      sourceUrl:   initialData.sourceUrl   || '',
      tags:        initialData.tags        || [],
      imageFile:   null,
    },
  });

  const onSubmit = (data) => {
    // Собираем payload с file и старым imgUrl
    const payload = {
      title:       data.title,
      description: data.description,
      address:     data.address,
      cost:        data.cost,
      sourceUrl:   data.sourceUrl,
      imageFile:   data.imageFile,
      imgUrl:      initialData.imgUrl   || null,
      tags:        data.tags,
    };

    if (isEditMode) {
      updateLocation.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: () => onSuccess?.() }
      );
    } else {
      addLocation.mutate(
        payload,
        { onSuccess: (loc) => router.push(`/locations/${loc.id}`) }
      );
    }
  };

  const isSubmitting = isEditMode
    ? updateLocation.isLoading
    : addLocation.isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Заголовок */}
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

      {/* Описание */}
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

      {/* Адрес */}
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

      {/* Стоимость */}
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

      {/* Ссылка на источник */}
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

      {/* Выбор тегов */}
      <div>
        <label className="block text-sm font-medium">Теги</label>
        <ChooseTag control={control} name="tags" />
      </div>

      {/* Картинка */}
      <div>
        <label className="block text-sm font-medium">Изображение</label>
        <AttachImage control={control} name="imageFile" initialUrl={initialData.imgUrl} className="mt-1" />
      </div>

      {/* Кнопка */}
      <Button type="submit" disabled={isSubmitting}>
        {isEditMode
          ? isSubmitting
            ? 'Сохраняем…'
            : 'Сохранить изменения'
          : isSubmitting
          ? 'Сохраняем…'
          : 'Сохранить'}
      </Button>
    </form>
  );
}
```
---
### SkeletonCard

* **Назначение:** Заглушка-карточка для отображения во время загрузки данных (placeholder skeleton).
* **Взаимодействие:** Отображает серый блок с анимацией пульсации (используя классы Tailwind `animate-pulse` или Framer Motion) вместо реальной карточки. Используется в том же контейнере `LocationList` при загрузке данных.
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
* **Взаимодействие:**
  * Создаёт `queryClient` через `createQueryClient()` (см. `lib/reactQuery.js`).
  * Включает `<ReactQueryDevtools />` только если `NODE_ENV !== 'production'`.
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
* **Взаимодействие:** Используется внутри `Providers.js`; читает/записывает тему в `localStorage` (механизм `next-themes`).
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
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';

/**
 * Мутация для создания новой локации с загрузкой изображения в Storage.
 */
export function useAddLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async (formData) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }
      const { imageFile, tags, ...rest } = formData;

      // 1. Нормализация тегов
      let tagList = [];
      if (Array.isArray(tags)) {
        tagList = tags;
      } else if (typeof tags === 'string' && tags.trim()) {
        tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      // 2. Загрузка изображения
      let image_url = null;
      if (imageFile) {
        try {
          image_url = await uploadImage(imageFile, userId);
        } catch (err) {
          toast.error('Не удалось загрузить изображение');
          throw err;
        }
      }

      // 3. Вызов RPC для создания локации вместе с тегами
      const { data, error } = await supabase.rpc(
        'create_location_with_tags',
        {
          p_user_id:     userId,
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
      toast.success('Локация успешно добавлена');
    },
    onError: (err) => {
      toast.error(err.message || 'Ошибка при добавлении локации');
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
### useUpdateLocation

* **Назначение:** Мутация для обновления существующей локации.
* **Функционал:**
  * `useMutation(({ id, ...patch }) => PATCH /rest/v1/locations?id=eq.{id}).`
  * При обновлении тегов вызывает RPC `update_location_with_tags`.
  * Инвалидирует `['location', id]` и `['locations']`. 
* **Использование:** Кнопка `Сохранить` в `LocationForm` (режим Edit) и `EditButton` на детальной странице.
**Актаульный код useUpdateLocation:**
```js
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';
import deleteImage from '@/lib/deleteImage';
/**
 * Мутация для обновления существующей локации с возможной заменой изображения.
 * Если изображение заменено, после успешного обновления записи
 * старый файл в Storage автоматически удаляется.
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }

      const { imageFile, imgUrl: oldImageUrl, tags, ...rest } = data;
      /* 1. Нормализуем список тегов */
      const tagList = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      /* 2. Загружаем новое изображение (если передан File) */
      let publicUrl = oldImageUrl;
      const isImageReplaced = Boolean(imageFile);
      if (isImageReplaced) {
        try {
          publicUrl = await uploadImage(imageFile, userId);
        } catch (err) {
          toast.error('Не удалось загрузить новое изображение');
          throw err;
        }
      }
      /* 3. RPC‑обновление локации и тегов */
      const { data: updated, error } = await supabase.rpc(
        'update_location_with_tags',
        {
          p_loc_id:      id,
          p_title:       rest.title,
          p_description: rest.description,
          p_address:     rest.address,
          p_cost:        rest.cost,
          p_source_url:  rest.sourceUrl,
          p_image_url:   publicUrl,
          p_tags:        tagList,
        }
      );
      if (error) throw error;
      /* 4. Удаляем старый файл после успешного апдейта */
      if (isImageReplaced && oldImageUrl && oldImageUrl !== publicUrl) {
        // Не блокируем основную цепочку — ошибка удаления не критична
        deleteImage(oldImageUrl);
      }

      return updated;
    },

    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries(['location', id]);
      queryClient.invalidateQueries(['locations']);
      toast.success('Локация успешно обновлена');
    },

    onError: (err) => {
      toast.error(err.message || 'Ошибка при обновлении локации');
    },
  });
}
```

---
### useDeleteLocation

* **Назначение:** Удалить локацию из базы через RPC‑функцию `delete_location`. Удалить все связи локации в таблицах `favourites` и `locations_tags`. Удалить файл изображения из хранилища (если был). Обновить клиентский кэш React‑Query и состояние UI
* **Функционал:**
1. **RPC‑удаление локации**
   Вызывает на Supabase функцию `delete_location`, которая каскадно удаляет запись из `locations` и все связанные через внешние ключи записи в `locations_tags`.
2. **Удаление избранного**
   Удаляет из таблицы `favourites` все записи, где `location_id` совпадает с удаляемой локацией. Ошибки при этом только логируются, но не прерывают процесс.
3. **Удаление изображения**
   Если передан URL картинки, вызывает утилиту `deleteImage` для удаления файла из Storage. Ошибки также только логируются.
4. **Инвалидация кэшей**
   * Инвалидирует React‑Query-запросы `["locations"]` и `["favourites"]`, чтобы список локаций и избранного обновился.
   * С помощью zustand‑стора сбрасывает флаг избранного для этой локации в UI.
5. **Обработка ошибок**
   В случае ошибки RPC или других критичных шагов бросает исключение и показывает toast‑сообщение с текстом ошибки.
**Актаульный код useDeleteLocation.js:**
```js
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import deleteImage from "@/lib/deleteImage";
import toast from "react-hot-toast";
import { useUIStore } from "@/store/uiStore";
/**
 * useDeleteLocation — удаляет локацию через RPC‑функцию `delete_location`,
 * чистит связанные записи из favourites, locations_tags и файл в Storage.
 * После успеха должен быть вызван `router.push('/')` на уровне компонента,
 * где используется этот хук (см. LocationDetailPage).
 *
 * Возвращает объект `mutation` из React‑Query.
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  const clearFavourite = useUIStore((s) => s.toggleFavourite);

  return useMutation({
    /**
     * @param {{ id: string, imageUrl?: string|null }} payload
     */
    mutationFn: async ({ id, imageUrl }) => {
      // 1) Удаляем запись + связки тегов каскадом через RPC
      const { error: rpcError } = await supabase.rpc("delete_location", {
        location_id: id,
      });
      if (rpcError) throw rpcError;
      // 2) Удаляем favourites текущего пользователя к этой локации (без RPC)
      const { error: favErr } = await supabase
        .from("favourites")
        .delete()
        .eq("location_id", id);
      if (favErr) {
        // не критично — просто логируем
        console.warn("Failed to delete favourites for location", favErr);
      }
      // 3) Удаляем картинку из Storage, если была
      try {
        if (imageUrl) await deleteImage(imageUrl);
      } catch (imgErr) {
        console.warn("Failed to delete image file:", imgErr);
      }

      return { id };
    },
    // ====== React‑Query callbacks ======
    onSuccess: (_data, { id }) => {
      /* Инвалидируем кеши списка локаций / избранного */
      queryClient.invalidateQueries(["locations"]);
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      // Сбрасываем флаг избранного локально, если был
      clearFavourite(id);
      toast.success("Локация удалена");
    },

    onError: (err) => {
      toast.error(err?.message || "Не удалось удалить локацию");
    },
  });
}
```

---
### useOneLocation.js

* **Назначение:** Кастомный хук для загрузки одной локации по `id` вместе с привязанными тегами и признаком «избранное» для текущего пользователя.
* **Функционал:** 
  * Оборачивает `useQuery(['location', id], fetcher`, `{ staleTime: 60_000 }).`
  * fetcher делает запрос к Supabase REST:
  `GET /rest/v1/locations?id=eq.{id}&select=*,tags(*),favourites(user_id)&limit=1.`
  * В респонсе вычисляет `isFavourite = favourites.length > 0.`
  * При ошибке — выводит `toast` через `react-hot-toast`.
* **Использование:** Применяется в `LocationDetailPage`, `LocationForm` (режим Edit) и в модалке быстрого предпросмотра.
**Актаульный код useOneLocation.js:**
```js
'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * useOneLocation — грузит деталь локации + теги (+ признак избранного).
 * @param id UUID локации
 */
export function useOneLocation(id) {
  return useQuery({
    queryKey: ['location', id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async () => {
      /* 1. REST‑join locations ← locations_tags ← tags */
      const { data, error } = await supabase
        .from('locations')
        .select(
          '*, locations_tags(tag_id, tags(name)), favourites!left(user_id)'
        )                      // favourites нужен, чтобы вычислить isFavourite
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        imgUrl: data.image_url,            // camelCase на фронте :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
        tags: data.locations_tags.map((lt) => lt.tags.name),
        isFavourite: data.favourites?.length > 0,
      };
    },
    onError: (err) =>
      toast.error(
        err?.message || 'Не удалось загрузить информацию о локации'
      ),
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
* **Взаимодействие:** Вызывается однократно в `Providers.js`; остальные хуки (`useLocations`, `useAddLocation` и др.) используют тот же экземпляр.
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
* **Взаимодействие:** Используется в API‑роуте `route.js`, пользовательских хуках (CRUD) и загрузке изображений в Storage.
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

* **Назначение:** Объединяет условные классы с помощью `clsx`, а затем «склеивает» возможные дубликаты через `tailwind-merge`.
* **Взаимодействие:** Импортируется во всех React‑компонентах, где нужно динамически формировать className.
**Актаульный код utils.js:**
```js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---
### uploadImage.js

**Назначение:** Компонент `uploadImage` предназначен для приёма файлов (изображений или любых других типов), их безопасной загрузки в хранилище Supabase Storage и предоставления клиенту публичного URL для последующего отображения или использования. Он инкапсулирует логику валидации, генерации уникального имени, формирования «чистого» пути на основе userId и получения конечной ссылки, скрывая детали работы с Supabase от остальной части приложения.
**Актаульный код uploadImage.js:**
```js
import { supabase } from '@/lib/supabaseClient';
/**
 * Загружает файл в Supabase Storage и возвращает публичный URL.
 * @param {File} file - файл для загрузки
 * @param {string} userId - ID текущего пользователя, будет использован в пути хранения
 * @returns {Promise<string>} публичный URL загруженного файла
 */
export default async function uploadImage(file, userId) {
  if (!file) {
    throw new Error('No file provided for upload');
  }
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;
  if (!bucket) {
    throw new Error('Bucket name is not defined in environment variables');
  }
  // Генерируем «чистый» идентификатор папки: только латиница, цифры, "-" и "_"
  const safeUserId = (userId || 'anon')
    .toString()
    .replace(/[^A-Za-z0-9_-]/g, '_');
  // Расширение и уникальное имя файла
  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}-${randomStr}.${ext}`;
  // Конечный путь в хранилище
  const filePath = `${safeUserId}/${fileName}`;
  // Загрузка файла
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: false });
  if (uploadError) {
    throw uploadError;
  }
  // Получение публичного URL
  const { data: urlData, error: urlError } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  if (urlError) {
    throw urlError;
  }

  return urlData.publicUrl;
}
```

---
### deleteImage

* **Назначение:** Обеспечить корректное удаление ранее загруженного в Supabase Storage файла (изображения) по его публичному URL Предотвратить утечки устаревших или ненужных файлов, не нарушая основного потока выполнения
### Взаимодействие
1. **Проверка URL**
   * Если `imageUrl` пустой (`null`, `undefined` или пустая строка) — функция сразу возвращает `void`.
2. **Получение имени бакета**
   * Читает переменную окружения `NEXT_PUBLIC_SUPABASE_BUCKET`.
   * Если она не задана — выводит ошибку в `console.error` и завершает работу.
3. **Извлечение пути файла**
   * Ищет в `imageUrl` маркер `/${bucket}/`.
   * Если маркер не найден — выводит предупреждение в `console.warn` и завершает работу.
   * Извлекает часть строки после маркера — это путь внутри бакета.
4. **Удаление файла**
   * Вызывает `supabase.storage.from(bucket).remove([filePath])`.
   * Если Supabase вернул ошибку — выводит её в `console.error`, но не выбрасывает исключение.
**Актаульный код uploadImage.js:**
```js
import { supabase } from '@/lib/supabaseClient';
/**
 * Удаляет файл из Supabase Storage по его публичному URL.
 * Ошибка удаления не прерывает основной поток, но выводится в console.
 *
 * @param {string|null|undefined} imageUrl – публичный URL старого изображения
 * @returns {Promise<void>}
 */
export default async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;
  if (!bucket) {
    console.error('ENV NEXT_PUBLIC_SUPABASE_BUCKET not defined – skip delete.');
    return;
  }
  // Ищем часть пути после …/object/public/{bucket}/
  const marker = `/${bucket}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) {
    console.warn('deleteImage: cannot parse path from url', imageUrl);
    return;
  }
  const filePath = imageUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) {
    console.error('deleteImage: failed to remove old image', error);
  }
}
```

---
### useTags

* **Назначение:** Хук для получения и кеширования списка тегов.
* **Функционал:**
  * `useQuery(['tags'], () => GET /rest/v1/tags?select=*)`, `{ staleTime: 5*60_000 }`.
  * Возвращает массив тегов, доступный для фильтрации и автодополнения в формах.
* **Использование:** `SearchBar` (фильтр), `LocationForm` (multi‑select теги), а также страницы аналитики.
**Актаульный код useTags.js:**
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
* **Назначение:** Хук для получения и кеширования списка тегов.
* **Функционал:** TagsPrefetcher — «ничего не рендерит», но при монтировании вызывает useTags() и тем самым прогревает кеш ['tags'].
* **Использование:** `SearchBar` (фильтр)
**Актаульный код TagsPrefetcher.js:**
```js
"use client";
import { useTags } from "@/hooks/useTags";
export default function TagsPrefetcher() {
  useTags();
  return null;
}
```

---
### useToggleFavourite

* **Назначение:** Мутация‑переключатель «добавить / удалить в избранное» для текущего пользователя.
* **Функционал:**
  * Если локация не любима → `POST /rest/v1/favourites { user_id, location_id }`.
  * Иначе → `DELETE /rest/v1/favourites?user_id=eq.{uid}&location_id=eq.{id}`.
  * Оптимистично обновляет `favorites` в Zustand (`toggleFavorite(id)`) и инвалидирует `['favourites', userId]`, `['location', id]`, `['locations']`.
* **Использование:** Вызывается внутри LocationCard при клике на иконку избранное⭐
**Актаульный код useToggleFavourite.js:**
```js
'use client';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
/**
 * useToggleFavourite(id) — возвращает функцию‑обработчик, которую нужно вызывать
 * при клике на «звёздочку». Хук:
 *  • Оптимистично переключает локальный флаг избранного в Zustand;
 *  • POST /DELETE в таблицу favourites;
 *  • Инвалидирует кеши favourites, location, locations;
 *  • Если пользователь не авторизован — открывает LoginModal.
 * @param {string} locationId UUID локации
 * @returns {() => void} функция‑обработчик
 */
export function useToggleFavourite(locationId) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const queryClient = useQueryClient();
  const setLoginModal = useUIStore((s) => s.setLoginModal);
  const favouritesMap  = useUIStore((s) => s.favourites);
  const toggleFavouriteLocal = useUIStore((s) => s.toggleFavourite);
  /** Реальный запрос к Supabase */
  const mutation = useMutation({
    mutationFn: async (isCurrentlyFav) => {
      if (!userId) throw new Error('auth-required');

      if (isCurrentlyFav) {
        // удалить
        const { error } = await supabase
          .from('favourites')
          .delete()
          .eq('user_id', userId)
          .eq('location_id', locationId);
        if (error) throw error;
      } else {
        // добавить
        const { error } = await supabase
          .from('favourites')
          .insert({ user_id: userId, location_id: locationId });
        if (error) throw error;
      }
    },
    // ---------- optimistic update ----------
    onMutate: async () => {
      const prevIsFav = Boolean(favouritesMap[locationId]);
      toggleFavouriteLocal(locationId);                 // локальный optimistic
      await queryClient.cancelQueries(['favourites', userId]);
      return { prevIsFav };
    },

    onError: (err, _vars, ctx) => {
      if (err?.message === 'auth-required') {
        setLoginModal(true);                            // открыть модалку логина
        return;
      }
      // откат optimistic‑переключения
      toggleFavouriteLocal(locationId);
      if (ctx?.prevIsFav !== undefined) {
        queryClient.setQueryData(['favourites', userId], (old) => old);
      }
      toast.error(err.message || 'Не удалось обновить избранное');
    },

    onSuccess: () => {
      queryClient.invalidateQueries(['favourites', userId]);
      queryClient.invalidateQueries(['location', locationId]);
      queryClient.invalidateQueries(['locations']);
    },
  });
  /** Хэндлер, который будет привязан к onClick */
  return useCallback(() => {
    if (!userId) {
      // не авторизован — просто показываем LoginModal
      setLoginModal(true);
      return;
    }
    mutation.mutate(Boolean(favouritesMap[locationId]));
  }, [mutation, userId, favouritesMap, locationId, setLoginModal]);
}
```

---
### FavouriteFetcher

* **Назначение:** Компонент `FavouriteFetcher` обеспечивает актуализацию избранных локаций пользователя при изменении состояния аутентификации.
* **Функционал:**
  * Получает ID текущего пользователя из хука `useAuth`.
  * При наличии авторизованного пользователя запрашивает его избранные локации из таблицы `favourites` в Supabase.
  * Гидратирует локальное хранилище Zustand, устанавливая флаги избранного для соответствующих `location_id`.
  * При отсутствии пользователя (логауте) очищает локальное состояние и удаляет соответствующие кэш-запросы из React Query.
**Актаульный код FavouriteFetcher.js:**
```js
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useUIStore } from '@/store/uiStore';

export default function FavouriteFetcher() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const hydrateFavourites = useUIStore((s) => s.hydrateFavourites);

  useEffect(() => {
    if (userId) {
      // При логине — подгружаем current favourites
      (async () => {
        try {
          const data = await queryClient.fetchQuery({
            queryKey: ['favourites', userId],
            queryFn: async () => {
              const { data, error } = await supabase
                .from('favourites')
                .select('location_id')
                .eq('user_id', userId);
              if (error) throw error;
              return data;
            },
          });
          // гидратируем Zustand-мэп: { [locationId]: true }
          hydrateFavourites(data.map((f) => f.location_id));
        } catch (e) {
          console.error('FavouriteFetcher:', e);
        }
      })();
    } else {
      // При логауте — сбрасываем локальное состояние и чистим кеш
      hydrateFavourites([]);
      queryClient.removeQueries({ queryKey: ['favourites'] });
    }
  }, [userId, queryClient, hydrateFavourites]);

  return null;
}
```

---