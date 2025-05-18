# Roadmap «Destination Branches» (New Main Page)

> Итеративная реализация новой главной страницы Batumi Trip с поддержкой мульти‑направлений. План строится вертикальными «ламелями» — каждый спринт доводит набор цельных компонентов до инкремента, пригодного для демонстрации и тестирования. В основе — спецификации Architecture‑NewMainPage.md, API‑NewMainPage.md, StateManagement‑NewMainPage.md, DataModel‑NewMainPage.md и актуальная кодовая база из ExistComponents.md.

---

## 💡 Сводка спринтов

|  #  |  Даты (2025) | Инкремент                     | Ключевые артефакты                                                                                                 |
| :-: | :----------: | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
|  0  |  15 – 16 мая | **Kick‑off & DB Migration**   | • `20250515_directions.sql`<br>• ER‑диаграмма v2<br>• ADR‑0019 «Мульти‑направления»                                |
|  1  |  19 – 23 мая | **Backend API + RPC**         | • `add_/update_/delete_direction.sql`<br>• PostgREST examples (Insomnia collection)<br>• Unit tests (Postgres‑TAP) |
|  2  |  26 – 30 мая | **State & CRUD Hooks**        | • `query‑keys.ts`<br>• `useDirections*` hooks (RTK)<br>• Расширенный `uiStore` + tests                             |
|  3  | 02 – 06 июня | **UI Atoms & Molecules**      | • `DestinationCard` (Storybook)<br>• `AddDestinationButton`<br>• `DestinationModal`                                |
|  4  | 09 – 13 июня | **DestinationHubPage**        | • `DestinationGrid` + prefetchers<br>• `app/page.tsx` → hub<br>• Visual snapshot tests                             |
|  5  | 16 – 20 июня | **Branch Routing & Refactor** | • `/destination/[dirId]` route<br>• `useLocations` patch (`direction_id`)<br>• Redirect middleware (301)           |
|  6  | 23 – 27 июня | **E2E + Roll‑out**            | • Cypress spec «add‑delete direction»<br>• Feature‑flag `multiDestination`<br>• Release notes + KPI                |

*Длительность спринта — 5 рабочих дней, демо по пятницам, ретро и планирование ‑ по понедельникам.*

---

## 📦 Sprint 0 — Kick‑off & DB Migration (15 – 16 мая)

### Цель

Создать минимальную основу в БД, чтобы фронтенд сразу работал с новой сущностью `directions`.

### Задачи

1. Написать миграцию `20250515_directions.sql` (таблица, FK, индекс, RLS OFF).
2. Обновить ER‑диаграмму (*DataModel‑NewMainPage.md*) и вставить в `docs/diagram.png`.
3. Создать ADR‑0019 (Architecture Decision Record) «Введение мульти‑направлений».

### Артефакты

* **SQL‑файл** в `supabase/migrations`.
* **ER‑диаграмма v2** (png + mermaid).
* **ADR‑0019** в `docs/adr/`.

### Acceptance Criteria

* Миграция выполняется на review‑environment без ошибок.
* `SELECT * FROM directions` возвращает 0 строк вместо ошибки.
* Индекс `locations_direction_created_at_idx` присутствует.

---

## 🛠️ Sprint 1 — Backend API & RPC (19 – 23 мая)

### Цель

Предоставить REST/RPC‑контур для CRUD операций с направлениями.

### Подзадачи

| ID  | Задача                                                              | Компоненты / файлы                                |
| --- | ------------------------------------------------------------------- | ------------------------------------------------- |
| 1‑1 | Создать RPC `add_direction`, `update_direction`, `delete_direction` | `API-NewMainPage.md` ↔ `supabase/functions/*.sql` |
| 1‑2 | Добавить Postman / Insomnia коллекцию с примером вызовов            | `docs/api/collection.json`                        |
| 1‑3 | Unit‑тесты на Postgres (TAP)                                        | `tests/sql/directions_*`                          |

### Артефакты

* Три SQL‑функции, задрапированы SECURITY DEFINER.
* Обновлённый `API-NewMainPage.md` с примерами.
* CI‑job `db‑test` (GitHub Actions) — зелёный.

### Acceptance Criteria

* Запрос `rpc/add_direction` возвращает 201 и строку.
* Тесты Postgres‑TAP проходят (`npm run test:db`).

---

## ⚙️ Sprint 2 — State Layer & CRUD Hooks (26 – 30 мая)

### Цель

Инкапсулировать работу с `directions` на фронте через React Query + Zustand.

### Подзадачи

1. Создать `query‑keys.ts` (см. StateManagement‑NewMainPage.md § 2.1).
2. Реализовать хуки: `useDirections`, `useAddDirection`, `useUpdateDirection`, `useDeleteDirection` по шаблону существующих CRUD‑хуков.
3. Расширить `uiStore` полями `activeDirectionId`, `setActiveDirection`, `directionFormDraft`.
4. Unit‑tests (Jest + msw) для optimistic flows.

### Артефакты

* `src/hooks/useDirections*.ts`.
* Снимки `uiStore` v2 (`zustand-persist`).
* Storybook mock‑scenarios (Controls → directions).

### Acceptance Criteria

* `yarn test:unit` зелёный.
* Линтер + TypeScript pass.
* Хуки возвращают корректные данные при msw‑mockе.

---

## 🎨 Sprint 3 — UI Atoms & Molecules (02 – 06 июня)

### Цель

Сформировать базовые визуальные кирпичики хаба направлений.

### Подзадачи

| ID  | Компонент                                  | ТЗ / особенности                                                                             |
| --- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 3‑1 | **DestinationCard**                        | Карточка 1:1 с `LocationCard` — изображение, название, флаг страны, счётчик локаций, меню ⋮. |
| 3‑2 | **AddDestinationButton**                   | Плавающая FAB ➕ (reuse из `AddLocationButton`).                                              |
| 3‑3 | **DestinationModal**                       | Модалка create/edit с валидацией, полями из Vision § 2.                                      |
| 3‑4 | Storybook + visual‑regression (Chromatic). |                                                                                              |

### Артефакты

* React компоненты с Tailwind класcами, согласованные со StyleGuide‑BatumiTrip.
* Storybook stories + snapshot png.
* Jest‑tests (render + a11y via @testing‑library/jest‑axe).

### Acceptance Criteria

* `npm run storybook` показывает 3 новых stories.
* Все компоненты покрыты unit‑tests, axe violations = 0.

---

## 📄 Sprint 4 — DestinationHubPage (09 – 13 июня)

### Цель

Собрать страницу‑хаб `/` из готовых атомов и подключить состояние/запросы.

### Подзадачи

1. Создать контейнер `DestinationGrid` — CSS grid + responsiveness.
2. Перенести `app/page.tsx` → `DestinationHubPage` с Header и Prefetchers.
3. Добавить `router.prefetchQuery` лог-ку `useDirectionsPrefetcher`.
4. Интегрировать `AddDestinationButton` + `DestinationModal`.
5. A/B скрыть старую главную за feature‑flag.

### Артефакты

* Готовая страница `/` (feature‑flag “on dev”).
* Percy / Chromatic снимок страницы.
* Lighthouse report ≥ 90/90/100/100.

### Acceptance Criteria

* Список направлений появляется из real DB.
* Демо: создать/редактировать/удалить ветку без перезагрузки.

---

## 🔀 Sprint 5 — Branch Routing & List Refactor (16 – 20 июня)

### Цель

Позволить пользователю проваливаться в ветку и видеть её локации.

### Подзадачи

1. Создать маршрут `app/destination/[dirId]/page.tsx` (обёртка старого `LocationListPage`).
2. В хуке `useLocations` добавить параметр `directionId` + индекс.
3. Middleware 301 redirect со старых ссылок `/locations/[id]` → `destination/{dir}/locations/[id]`.
4. В `Header` логотип → `router.push('/')`.
5. Cypress E2E spec «create → list → delete direction».

### Артефакты

* Изменённые хуки + страницы.
* Cypress видео отчёт.
* Updated `README — local dev`.

### Acceptance Criteria

* Навигация `/` ➞ `/destination/{id}` без FOUC, `activeDirectionId` обновляется.
* E2E тест идёт зелёным в CI.

---

## 🚀 Sprint 6 — QA, Roll‑out & Metrics (23 – 27 июня)

### Цель

Закрыть долги, включить фичу по умолчанию и измерить метрики.

### Подзадачи

1. Пройти QA‑чек‑лист (аудит доступности + локализация).
2. Снять Web‑Vitals (CLS, LCP) для хаба.
3. Включить `multiDestination` flag всем новым пользователям, катить на 100 % после 24 ч.
4. Подготовить **Release Notes** и видео‑демо для блог‑поста.
5. Создать дашборд Supabase (usage stats per direction).

### Артефакты

* QA‑отчёт (`docs/reports/QA‑0627.md`).
* Prometheus / Grafana dashboard json.
* `CHANGELOG.md` entry v2.5.0.

### Acceptance Criteria

* Фича по умолчанию «ON», регрессия 0 блокеров.
* Все KPI держатся в допуске (< 1 % LCP деградации).

---

## ⏭️ Дальнейшие шаги (Back‑log)

1. Offline‑first sync (React‑Query sync‑storage).
2. Server Actions (Next 14) для RPC‑замены.
3. Оркестрация `useTransition` + concurrent UI.
4. Генерация человекочитаемых slug `/italy/rome` вместо UUID.