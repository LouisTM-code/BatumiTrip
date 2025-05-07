# Документ отслеживание контрольных точке и задач из RoadMap-BatumiTrip (дополняет ExistComponents.md)

## Индекс Таблица с кратким обзором состояния проекта

| ID | Спринт | Статус | Последнее обновление |
|----|--------|--------|----------------------|
| 1 | S0. Подготовка инфраструктуры и каркас | Завершено | 2025-05-06 |
| 2 | S1. Реализация аутентификации и главной страницы: логин без пароля, отображение списка локаций | В процессе выполнения | - |

---
## Краткие отчёты о выполненном задании

### S0. Подготовка инфраструктуры и каркас. **Task ID 1** 

### S0-01 Инициализация репозитория и каркаса

| Дата       | Ответственный | Статус     |
|------------|---------------|------------|
| 2025-05-06 | Vadim         | ✅ Завершено |

**Выполнено:**
1. Сгенерирован проект **Next.js 14.2.5** с App Router, ESLint и Tailwind CSS (флаг `--tailwind`) согласно Architecture-BatumiTrip.md
2. Установлены зависимости:  
   - фреймворки и хелперы (NextAuth.js, Supabase JS),  
   - стейт-менеджмент (React Query, Zustand),  
   - UI-библиотеки (shadcn, lucide-react, framer-motion, clsx, tailwind-merge, tailwindcss-animate)
3. Создана структура директорий:  
   `app/`, `components/`, `hooks/`, `lib/`, `store/`, `styles/`, `supabase/`, `tests/`
4. Настроен `tailwind.config.js`:  
   `darkMode: 'class'`, дизайн-токены цветов (primary, secondary, background, foreground) из StyleGuide-BatumiTrip.md
5. Написан `styles/globals.css` с подключением `@tailwind`-блоков и CSS-переменными для светлой/тёмной темы
6. Реализованы провайдеры в `components/Providers.js`: (код см. ComponentsDesign-BatumiTrip.md)
   обёртка `<QueryClientProvider>` (React Query), `<AuthProvider>` (NextAuth) и `<ThemeProvider>` (next-themes)
7. Сгенерированы базовые JS-файлы: (код см. ComponentsDesign-BatumiTrip.md)
   - **app/layout.js** — глобальный Layout с `<Providers>`;  
   - **app/page.js** — тестовая страница для проверки компонентов и логики;  
   - **lib/reactQuery.js** — создание `QueryClient`;  
   - **lib/supabaseClient.js** — инициализация клиента Supabase;  
   - **hooks/useAuth.js** — хук для авторизации;  
   - **store/uiStore.js** — Zustand-стор для UI (searchQuery, selectedTags, favourites и т.д.);  
   - **middleware.ts** и **app/api/auth/[...nextauth]/route.js** — безпарольный вход и защита маршрутов.

> **Acceptance Criteria:**  
> - `npm run dev` стартует приложение без ошибок сборки.  
> - Тема переключается корректно: классы `bg-background` / `text-foreground` меняются при `class="dark"` на `<html>`.  
> - Тестовая страница отображает текущее время из Supabase RPC, корректно рендерит провайдеры, Zustand и React Query.  
> - Локальная структура директорий соответствует спецификации в Architecture-BatumiTrip.md
> - Базовые файлы и компоненты готовы к дальнейшему развитию по ComponentsDesign-BatumiTrip.md и StateManagement-BatumiTrip.md.

---
### S1-02 Настройка Supabase и миграций

| Дата       | Ответственный | Статус      |
|------------|---------------|-------------|
| 2025-05-06 | Vadim         | ✅ Завершено |

**Выполнено:**
1. Создан проект Supabase (Free-tier), привязка через `supabase link`.  
2. Добавлены миграции: (sql код см. DataModel-BatumiTrip.md , 4. Миграции (SQL))
   - Расширения (`pgcrypto`, `pg_trgm`), триггер `trigger_set_timestamp`.  
   - Таблицы `users`, `locations`, `tags`, `locations_tags`, `favourites`.  
   - Индексы для ускорения выборок и поиска.  
   - RLS-политики для обеспечения безопасности на уровне строк.  
3. Выполнен `supabase db push`, проверена корректность схемы в Dashboard.  
4. Настроены env-переменные для работы SDK и NextAuth.

> **Acceptance Criteria:** в Supabase-UI отображаются все таблицы с нужными полями и связями; RLS-политики активны; приложение при старте без ошибок может выполнять запросы к `/rest/v1/{table}`.  

---
### S1-03 Настройка password‑less аутентификации NextAuth + Supabase

| Дата       | Ответственный | Статус        |
|------------|---------------|---------------|
| 2025-05-06 | Vadim         | ✅ Завершено  |

**Выполнено:**
1. Добавлен Credentials Provider без пароля в NextAuth
2. Реализован upsert записи пользователя в таблицу `users` Supabase при authorize
3. Сконфигурированы сессии JWT (strategy: “jwt”, maxAge 30 дней) и HTTP‑only cookie
4. Написан middleware в `middleware.ts` для проверки JWT‑cookie и редиректа на `/` при отсутствии сессии; настроен matcher для `/locations/:path*`

> **Acceptance Criteria:**  
> - После входа через Credentials Provider в Supabase появляется запись в таблице `users`.  
> - JWT хранится в HTTP‑only cookie `next-auth.session-token` (или `__Secure-next-auth.session-token` в prod).  
> - При обращении к приватным маршрутам `/locations/*` без валидной сессии выполняется редирект на `/`.  
> - Приложение без ошибок выполняет запросы к защищённым API при наличии сессии.  

---
### S1. Реализация аутентификации и главной страницы: логин без пароля, отображение списка локаций. **Task ID 2** 

### S2-01 LoginModal и обновлённый route.js

| Дата       | Ответственный | Статус      |
|------------|---------------|-------------|
| 2025-05-06 | Vadim         | ✅ Завершено |

**Выполнено:**
- Компонент `LoginModal` (shadcn/ui Dialog, Tailwind, Framer Motion, Zustand)  
- Обновлён `route.js` NextAuth Credentials + Supabase upsert + RLS  
- Проверена вставка в `users` и закрытие модалки при авторизации 

---
### S2-02 Header.js: UI и функционал

| Дата       | Ответственный | Статус      |
|------------|---------------|-------------|
| 2025-05-06 | Vadim         | ✅ Завершено |

**Выполнено:**
1. Добавлен компонент `Header` в `components/Header.js` по описанию из ComponentsDesign: отображение логотипа, кнопок «Войти»/«Выйти» и пользовательского имени  
2. Реализована анимация появления (slide-down + fade-in) через Framer Motion при монтировании компонента  
3. Интегрирован `useAuth` (NextAuth) для кнопки «Выйти» и `useUIStore` (Zustand) для показа/скрытия `LoginModal` при клике на «Войти»

> **Acceptance Criteria:**  
> - `Header` отображается на главной странице;  
> - При загрузке страницы видна анимация slide-down + fade-in;   
> - Логотип кликабельный и ведёт на `/`;  
> - Кнопка «Войти» открывает `LoginModal`, «Выйти» — завершает;

---
### S2-03 Реализация блока главной страницы LocationListPage

| Дата       | Ответственный | Статус      |
| ---------- | ------------- | ----------- |
| 2025-05-06 | Vadim         | ✅ Завершено |

**Выполнено:**

1. **useLocations** (hooks/useLocations.js):

   * Реализован кастомный хук на базе `useInfiniteQuery` и Supabase JS SDK с cursor-pagination по полю `created_at`.
   * Добавлена фильтрация по `searchQuery` и выбранным тегам из Zustand-стора

2. **LocationList** (components/LocationList.js):

   * Подключение `useLocations()` для загрузки страниц локаций.
   * Skeleton-заглушки при первичной загрузке и докрутке (`SkeletonCard`).
   * Бесконечная прокрутка через `IntersectionObserver` на «сенсоре».
   * Сетка `grid-cols-1/2/3

3. **AddLocationButton** (components/AddLocationButton.js):
   * Кнопка-ссылка на `/locations/new` с иконкой `Plus` (lucide-react) и компонентом `Button` из shadcn.
   * Адаптивное позиционирование FAB (mobile-first) по макету.

4. Добавлены временные стабы **LocationCard** и **SkeletonCard**, чтобы страница собиралась и рендерилась без ошибок до финальной верстки карточек.

> **Acceptance Criteria:**
>
> * На маршруте `/` отображаются `LocationList` с корректной подгрузкой и Skeleton-плейсхолдерами, `AddLocationButton`.
> * Сборка приложения проходит без ошибок; подгрузка и бесконечный скролл рабочих страниц локаций.

---
### S2-04 Реализация карточек локаций

| Дата       | Ответственный | Статус      |
|------------|---------------|-------------|
| 2025-05-07 | Vadim    | ✅ Завершено |

**Выполнено:**
1. Спроектированы и реализованы два отдельных компонента:  
   - **SkeletonCard** — анимированный плейсхолдер при загрузке списка (`animate-pulse`, скелетные блоки под изображение, заголовок и теги).  
   - **LocationCard** — финальная карточка локации с фото, заголовком, усечённым описанием и списком тегов (TagBadge).  
2. Убрана недоработанная логика `useToggleFavourite` — кнопка «звезда» оставлена статичной до реализации хука.  
3. Верстка соответствует StyleGuide (округлые углы, тени, mobile‑first, адаптивные размеры), добавлены hover/focus эффекты и лёгкая анимация появления через Framer Motion.  
4. Компоненты покрыты мемоизацией (`React.memo`) для предотвращения лишних рендеров.  

> **Acceptance Criteria:**  
> - При загрузке списка показываются `SkeletonCard`.  
> - После получения данных отображаются `LocationCard` с корректным отображением всех полей.

---
### S2-05 Реализация TagBadge, useTags и обновление useLocations

| Дата       | Ответственный | Статус      |
| ---------- | ------------- | ----------- |
| 2025-05-07 | Vadim        | ✅ Завершено |

**Выполнено:**

1. **TagBadge**
   * Создан компонент отображения тега с Tailwind-стилями и опциональной анимацией через Framer Motion.
   * Реализована поддержка клика: при передаче `onClick` бейдж получает role="button" и вызывает переданную функцию.
2. **useTags**
   * Добавлен хук `useTags` на основе React Query и Supabase для выборки всех тегов (`tags`) с кэшированием 5 минут.
3. **useLocations**
   * Модифицирован `hooks/useLocations.js`: в запросе Supabase включена вложенная связь `locations_tags(tags.name)` для получения массива имён тегов
   * После получения данных выполнено мапирование, формирующее поле `tags: string[]` в каждом объекте локации.
4. **Интеграция в LocationCard**
   * Внутри `LocationCard` вместо заглушки выводятся `<TagBadge>`-ы, получая массив `tags` из `useLocations`.
5. **Тестирование**
   * Проверена отрисовка бейджей, эффекты hover/tap.
   * Подтверждена корректная фильтрация по тегам без полной перезагрузки списка.

> **Acceptance Criteria:** в карточках локаций отображаются теги в виде бейджей;





