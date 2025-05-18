# **Справочник компонентов и хуков BatumiTrip**

> Этот документ является единым источником истины (source of truth) о текущей структуре и состоянии кода проекта Batumi Trip. Он служит опорой для AI‑генератора кода и всей команды разработчиков, предоставляя детальные описания существующих компонентов, хуков и утилит. Используя этот справочник, AI сможет корректно генерировать и модифицировать код, опираясь на актуальные реализации и внутренние соглашения по стилю.

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
### DestinationHubPage `app/page.js`

* **Назначение:** главная страница-хаб, отображающая весь существующие направления, содержащие список локаций пользователя.
* **Взаимодействие:** Загружает список направлений через `useDirections()`. Пока данные в пути ― показывает `SkeletonCard` и `Header`. После успешной загрузки выводит `DestinationCard` на каждое направление, либо дружелюбный call-to-action, если направлений нет. Сброс `activeDirection` при монтировании.
**Актаульный код DestinationHubPage:**
```js
'use client';
import { useEffect } from 'react';
import Header from '@/components/Header';
import TagsPrefetcher from '@/lib/TagsPrefetcher';
import SkeletonCard from '@/components/SkeletonCard';
import DestinationCard from '@/components/DestinationCard';
import AddDestinationButton from '@/components/AddDestinationButton';
import { useDirections } from '@/hooks/directionsHooks';
import { useUIStore } from '@/store/uiStore';

export default function DestinationHubPage() {
  // Получаем список направлений
  const {
    data: directions = [],
    isLoading,
    isError,
  } = useDirections();
  // Сбрасываем активную ветку в Zustand при входе на хаб
  const setActiveDirection = useUIStore((s) => s.setActiveDirection);
  useEffect(() => {
    setActiveDirection(null);
  }, [setActiveDirection]);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Префетчим теги для SearchBar */}
      <TagsPrefetcher />
      <Header />
      {/* Сетка направлений: Mobile First — 1 колонка, sm+: 2 */}
      <div id="destinationGrid" className="grid grid-cols-1 gap-4">
        {/* Во время загрузки показываем 4 скелетона */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        {/* Ошибка загрузки */}
        {isError && (
          <p className="col-span-full text-center text-destructive">
            Не удалось загрузить направления.
          </p>
        )}
        {/* Данные получены */}
        {!isLoading &&
          !isError &&
          directions.map((dir) => (
            <DestinationCard key={dir.id} direction={dir} />
          ))}
        {/* Пустой список */}
        {!isLoading && !isError && directions.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            У вас пока нет направлений. Нажмите «Добавить» и создайте первое!
          </p>
        )}
      </div>
      {/* Плавающая кнопка «Добавить направление» */}
      <AddDestinationButton />
    </main>
  );
}
```

---
### LocationListPage `app/destination/[dirId]/page.js`

* **Назначение:** Страница-лендинг, отображающая весь интерфейс поиска и просмотра списка локаций пользователей.
* **Взаимодействие:** На странице располагаются `SearchBar`, `AddLocationButton` и `LocationList`. При загрузке инициируется хук `useLocations`, который подгружает первые локации. Пользователь может вводить текст поиска (сохраняется в Zustand), и запрос динамически фильтруется. Когда данных нет или пользователь только что вошел, `LocationList` показывает `SkeletonCard`. Читает dirId из params. Выставляет uiStore.activeDirectionId.
**Актаульный код LocationListPage:**
```js
'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import TagsPrefetcher from '@/lib/TagsPrefetcher';
import LocationList from '@/components/LocationList';
import AddLocationButton from '@/components/AddLocationButton';
import FavouriteFilterButton from '@/components/FavouriteFilterButton';
import { useUIStore } from '@/store/uiStore';

export default function LocationListPageWrapper() {
  const { dirId } = useParams();
  const setActiveDirection = useUIStore((s) => s.setActiveDirection);
  /* выставляем активную ветку и сбрасываем при размонтировании */
  useEffect(() => {
    setActiveDirection(dirId || null);
    return () => setActiveDirection(null);
  }, [dirId, setActiveDirection]);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <TagsPrefetcher />
      <Header />
      <LocationList />
      <AddLocationButton />
      <FavouriteFilterButton />
    </main>
  );
}
```

---
### AddLocationPage - `app/destination/[dirId]/locations/new/page.js`

* **Назначение:** Страница с формой создания новой локации.
* **Взаимодействие:** Содержит `LocationForm` без `initialData`. Сабмит формы вызывает `useAddLocation().mutate(data)`, а при успехе перенаправляет на детальную страницу новой локации.
**Актаульный код AddLocationPage:**
```js
'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LocationForm from '@/components/LocationForm';
import { useUIStore } from '@/store/uiStore';

export default function AddLocationPage() {
  const { dirId } = useParams();
  const setActiveDirection = useUIStore((s) => s.setActiveDirection);
  // Устанавливаем activeDirectionId при монтировании и сбрасываем при размонтировании
  useEffect(() => {
    setActiveDirection(dirId || null);
    return () => {
      setActiveDirection(null);
    };
  }, [dirId, setActiveDirection]);

  return (
    <main className="container mx-auto px-4 py-6">
      <Header />
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
          <LocationForm
            initialData={location}
            onSuccess={() => {
              setIsEditing(false);
            }}
          />
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
**Актаульный код Header.js:**
```js
"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import animationData from "@/public/userAnimation.json";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/LoginModal";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function Header({ className }) {
  const { user, signOut } = useAuth();
  const setLoginModal = useUIStore((s) => s.setLoginModal);
  const activeDirectionId = useUIStore((s) => s.activeDirectionId);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const lottieRef = useRef(null);
  const handleLoginClick = () => setLoginModal(true);
  const toggleSearch = () => setSearchOpen((o) => !o);
  /** Запускаем один цикл анимации при нажатии */
  const playAnimation = () => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0, true);
    }
  };

  return (
    <>
      {/* ---------- Шапка ---------- */}
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
        {/* Логотип */}
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
        {/* Иконка поиска (только на странице направления) */}
        {activeDirectionId && (
          <button
            onClick={toggleSearch}
            aria-label="Поиск"
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Search className="h-6 w-6" aria-hidden="true" />
          </button>
        )}

        {/* ---------- Auth-блок ---------- */}
        {user ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <div
                role="button"
                aria-label="Меню пользователя"
                className="h-10 w-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={playAnimation}
              >
                <Lottie
                  lottieRef={lottieRef}
                  animationData={animationData}
                  loop={false}
                  autoplay={false}
                  className="h-10 w-10"
                />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="block w-full text-center uppercase truncate select-none tracking-wide px-2 py-1">
                {user.id}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  signOut();
                }}
                className="text-destructive focus:text-destructive"
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      {/* ---------- Поисковая строка (только на странице направления) ---------- */}
      <AnimatePresence>
        {activeDirectionId && isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-4 py-2 flex justify-end">
              <SearchBar placeholder="Давайте найдём что-то интересное 🧐" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ---------- Модалка логина ---------- */}
      <LoginModal />
    </>
  );
}
```

---
### DestinationCard

* **Назначение:** Карточка-превью для Турестических направлений
* **Взаимодействие:** Показывает обложку (cover_url) и название. При клике ведёт во внутренний список локаций `/destination/{id}`. Обложка берётся из `direction.cover_url`; если нет — используется placeholder. 
**Актаульный код DestinationCard.js:**
```js
'use client';
import React, { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteDirection } from '@/hooks/directionsHooks';
import DestinationModal from '@/components/DestinationModal';
import LocationCount from '@/components/LocationCount';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus } from 'lucide-react';
import { useLocationForCard } from '@/hooks/useLocationForCard';
import RandomLocation from '@/components/RandomLocation';
import Flag from 'react-world-flags';
import { Button } from '@/components/ui/button';
/**
 * @param {{
 *   id: string;
 *   title: string;
 *   cover_url?: string|null;
 *   user_id: string;
 *   country: string;        // ISO-код (Alpha-2) для EmojiFlag
 *   city?: string|null;
 * }} props.direction
 */
function DestinationCard({ direction }) {
  const {
    id,
    title,
    cover_url: coverUrl,
    user_id: authorId,
    country,
    city,
  } = direction;

  const { user } = useAuth();
  const deleteMutation = useDeleteDirection();
  const [isModalOpen, setModalOpen] = useState(false);
  const canEdit = user?.id === authorId;
  const { data: randomLocations = [] } = useLocationForCard(id);

  const handleDelete = () => {
    if (
      window.confirm(
        'Вы уверены? Это удалит направление и все связанные с ним локации. Действие необратимо.',
      )
    ) {
      deleteMutation.mutate({ id, coverUrl });
    }
  };
  /* fallback, если coverUrl пустой или не http/https */
  const imageSrc =
    coverUrl && /^https?:\/\//.test(coverUrl)
      ? coverUrl
      : 'https://cataas.com/cat/gif';

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.02 }}
        className={cn(
          'group relative overflow-hidden rounded-2xl bg-card text-card-foreground shadow transition-shadow md:flex',
          'md:h-[25rem]' // фиксированная высота 25rem на десктопе
        )}
      >
        {/* ----- меню “три точки” для автора ----- */}
        {canEdit && (
          <div className="absolute right-2 top-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Меню направления"
                  className="rounded-full bg-muted p-2 backdrop-blur hover:bg-muted/90 focus:outline-none"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setModalOpen(true)}>
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={handleDelete}
                >
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {/* ссылка охватывает оба блока: контент + изображение */}
        <Link
          href={`/destination/${id}`}
          className="flex flex-1 flex-col md:flex-row-reverse no-underline hover:no-underline focus:no-underline"
        >
          {/* изображение */}
          <div className="relative h-44 w-full shrink-0 md:h-full md:w-2/3">
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (min-width: 768px) 66vw"
              className="object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.4)_100%)]" />
          </div>
          {/* текстовый блок */}
          <div className="flex w-full flex-col justify-between p-4 md:w-1/3">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-2xl font-semibold leading-tight line-clamp-2">
                <Flag code={country.toUpperCase()} height="32" width="32" />
                {title}
              </h3>
              {city && (
                <p className="text text-muted-foreground line-clamp-1">
                  {city}
                </p>
              )}
            </div>
            {/* Random locations or Add button */}
            {randomLocations.length > 0 ? (
              <div className="sm:p-4 pt-4">
                <div className="grid grid-cols-1 md:gap-y-6 gap-y-4">
                  {randomLocations.map(loc => (
                    <RandomLocation key={loc.id} location={loc} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="sm:p-4 pt-4 flex justify-center">
                <Button
                  asChild
                  className="w-full hover:no-underline focus:no-underline sm:w-auto flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-primary text-primary-foreground"
                >
                  <Link href={`/destination/${id}/locations/new`}>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Добавить локацию</span>
                  </Link>
                </Button>
              </div>
            )}
            {/* счётчик локаций — выделен стилизацией */}
            <div className="mt-4 md:mt-0 transform hover:scale-[1.08] transition duration-200">
              <span className="flex justify-center items-center gap-x-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                <LocationCount directionId={id} />
                <span> locations</span>
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
      {/* модалка редактирования */}
      {isModalOpen && (
        <DestinationModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          initialData={direction}
        />
      )}
    </>
  );
}
export default memo(DestinationCard);
```

---
### AddDestinationButton

* **Назначение:** Плавающая кнопка «Добавить направление».
* **Взаимодействие:** по клику открывает `DestinationModal`. Cкрыта для гостей.
**Актаульный код AddDestinationButton.js:**
```js
"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import DestinationModal from "@/components/DestinationModal";

export default function AddDestinationButton({ className = "" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button
        type="button"
        aria-label="Добавить направление"
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 ${className}`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Добавить направление</span>
      </Button>

      <DestinationModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

---
### DestinationModal

* **Назначение:** Модалка для создания/редактирования Карточек туристических направлений.
* **Взаимодействие:** Выпадающий список стран с флагами (`shadcn Select` + `react‑emoji‑flag`). Интеграция с `react‑hook‑form` через `useController`.
**Актаульный код DestinationModal.js:**
```js
"use client";
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AttachImage from "@/components/AttachImage";
import { useForm, useController } from "react-hook-form";
import countries from "i18n-iso-countries";
import ru from "i18n-iso-countries/langs/ru.json";
import EmojiFlag from "react-emoji-flag";
import { useAddDirection, useUpdateDirection } from "@/hooks/directionsHooks";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/uiStore";

// ---------- Подготовка справочника стран ---------- //
countries.registerLocale(ru);
const countryOptions = Object.entries(
  countries.getNames("ru", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "ru"));

function CountrySelect({ control, name = "country", rules }) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name, rules });
  return (
    <div className="space-y-1">
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-label="Страна">
          <SelectValue placeholder="Страна" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {countryOptions.map(({ code, name }) => (
            <SelectItem key={code} value={code} className="flex items-center gap-2">
              <EmojiFlag countryCode={code} style={{ fontSize: "1rem" }} />
              <span>{name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive-foreground">{error.message}</p>
      )}
    </div>
  );
}

export default function DestinationModal({
  isOpen,
  onClose,
  initialData = null, // { id, title, country, city, cover_url }
}) {
  const isEditMode = Boolean(initialData?.id);
  // ---------- react‑hook‑form ---------- //
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      title: initialData?.title ?? "",
      country: initialData?.country ?? "",
      city: initialData?.city ?? "",
      coverFile: null,
    },
  });
  // эскиз: сохраняем черновик в zustand (если понадобится recovery)
  const setDraft = useUIStore((s) => s.setDirectionDraft);
  useEffect(() => {
    const subscription = watch((values) => setDraft(values));
    return () => subscription.unsubscribe();
  }, [watch, setDraft]);
  // ---------- мутации ---------- //
  const addMutation = useAddDirection();
  const updateMutation = useUpdateDirection();
  // ---------- submit ---------- //
  const onSubmit = async (values) => {
    if (isEditMode) {
      updateMutation.mutate(
        {
          id: initialData.id,
          data: {
            title: values.title.trim(),
            country: values.country,
            city: values.city.trim() || null,
            coverFile: values.coverFile,
            oldCoverUrl: initialData.cover_url,
          },
        },
        {
          onSuccess: () => {
            toast.success("Направление обновлено");
            setDraft(null);
            onClose();
          },
        }
      );
    } else {
      addMutation.mutate(
        {
          title: values.title.trim(),
          country: values.country,
          city: values.city.trim() || null,
          coverFile: values.coverFile, // required в useAddDirection
        },
        {
          onSuccess: () => {
            toast.success("Направление создано");
            setDraft(null);
            onClose();
          },
        }
      );
    }
  };

  const isSubmitting = addMutation.isLoading || updateMutation.isLoading;
  // ---------- UI ---------- //
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-background/30 backdrop-blur-sm" />

        <DialogContent className="w-full max-w-md overflow-y-auto rounded-xl bg-card text-card-foreground shadow-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            {/* ---------- Header ---------- */}
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {isEditMode ? "Редактировать направление" : "Создать направление"}
              </DialogTitle>
            </DialogHeader>
            {/* ---------- Form ---------- */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-4"
              aria-label="Форма направления"
            >
              {/* Название */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Название<span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  {...register("title", { required: "Обязательное поле" })}
                  className="mt-1 w-full"
                />
                {errors.title && (
                  <p className="text-sm text-destructive-foreground mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              {/* Страна */}
              <div>
                <label className="block text-sm font-medium">
                  Страна<span className="text-destructive">*</span>
                </label>
                <CountrySelect
                  control={control}
                  name="country"
                  rules={{ required: "Выберите страну" }}
                />
              </div>
              {/* Город */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium">
                  Город
                </label>
                <Input
                  id="city"
                  {...register("city")}
                  className="mt-1 w-full"
                />
              </div>
              {/* Обложка */}
              <div>
                <label className="block text-sm font-medium">
                  Обложка<span className="text-destructive">*</span>
                </label>
                <AttachImage
                  control={control}
                  name="coverFile"
                  rules={
                    isEditMode
                      ? undefined
                      : { required: "Изображение обязательно" }
                  }
                  initialUrl={initialData?.cover_url}
                  className="mt-1"
                />
              </div>
              {/* Footer */}
              <DialogFooter className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? "Сохраняем…"
                      : "Создаём…"
                    : isEditMode
                    ? "Сохранить"
                    : "Создать"}
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
```

---
### SearchBar

* **Назначение:** Поле поиска по заголовкам
* **Взаимодействие:** Пользователь вводит текст, он сохраняется в глобальном состоянии (например, Zustand) как текущий поисковый запрос (`searchQuery`). Поисковое состояние используют `useLocations` или компонент списка для фильтрации вывода. Возможна функциональность debounce (задержка поиска после ввода) для оптимизации запросов.
**Актаульный код SearchBar.js:**
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
 * SearchBar — поле ввода + список тегов-фильтров.
 *
 * •  Данные ввода → Zustand (`searchQuery`) c debounce = 1 сек.
 * •  Теги грузятся через useTags() и отображаются под инпутом.
 * •  Клик по тегу переключает его в Zustand (`toggleTag` внутри TagBadge).
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
  }, [searchQuery, value]);
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
        {/** оставляем тег-бар даже когда идёт загрузка, чтобы высота была стабильна */}
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
### RandomLocation

* **Назначение:** Mini card for a random location: small photo and title.
**Актаульный код RandomLocation.js:**
```js
'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
/**
 * @param {{ location: { id: string, title: string, image_url: string|null, direction_id: string } }} props
 */
export default function RandomLocation({ location }) {
  const router = useRouter();
  const { id, title, image_url, direction_id } = location;
  const imageSrc =
    image_url && /^https?:\/\//.test(image_url)
      ? image_url
      : 'https://cataas.com/cat/gif';

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/destination/${direction_id}/locations/${id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 min-w-0 rounded-2xl',
        'hover:underline focus:underline focus:outline-none',
        'transform hover:scale-[1.05] transition duration-200'
      )}
    >
      <div className="relative h-12 w-16 md:h-14 md:w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <span className="flex-1 text-left min-w-0 font-medium text-card-foreground truncate">
        {title}
      </span>
    </button>
  );
}
```

---
### LocationCount

* **Назначение:** Отображает количество локаций для заданного направления.
**Актаульный код LocationCount.js:**
```js
'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
/**
 * @param {{ directionId: string }} props
 */
export default function LocationCount({ directionId }) {
  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['locationCount', directionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .eq('direction_id', directionId);
      if (error) throw error;
      return count;
    },
    staleTime: 60_000,
  });
  return (
    <p className="inline-flex items-center bg-primary text-primary-foreground rounded-full text-sm font-semibold">
      {isLoading ? 'Загрузка…' : `${count}`}
    </p>
  );
}
```

---
### AddLocationButton

* **Назначение:** Кнопка для перехода к форме создания новой локации.
* **Взаимодействие:** На главной странице располагается в удобном месте (например, в шапке или снизу). При нажатии переводит на маршрут `/destination/[dirId]/locations/new`. Использует Next.js `<Link>` или `useRouter().push`. Может быть всегда видимой при прокрутке страницы (fixed position).
**Актаульный код AddLocationButton.js:**
```js
'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';

export default function AddLocationButton({ className = "" }) {
  const { user } = useAuth();
  const activeDirectionId = useUIStore((s) => s.activeDirectionId);
  // Показываем кнопку только если есть авторизованный юзер и выбрано направление
  if (!user || !activeDirectionId) return null;

  return (
    <Button
      asChild
      className={`fixed hover:no-underline focus:no-underline bottom-4 right-4 z-50 flex items-center gap-2 ${className}`}
      aria-label="Добавить локацию"
    >
      <Link href={`/destination/${activeDirectionId}/locations/new`}>
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Добавить локацию</span>
      </Link>
    </Button>
  );
}
```

---
### FavouriteFilterButton

* **Назначение:** Кнопка для фильтрации `LocationList`по избранному.
* **Взаимодействие:** На главной странице располагается снизу слева. При нажатии переводит обновляет `uiStore`. Dсегда видимый при прокрутке страницы (fixed position).
**Актаульный код FavouriteFilterButton.js:**
```js
'use client';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function FavouriteFilterButton({ className = '' }) {
  // 1) хуки всегда на самом верху
  const { user } = useAuth();
  const showOnlyFavourites = useUIStore((s) => s.showOnlyFavourites);
  const toggle = useUIStore((s) => s.toggleShowOnlyFavourites);
  // 2) только после этого — ранний return для неавторизованных
  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn('fixed bottom-4 left-4 z-50', className)}
    >
      <Button
        variant={showOnlyFavourites ? 'secondary' : 'outline'}
        size="icon"
        aria-label={
          showOnlyFavourites
            ? 'Показать все локации'
            : 'Показать только избранные'
        }
        onClick={toggle}
        className="rounded-full shadow-lg"
      >
        <Star
          className="h-5 w-5"
          stroke="currentColor"
          fill={showOnlyFavourites ? 'currentColor' : 'none'}
        />
      </Button>
    </motion.div>
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
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useLocations } from "@/hooks/useLocations";
import SkeletonCard from "@/components/SkeletonCard";
import LocationCard from "@/components/LocationCard";
/**
 * LocationList — контейнер для списка карточек локаций.
 *
 * • Бесконечная прокрутка (useInfiniteQuery + Intersection Observer).
 * • Realtime‑подписка на INSERT / UPDATE / DELETE в таблице `locations`.
 *   ◦ INSERT — инвалидируем кэш, чтобы подтянуть новую локацию.
 *   ◦ UPDATE — патчим элемент в кэше без полного рефетча.
 *   ◦ DELETE — удаляем элемент из кэша.
 */
export default function LocationList() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLocations();

  const { ref, inView } = useInView();
  const queryClient = useQueryClient();

  /* ---------- Infinite Scroll ---------- */
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  /* ---------- Realtime subscription ---------- */
  useEffect(() => {
    const channel = supabase
      .channel("realtime:locations-changes")
      // INSERT — просто инвалидируем, чтобы дошли новые записи
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "locations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["locations"] });
        }
      )
      // UPDATE — точечно патчим кэш, избегая полного запроса
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "locations" },
        ({ new: newRow }) => {
          queryClient.setQueriesData({ queryKey: ["locations"] }, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.id === newRow.id ? { ...item, ...newRow } : item
                ),
              })),
            };
          });
        }
      )
      // DELETE — удаляем карточку из кэша
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "locations" },
        ({ old: oldRow }) => {
          queryClient.setQueriesData({ queryKey: ["locations"] }, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => item.id !== oldRow.id),
              })),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  /* ---------- Render ---------- */
  if (isLoading) {
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
        {data.pages.map((page) =>
          page.items.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))
        )}
      </div>
      <div ref={ref} className="py-8 text-center">
        {isFetchingNextPage
          ? "Загрузка..."
          : hasNextPage
          ? "Прокрутите вниз для загрузки новых"
          : "Нет локаций. Добавьте свою 😉"}
      </div>
    </>
  );
}
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
import { useState, useEffect, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import {
  Dialog,
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
import dynamic from "next/dynamic";
import animationData from "@/public/loginAnimation.json";
// ---------- lazy‑загрузка Lottie ----------
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function LoginModal() {
  /* ----- глобальный UI‑state (Zustand) ----- */
  const show = useUIStore((s) => s.showLoginModal);
  const setShow = useUIStore((s) => s.setLoginModal);
  /* ----- auth‑статус ----- */
  const { status } = useSession();
  /* ----- локальный стэйт формы ----- */
  const [login, setLogin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  /* ----- автопоказ, если пользователь не авторизован ----- */
  useEffect(() => {
    if (status === "unauthenticated" && !show) setShow(true);
  }, [status, show, setShow]);
  /* ----- закрыть МОДАЛКУ только ПОСЛЕ успешного логина ----- */
  useEffect(() => {
    if (status === "authenticated") setShow(false);
  }, [status, setShow]);
  /* ----- валидация и отправка формы ----- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = login.trim();
    const re = /^[A-Za-z\u0400-\u04FF]{3,32}$/; // 3–32 буквы (лат/кирилл)
    if (!re.test(trimmed)) {
      setError("Неверное имя: 3–32 символа, только буквы.");
      return;
    }
    setError("");
    setSubmitting(true);
    await signIn("credentials", { username: trimmed, redirect: false });
    setSubmitting(false);
  };
  /* ----- фильтруем onOpenChange, запрещая закрывать окно ----- */
  const handleOpenChange = useCallback(
    /** @param {boolean} next */ (next) => {
      if (next) setShow(true); // permit only attempts to OPEN, ignore close
    },
    [setShow]
  );

  return (
    <AnimatePresence>
      {show && (
        <Dialog open={show} onOpenChange={handleOpenChange}>
          <DialogPortal>
            {/* размытый фон вместо затемнения */}
            <DialogOverlay className="fixed inset-0 bg-background/30 backdrop-blur-sm" />

            <DialogContent
              /* скрываем стандартный крестик внутри Content */
              className="w-full max-w-sm overflow-hidden rounded-xl bg-card text-card-foreground shadow-lg [&>button]:hidden"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                {/* ---------- Header ---------- */}
                <DialogHeader className="flex flex-col items-center px-6 pt-6">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0.1 }}
                    animate={{ scale: 1.8, opacity: 1 }}
                    transition={{ duration: 6 }}
                    className="mb-4 h-24 w-24"
                  >
                    <Lottie animationData={animationData} loop autoplay />
                  </motion.div>

                  <DialogTitle className="text-center text-xl font-semibold">
                    Авторизация
                  </DialogTitle>
                  <p className="mt-2 text-center text-sm italic text-muted-foreground">
                    Введите Имя и запомните его.<br />Оно будет связано с
                    Вашими локациями. <br /> Регистр имеет значение.
                  </p>
                </DialogHeader>
                {/* ---------- Form ---------- */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 px-6 pb-6 pt-4"
                  aria-label="Форма входа"
                >
                  <Input
                    id="username"
                    placeholder="Познакомимся?"
                    autoComplete="username"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="peer"
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
                        className="overflow-hidden rounded border border-red-300 bg-red-100 p-2 text-sm text-red-800"
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
"use client";
import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import TagBadge from "@/components/TagBadge";
import { useUIStore } from "@/store/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useToggleFavourite } from "@/hooks/useToggleFavourite";
/**
 * LocationCard — карточка‑превью локации.
 * • Иконка избранного перенесена под изображение — выравнена
 *   по правому краю заголовка (flex‑контейнер).  
 * • Заголовок ограничен двумя строками через `line-clamp-2`.
 * • Фон карточки — переменная `card`, текст — `card-foreground`.
 */
const LocationCard = ({ location }) => {
  const {
    id,
    title,
    description,
    imgUrl,
    tags = [],
    isFavourite: initialFavourite = false,
  } = location;
  /* ---------- global UI state ---------- */
  const selectedTags = useUIStore((s) => s.selectedTags);
  const favouritesMap = useUIStore((s) => s.favourites);
  const showOnlyFavourites = useUIStore((s) => s.showOnlyFavourites);
  const isFavourite = favouritesMap[id] ?? initialFavourite;
  /* ---------- auth ---------- */
  const { user } = useAuth();
  /* tag‑filter + «only favourites» filter */
  const matchesFilter =
    (!showOnlyFavourites || isFavourite) &&
    (selectedTags.length === 0 ||
      selectedTags.every((tag) => tags.includes(tag)));
  /* optimistic toggle favourite */
  const toggleFavourite = useToggleFavourite(id);
  /* fallback image */
  const imageSrc =
    imgUrl && /^https?:\/\//.test(imgUrl)
      ? imgUrl
      : "https://cataas.com/cat/gif";

  if (!matchesFilter) return null;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-2xl bg-card text-card-foreground p-4 shadow transition-shadow"
    >
      {/* ссылка охватывает интерактивную область просмотра */}
      <Link href={`/locations/${id}`} className="block no-underline hover:no-underline focus:no-underline">
        <Image
          src={imageSrc}
          alt={title}
          width={400}
          height={240}
          className="h-40 w-full rounded-lg object-cover"
        />
        {/* ---------- Header: title & favourite ---------- */}
        <div className="mt-4 flex items-start justify-between gap-2">
          <h3 className="flex-1 text-lg font-semibold line-clamp-2 text-white">
            {title}
          </h3>
          {/* звезда — только для авторизованных */}
          {user && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleFavourite();
              }}
              aria-label={
                isFavourite ? "Убрать из избранного" : "Добавить в избранное"
              }
              className={cn(
                "rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                isFavourite
                  ? "text-yellow-500"
                  : "text-gray-400 hover:text-yellow-500"
              )}
            >
              <Star
                size={20}
                stroke="currentColor"
                fill={isFavourite ? "currentColor" : "none"}
              />
            </button>
          )}
        </div>
        {/* ---------- Description ---------- */}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {description}
        </p>
      </Link>
      {/* ---------- Tags ---------- */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
        </div>
      )}
    </motion.div>
  );
};
export default memo(LocationCard);
```

---
### LocationDetail

* **Назначение:** Компонент отображения подробных данных локации (используется на `LocationDetailPage`).
* **Взаимодействие:** Показывает большие изображение и все текстовые поля локации. Теги выводит через `TagBadge`. Кнопки `EditButton` и `DeleteButton` (связанные с тем же `id`) располагаются рядом. Адрес можно сделать кликабельным (ссылка на Google Maps), `sourceUrl` — внешний ресурс.
**Актаульный код LocationDetail.js:**
```js
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import TagBadge from '@/components/TagBadge';
import { cn } from '@/lib/utils';

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
    user_id: authorId,
    direction_id: dirId,
  } = location;

  const imageSrc =
    imgUrl && /^https?:\/\//.test(imgUrl)
      ? imgUrl
      : 'https://cataas.com/cat/gif';

  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* 1. Изображение */}
      <div className="relative aspect-video md:h-96 max-w-screen-md mx-auto overflow-hidden rounded-2xl bg-muted shadow-lg border-2 border-primary/20">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
        )}
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          priority
          className={cn(
            'object-cover transition-opacity duration-500',
            imgLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImgLoaded(true)}
        />
      </div>
      {/* 2. Автор + теги + Заголовок */}
      <header className="bg-primary/10 p-4 rounded-xl">
        <h1 className="text-3xl font-bold text-primary-foreground break-words">
          {title}
        </h1>
        {tags.length > 0 && (
          <div className="flex flex-wrap mt-4 gap-2">
            {tags.map((tag) => (
              <TagBadge key={tag} name={tag} />
            ))}
          </div>
        )}
        <span className="inline-block rounded-md bg-muted mt-4 px-3 py-1 text-sm font-semibold text-foreground select-none">
          Автор: {authorId}
        </span>
      </header>
      {/* 3. Описание */}
      {description && (
        <section className="bg-muted/20 p-4 rounded-xl">
          <div className="prose max-w-none dark:prose-invert">
            <p>{description}</p>
          </div>
        </section>
      )}
      {/* 4. Дополнительная информация */}
      {(address || cost || sourceUrl) && (
        <section className="bg-card/60 p-4 rounded-xl ring-1 ring-border border-2 border-accent/30 backdrop-blur-md">
          {address && (
            <p className="text-sm leading-relaxed">
              <strong className="font-medium">Адрес:&nbsp;</strong>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(
                  address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline break-words"
              >
                {address}
              </a>
            </p>
          )}
          {cost && (
            <p className="text-sm">
              <strong className="font-medium">Стоимость:&nbsp;</strong>
              {cost}
            </p>
          )}
          {sourceUrl && (
            <p className="text-sm break-all">
              <strong className="font-medium">Источник:&nbsp;</strong>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {sourceUrl}
              </a>
            </p>
          )}
        </section>
      )}
      {/* Кнопка «Назад» */}
      <div className="flex items-center gap-4 pt-4">
        <Button
          variant="secondary"
          onClick={() => router.push(`/destination/${dirId}`)}
        >
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
### FormNavigation

* **Назначение:** Нижняя навигация формы: «Назад» | «Далее»/«Сохранить».
**Актаульный код FormNavigation.js:**
```js
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
/* анимированная обёртка для shadcn‑кнопок */
const MotionButton = motion(Button);

export default function FormNavigation({
  currentStep,
  totalSteps,
  onBack,
  isSubmitting,
  className = '',
}) {
  const isLast = currentStep === totalSteps;

  return (
    <div
      className={cn(
        /* mobile — fixed bottom bar */
        'fixed bottom-0 left-0 z-40 w-full border-t border-border bg-card/90 backdrop-blur-md px-4 py-3',
        /* desktop — как было */
        'md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0',
        'flex justify-between',
        className,
      )}
    >
      <MotionButton
        variant="outline"
        type="button"
        onClick={onBack}
        aria-label="Вернуться"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Назад
      </MotionButton>

      <MotionButton
        type="submit"
        disabled={isSubmitting}
        aria-label={isLast ? 'Сохранить' : 'Следующий шаг'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isLast
          ? isSubmitting
            ? 'Сохраняем…'
            : 'Сохранить'
          : 'Далее'}
      </MotionButton>
    </div>
  );
}
```

---
### FormHeader

* **Назначение:** Заголовок формы с Круговой индикатор прогресса с числовым отображением шага.
**Актаульный код FormHeader.js:**
```js
'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function CircleProgress({ current, total, size = 48, stroke = 4 }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = current / total;
  const offset = circ * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-primary"
      aria-hidden="true"
    >
      {/* фон */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        opacity={0.15}
        fill="none"
      />
      {/* прогресс — поворачиваем сам путь, а не весь svg */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circ}
        initial={false}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* числовой счётчик — остаётся горизонтальным */}
      <motion.text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.28}
        fill="currentColor"
        className="origin-center text-foreground select-none"
        key={current}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.35 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {`${current}/${total}`}
      </motion.text>
    </svg>
  );
}

export default function FormHeader({
  currentStep,
  totalSteps,
  title,
  nextTitle,
  className = '',
}) {
  return (
    <header className={cn('mb-6 flex items-center gap-4', className)}>
      <CircleProgress current={currentStep} total={totalSteps} />
      <div className="flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={title}
            className="text-lg font-semibold leading-tight"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {title}
          </motion.h2>
        </AnimatePresence>
        {nextTitle && (
          <span className="text-xs text-muted-foreground">
            Далее:&nbsp;{nextTitle}
          </span>
        )}
      </div>
    </header>
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
          router.push(`/destination/${location.direction_id}`);
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
          <LocationForm
            initialData={location}
            onSuccess={() => {
              setIsEditing(false);
            }}
          />
        </>
      )}
    </main>
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

### useAuth.js

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
### query-keys.ts

* **Назначение:** Центральная точка для определения и типизации всех ключей кэша React Query в модуле «directions/locations». Обеспечивает единообразие и удобство рефакторинга при работе с query-keys.
* **Функционал:** 
  * Экспорт объекта qk с фабричными методами, возвращающими строго типизированные константные массивы для каждой группы данных:
    * `directions()`
    * `locations(dirId, search, tags)`
    * `location(id)`
    * `tags()`
    * `favourites(userId)`
  * Генерация сложных ключей с параметрами (dirId, search, tags, userId)
  * Тип QueryKeys, объединяющий все возможные варианты ключей из qk, для использования в обобщённых хелперах и middleware.
* **Использование:** В любых React-hook’ах и компонентах, работающих с данными “directions” и “locations”
**Актаульный код query-keys.ts:**
```ts
export const qk = {
  /** Flat list of destination branches that belong to the current user */
  directions: () => ["directions"] as const,
  /**
   * Infinite, filtered list of locations inside a branch.
   *
   * @param dirId  Direction UUID or `null` for the legacy root list
   * @param search Current search string from uiStore.searchQuery
   * @param tags   Selected tag names from uiStore.selectedTags
   */
  locations: (
    dirId: string | null,
    search: string,
    tags: string[],
  ) =>
    [
      "locations",
      {
        dir: dirId ?? "__root__",
        search,
        tags,
      },
    ] as const,
  /** Single location object */
  location: (id: string) => ["location", id] as const,
  /** Static dictionary of all tags */
  tags: () => ["tags"] as const,
  /** Favourites of a particular user (used for hydration & toggling) */
  favourites: (userId: string) => ["favourites", userId] as const,
} as const;

export type QueryKeys = ReturnType<(typeof qk)[keyof typeof qk]>;
```

---
### directionsHooks

* **Назначение:** Реализация CRUD‑хуков для сущности «Direction» (направление)
* **Функционал:** 
  * `useDirections` — список веток текущего пользователя
  * `useAddDirection` — создание ветки + загрузка cover в Storage
  * `useUpdateDirection` — изменение названия / cover (с заменой файла)
  * `useDeleteDirection` — каскадное удаление ветки и связанных локаций
* **Использование:** Все хуки следуют паттернам существующих useAddLocation / useUpdateLocation и единым key‑policy из query‑keys.ts
**Актаульный код directionsHooks.js:**
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { qk } from '@/lib/query-keys';
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';
import deleteImage from '@/lib/deleteImage';
/** Список направлений текущего пользователя */
export function useDirections() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: qk.directions(),
    // Запускаем только когда точно знаем, что пользователь авторизован
    enabled: status === 'authenticated',
    staleTime: 60_000,
    queryFn: async () => {
      // Без фильтра по user_id — получаем все направления
      const { data, error } = await supabase
        .from('directions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
/** Создать новое направление (RPC add_direction) */
export function useAddDirection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ title:string, country:string, city?:string|null, coverFile:File }} payload */
    mutationFn: async ({ title, country, city = null, coverFile }) => {
      if (!userId) throw new Error('Пользователь не авторизован');
      if (!coverFile) throw new Error('Обложка обязательна');

      // 1) Загрузка изображения в Storage
      const cover_url = await uploadImage(coverFile, userId);

      // 2) RPC‑вставка
      const { data, error } = await supabase.rpc('add_direction', {
        p_user_id: userId,
        p_title: title,
        p_country: country,
        p_city: city,
        p_cover_url: cover_url,
      });
      if (error) {
        // Откат загруженного файла при ошибке
        await deleteImage(cover_url).catch(() => {});
        throw error;
      }
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries(qk.directions());
      toast.success('Направление создано');
    },

    onError: (err) => {
      toast.error(err.message || 'Не удалось создать направление');
    },
  });
}
/** Обновить существующее направление (RPC update_direction) */
export function useUpdateDirection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * @param {{ id:string, data:{ title?:string, country?:string, city?:string|null, coverFile?:File|null, oldCoverUrl?:string|null } }} vars
     */
    mutationFn: async ({ id, data }) => {
      if (!userId) throw new Error('Пользователь не авторизован');

      const { title, country, city, coverFile, oldCoverUrl } = data;
      let cover_url = oldCoverUrl ?? null;
      const isCoverChanged = Boolean(coverFile);

      if (isCoverChanged) {
        cover_url = await uploadImage(coverFile, userId);
      }

      const { data: updated, error } = await supabase.rpc('update_direction', {
        p_user_id: userId,
        p_direction_id: id,
        p_title: title,
        p_country: country,
        p_city: city,
        p_cover_url: cover_url,
      });

      if (error) {
        if (isCoverChanged) await deleteImage(cover_url).catch(() => {});
        throw error;
      }

      // Удаляем старый cover после успешного обновления
      if (isCoverChanged && oldCoverUrl && oldCoverUrl !== cover_url) {
        deleteImage(oldCoverUrl).catch(() => {});
      }

      return updated;
    },

    onSuccess: () => {
      queryClient.invalidateQueries(qk.directions());
      toast.success('Направление обновлено');
    },

    onError: (err) => toast.error(err.message || 'Ошибка при обновлении направления'),
  });
}
/** Удалить направление + каскад локаций (RPC delete_direction) */
export function useDeleteDirection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ id:string, coverUrl?:string|null }} vars */
    mutationFn: async ({ id, coverUrl }) => {
      if (!userId) throw new Error('Пользователь не авторизован');

      const { error } = await supabase.rpc('delete_direction', {
        p_user_id: userId,
        p_direction_id: id,
      });
      if (error) throw error;
      // cover‑файл больше не нужен
      if (coverUrl) deleteImage(coverUrl).catch(() => {});

      return { id };
    },
    // ----- optimistic removal из списка -----
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries(qk.directions());
      const prev = queryClient.getQueryData(qk.directions());
      queryClient.setQueryData(qk.directions(), (old = []) =>
        old.filter((d) => d.id !== id),
      );
      return { prev };
    },

    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.directions(), ctx.prev);
      toast.error(err.message || 'Не удалось удалить направление');
    },

    onSuccess: () => {
      // directions + все кэши локаций, связанные с веткой
      queryClient.invalidateQueries(qk.directions());
      queryClient.removeQueries({ queryKey: ['locations'], exact: false });
      toast.success('Направление удалено');
    },
  });
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
**Актаульный код useAddLocation.js:**
```js
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';
import { useUIStore } from '@/store/uiStore';

export function useAddLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const activeDirectionId = useUIStore((s) => s.activeDirectionId);

  return useMutation({
    mutationFn: async (formData) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }
      if (!activeDirectionId) {
        throw new Error('Не выбран маршрут (direction_id)');
      }

      const { imageFile, tags, ...rest } = formData;
      // 1. Нормализация тегов
      const tagList = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
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
      // 3. Вызов обновлённого RPC с direction_id
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
          p_direction_id: activeDirectionId,
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

* **Назначение:** Кастомный хук для получения списком локаций.
* **Функционал:** Оборачивает React Query (`useInfiniteQuery` или `useQuery`) для обращения к Supabase API (REST) или через клиентский SDK. Поддерживает параметры пагинации (limit, offset или курсор) и фильтрации (по `searchQuery` и выбранным тегам из Zustand). Возвращает `data` (массив локаций), `isLoading`, `isError`, `fetchNextPage`, `hasNextPage` и т. д. Поддерживает оптимистическое обновление при мутациях (добавление, обновление, удаление) через React Query.
* **Использование:** Применяется на `LocationListPage` для загрузки списка;
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
  const activeDirectionId = useUIStore((s) => s.activeDirectionId);

  const fetchLocations = async ({ pageParam = null }) => {
    // Базовый запрос — выборка локаций с тегами
    let query = supabase
      .from('locations')
      .select('*, locations_tags(tag_id, tags(name))')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    // Фильтрация по активному направлению, если задано
    if (activeDirectionId) {
      query = query.eq('direction_id', activeDirectionId);
    }
    // Пагинация курсором
    if (pageParam) {
      query = query.lt('created_at', pageParam);
    }
    // Поиск по заголовку
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }
    // Фильтрация по выбранным тегам
    if (selectedTags.length) {
      const { data: tagRows, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .in('name', selectedTags);
      if (tagError) throw tagError;
      const tagIds = tagRows.map((t) => t.id);
      query = query.in('locations_tags.tag_id', tagIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    // Трансформация данных: приводим к виду с полями imgUrl и tags[]
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
    // Включаем activeDirectionId в ключ кэша
    queryKey: [
      'locations',
      {
        dir: activeDirectionId ?? '__root__',
        search: searchQuery,
        tags: selectedTags,
      },
    ],
    queryFn: fetchLocations,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000, // 1 минута
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

* **Zustand Store:** Управляет локальным UI-состоянием, не относящимся к серверу.
* **Context API:** Используется для предоставления глобальных опций. Обычно оборачивается в `Layout`.
**Актаульный код uiStore.js:**
```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      // --- Navigation & Directions ---
      /** UUID активного направления или null, когда пользователь находится в Hub */
      activeDirectionId: null,
      /** Временный черновик формы DestinationModal (create/edit) */
      directionFormDraft: null,
      // --- Search & Filters ---
      searchQuery: '',
      selectedTags: [],
      showLoginModal: false,
      /** Флаг «показывать только избранное» */
      showOnlyFavourites: false,
      /** Map {id: boolean} локально отмеченных избранных */
      favourites: {},
      /* ---------- actions ---------- */
      /** Установить активное направление; null — для Hub */
      setActiveDirection: (id) => set({ activeDirectionId: id }),
      /** Обновить / очистить черновик формы направления */
      setDirectionDraft: (draft) => set({ directionFormDraft: draft }),

      setSearchQuery: (q) => set({ searchQuery: q }),

      toggleTag: (tag) =>
        set((s) => ({
          selectedTags: s.selectedTags.includes(tag)
            ? s.selectedTags.filter((t) => t !== tag)
            : [...s.selectedTags, tag],
        })),

      setLoginModal: (v) => set({ showLoginModal: v }),
      /** Локальный optimistic-тоггл для одной локации */
      toggleFavourite: (id) =>
        set((s) => ({
          favourites: { ...s.favourites, [id]: !s.favourites[id] },
        })),
      /** Гидратация списка избранных из Supabase */
      hydrateFavourites: (ids) =>
        set(() => ({
          favourites: Object.fromEntries(ids.map((id) => [id, true])),
        })),
      /** Переключатель глобального фильтра «только избранное» */
      toggleShowOnlyFavourites: () =>
        set((s) => ({ showOnlyFavourites: !s.showOnlyFavourites })),
    }),
    {
      name: 'batumi-ui',
      version: 2, // bump after adding directions fields
      /** В localStorage храним только actual избранные,
          остальные UI-флаги не нужно персистить */
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
* **Взаимодействие:**
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
### useLocationForCard

* **Назначение:** Custom hook to fetch up to 10 locations for a given direction and return a random sample of 3.
**Актаульный код useLocationForCard.js:**
```js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
/**
 * @param {string|null} directionId 
 * @returns {{id:string, title:string, image_url:string|null, direction_id:string}[]}
 */
export function useLocationForCard(directionId) {
  return useQuery({
    queryKey: ['locationsForCard', directionId],
    queryFn: async () => {
      if (!directionId) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('id, title, image_url')
        .eq('direction_id', directionId)
        .limit(10);
      if (error) throw error;
      // Shuffle and pick 3
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3).map(item => ({
        ...item,
        direction_id: directionId,
      }));
    },
    enabled: Boolean(directionId),
    staleTime: 5 * 60_000, // 5 minutes
  });
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
### middleware.ts

* **Назначение:** Пегулирование доступа к страницам на основе jwt
**Актаульный код middleware.ts:**
```ts
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
```