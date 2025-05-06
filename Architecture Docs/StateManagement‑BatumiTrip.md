# StateManagement Batumi Trip
> **Документ ID 6 (см. TaskIndex.md)** — детальная стратегия управления состоянием SPA «Batumi Trip» для покомпонентного автогенерирования кода с ИИ. Описывает применяемые слои состояния, конфигурацию React Query, Zustand‑сторов и Context API, а также паттерны кеширования и оптимистичных обновлений, согласованные с архитектурой, API и моделью данных проекта.&#x20;

---
## 1 . Слои состояния приложения

| Слой | Инструмент | Источник данных / Сфера ответственности |
|------|------------|-----------------------------------------|
| **Удалённое (server) состояние** | **React Query** | CRUD‑данные Supabase (PostgreSQL); списки и карточки локаций, теги, избранное |
| **UI‑состояние (глобальное)** | **Zustand** | Поиск, выбранные теги‑фильтры, избранное, видимость модалок, оптимистичные «плейсхолдеры» |
| **UI‑состояние (контекст)** | **Context API** | Тема (light/dark), локаль, QueryClient, AuthContext (обёртка вокруг NextAuth) |
| **Локальное state** | `useState / useReducer` | Поля форм, временные индикаторы в отдельных компонентах |
> Эта сегрегация минимизирует ререндеры, упрощает кодогенерацию и снижает связность слоёв.

---
## 2 . React Query

### 2.1 Базовая конфигурация

```tsx
// lib/reactQuery.ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,       // 1 минута
        cacheTime: 1000 * 60 * 30,  // 30 минут
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

```tsx
// app/layout.tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </AuthProvider>
</QueryClientProvider>
```

* **Devtools** подключаются только в `process.env.NODE_ENV !== 'production'`.
* `QueryClient` создаётся **один раз** на клиенте и воссоздаётся на сервере (SSR).

### 2.2 Ключи и соглашения

| Тип данных | Query Key | Примечания |
|------------|-----------|------------|
| Список локаций (paginated) | `['locations', { search, tags, page }]` | cursor‑based, `pageParam` = последний `id` |
| Одна локация | `['location', id]` | Используется на детальной странице |
| Список тегов | `['tags']` | Общий публичный ресурс |
| Избранное пользователя | `['favourites', userId]` | Ленивая загрузка после логина |

> Правило: **первый элемент — объект‑категория**, далее — фильтрующие параметры, чтобы React Query правильно делал invalidation.

### 2.3 Кеширование

| Query | `staleTime` | Стратегия обновления |
|-------|-------------|----------------------|
| `locations` list  | 60 s | Фоновая проверка при открытии/фильтрации |
| `location` detail | 5 min | Обновляется после успешной мутации |
| `tags` | Infinity | Не меняется часто, обновлять вручную при CRUD |
| `favourites` | 30 s | Инвалидация при `toggleFavourite` |

### 2.4 Оптимистичные мутации (паттерн)

```tsx
const mutation = useMutation(addLocation, {
  // 1. snapshot
  onMutate: async (draft) => {
    await queryClient.cancelQueries(['locations']);
    const prev = queryClient.getQueryData(['locations']);
    queryClient.setQueryData(['locations'], (old) =>
      optimisticInsert(old, draft)
    );
    return { prev };
  },
  // 2. rollback on error
  onError: (_e, _d, ctx) => {
    queryClient.setQueryData(['locations'], ctx?.prev);
  },
  // 3. refetch on success
  onSettled: () => {
    queryClient.invalidateQueries(['locations']);
  },
});
```

* Используется для **create / update / delete** локаций, тегов и избранного.
* Для пагинируемого списка вставляем « draft‑row » с временным `id: 'temp‑xxx'`.

### 2.5 Интеграция с Supabase

* REST‑эндпоинты описаны в API‑spec. Запросы выполняются через `fetch()` или Supabase JS SDK.&#x20;
* Для приватных операций добавляется JWT из NextAuth в заголовок `Authorization: Bearer <token>`.
* После мутации вызываем `queryClient.invalidateQueries` — либо точечный ключ, либо весь список.

---
## 3 . Zustand

### 3.1 Структура стора

```ts
interface UIState {
  searchQuery: string;
  selectedTags: string[];
  showLoginModal: boolean;
  /** Локальный кэш «избранных» — ключ = locationId → true */
  favourites: Record<string, boolean>;
  setSearchQuery(q: string): void;
  toggleTag(tag: string): void;
  setLoginModal(v: boolean): void;
  /** Оптимистичное переключение локального флага избранного */
  toggleFavourite(id: string): void;
  /** Гидратация избранных после логина (GET /rest/v1/favourites) */
  hydrateFavourites(ids: string[]): void;   // ← NEW
}
```


```ts
export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      searchQuery: '',
      selectedTags: [],
      showLoginModal: false,
      favourites: {},

      setSearchQuery: (q) => set({ searchQuery: q }),
      toggleTag: (t) => {
        const { selectedTags } = get();
        set({
          selectedTags: selectedTags.includes(t)
            ? selectedTags.filter((x) => x !== t)
            : [...selectedTags, t],
        });
      },
      setLoginModal: (v) => set({ showLoginModal: v }),

      toggleFavourite: (id) =>
        set((s) => {
          s.favourites[id] = !s.favourites[id];
        }),

      hydrateFavourites: (ids) =>
        set((s) => {
          s.favourites = Object.fromEntries(ids.map((i) => [i, true]));
        }),
    })),
    {
      name: 'batumi-ui',
      /** В localStorage храним только favourites — серверные данные не дублируем */
      partialize: (s) => ({ favourites: s.favourites }),
    }
  )
);
```

* **Immer‑middleware** обеспечивает безопасные мутации.
* **Persist‑middleware** — избранное хранится в `localStorage`, остальное — нет.
* Используйте селекторы: `useUIStore((s) => s.searchQuery)` для избежания лишних ререндеров.

### 3.2 Связывание с React Query

* При изменении фильтров (`searchQuery`, `selectedTags`) триггерим `refetch()` списка локаций.
* При `toggleFavourite` отправляем мутацию `POST /favourites` с оптимистичным UI.

### 3.3 Синхронизация избранного с Supabase
При успешном `signIn` хук `useAuth()` вызывает:

```ts
const { data } = await queryClient.fetchQuery(
  ['favourites', userId],
  () => supabase
        .from('favourites')
        .select('location_id')
        .eq('user_id', userId)
);
useUIStore.getState().hydrateFavourites(data.map((f) => f.location_id));
/
```
* Первичная загрузка выполняется один раз сразу после логина или восстановления сессии.
* Далее состояние поддерживается через оптимистичные мутации `useToggleFavourite()` (см. ниже) и инвалидируется ключ `['favourites', userId]`, чтобы React Query при необходимости подтянул актуальные данные.
* Если пользователь выходит, `persist‑middleware` автоматически очищает `favourites` (конфигурация по умолчанию `localStorage.clear()`).
---
## 4 . Context API

| Контекст | Что хранит | Где провайдер |
|----------|------------|---------------|
| **AuthContext** | `user`, `signIn`, `signOut`, `loading` | `Layout` |
| **ThemeContext** | \`'light, 'dark'\`, переключатель | `Layout`|
| **LocaleContext** | текущая локаль и метод `setLocale` | `Layout` |
| **QueryClientContext** | объект `QueryClient` (см. § 2.1) | `Layout` |

> Контексты не должны хранить изменяемые коллекции — для этого лучше Zustand.

---
## 5 . Пользовательские хуки

| Хук | Назначение / детали реализации |
|-----|--------------------------------|
| `useAuth()` | Обёртка над NextAuth `useSession`; выдаёт { user, isLoading, signIn, signOut } |
| `useLocations()` | `useInfiniteQuery` со строкой поиска и тегами из Zustand |
| `useOneLocation(id)` | `useQuery(['location', id])` |
| `useAddLocation()` | `useMutation` + optimistic insert|
| `useUpdateLocation()` | `useMutation` + optimistic patch |
| `useDeleteLocation()` | `useMutation` + optimistic remove |
| `useTags()` | `useQuery(['tags'])` |
| `useToggleFavourite()` | Читает и обновляет favourites в Zustand, запускает оптимистичную мутацию: если локация не в избранном → POST /rest/v1/favourites, иначе → DELETE …. После успешного signIn хук вызы‑ вает hydrateFavourites с результатом запроса GET /rest/v1/favourites?user_id=eq.{id}, чтобы выровнять локальный и серверный стейт. |

> Скелеты хуков уже описаны в ComponentsDesign‑доке; при генерации кода ИИ должен придерживаться этих сигнатур.

---
## 6 . Поток оптимистичного обновления «Добавить локацию»

1. **Пользователь** заполняет форму → `useAddLocation().mutate(draft)`.
2. **onMutate:**
   * Сохраняем snapshot списка.
   * Добавляем temp‑карточку в кеш (`draft.id = 'temp‑...'`).
3. **Backend** возвращает `realId`.
4. **onSuccess:**
   * Заменяем `temp‑id` на `realId`.
   * Инвалидируем список (гарантируем свежие данные pagination & RLS).
5. **onError:** откатываем к snapshot и показываем toast с ошибкой.
> Та же схема используется для изменения тегов (`locations_tags`) и избранного.

---
## 7 . Обработка ошибок и глобальные toasts

* React Query предоставляет `error` в результате каждого хука — UI‑компоненты ловят и рендерят `Alert`.
* Централизованный перехватчик (`queryClient.setDefaultOptions({ queries: { onError } })`) логирует ошибки в Sentry (см. будущий Architecture‑Observability док).

---
## 8 . Тестирование и dev‑UX

* Подключён **React Query Test Utils** — позволяет мокать Supabase‑fetch и проверять состояние кеша.
* **Storybook** использует Mock Service Worker с нулевым latency для проверки компонентов в изоляте.
* **React Query Devtools** активен в `development`, shortcut <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd>.

---
## Примечание о нейминге хуков
> Все упомянутые документы (Components Design, API, State Management) используют единый набор имён:
```text
useAuth, useLocations, useOneLocation,
useAddLocation, useUpdateLocation, useDeleteLocation,
useTags, useToggleFavourite
```
> При генерации кода ИИ должен строго придерживаться этой сигнатуры, что устраняет любую неоднозначность.

---

