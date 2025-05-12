# Стиль-гайд для SPA «Batumi Trip»

## 1. Общие принципы дизайна

* **Единообразие:** Все компоненты должны быть оформлены в едином стиле. Используйте общий дизайн-систему на базе Tailwind CSS и shadcn/ui (готовые кнопки, карточки, формы и т.д.), чтобы обеспечить согласованный пользовательский интерфейс. Важна единая цветовая гамма, шрифты и отступы на всех экранах.
* **Доступность:** Придерживайтесь принципов доступного дизайна: используйте семантическую HTML-разметку, корректно размечайте интерактивные элементы (кнопки, ссылки, поля) с помощью ARIA-атрибутов, обеспечивайте навигацию с клавиатуры и контрастность текста над фоном (см. раздел 10).
* **Визуальная лёгкость:** Оформление должно быть «воздушным» и лаконичным. Избегайте перегруженности интерфейса. Используйте достаточные поля между блоками, умеренные тени и скругления (разделы 4–5). При этом шрифты и иконки должны быть читаемыми и легко различимыми. Стили компонентов должны быть минималистичными и чистыми, подчеркивая контент (списки локаций, формы, модалки).

---
## 2. Цветовая палитра

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
	"./hooks/**/*.{js,ts,jsx,tsx,mdx}",
	"./lib/**/*.{js,ts,jsx,tsx,mdx}",
	"./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require('@tailwindcss/forms'),
	require('@tailwindcss/typography'),
	require('tailwindcss-animate'),
	],
};
```
```js
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 2. CSS-переменные для светлой и тёмной темы */
:root {
  /* Цветовая палитра — Light Theme */
  --background:           0, 0%, 98%;    /* светлый фон */
  --foreground:           210, 10%, 10%; /* тёмный текст */
  --card:                 0, 0%, 100%;   /* фоновая карточка */
  --card-foreground:      210, 10%, 10%; /* текст в карточке */
  --popover:              0, 0%, 100%;   /* фон поповера */
  --popover-foreground:   210, 10%, 10%; /* текст поповера */
  --primary:              214, 89%, 62%; /* основной цвет */
  --primary-foreground:   0, 0%, 100%;   /* текст на primary */
  --secondary:            162, 76%, 42%; /* второстепенный цвет */
  --secondary-foreground: 0, 0%, 100%;   /* текст на secondary */
  --muted:                210, 16%, 82%; /* фон muted */
  --muted-foreground:     210, 10%, 30%; /* текст muted */
  --accent:               45, 100%, 51%; /* акцентный цвет */
  --accent-foreground:    0, 0%, 0%;     /* текст на accent */
  --destructive:          0, 78%, 63%;   /* цвет ошибок */
  --destructive-foreground: 0, 0%, 100%; /* текст ошибок */
  --border:               210, 16%, 82%; /* цвет границ */
  --input:                210, 16%, 82%; /* фон инпутов */
  --ring:                 214, 89%, 62%; /* цвет фокуса/кольца */
  --chart-1:              206, 100%, 82%;
  --chart-2:              4,   90%, 58%;
  --chart-3:              141, 53%, 53%;
  --chart-4:              48,  100%, 67%;
  --chart-5:              291, 64%, 42%;
  /* Токен скругления */
  --radius:               0.5rem;
}

/* Dark Theme */
.dark {
  /* Цветовая палитра — Dark Theme */
  --background:           220, 12%, 15%;
  --foreground:           0,   0%, 96%;
  --card:                 220, 12%, 20%;
  --card-foreground:      0,   0%, 96%;
  --popover:              0,   0%, 15%;
  --popover-foreground:   210, 10%, 96%;
  --primary:              214, 89%, 38%;
  --primary-foreground:   0,   0%, 100%;
  --secondary:            162, 76%, 42%;
  --secondary-foreground: 0,   0%, 100%;
  --muted:                210, 16%, 34%;
  --muted-foreground:     210, 10%, 80%;
  --accent:               45,  100%, 51%;
  --accent-foreground:    0,   0%, 0%;
  --destructive:          0,   78%, 63%;
  --destructive-foreground: 0, 0%, 100%;
  --border:               210, 16%, 34%;
  --input:                210, 16%, 34%;
  --ring:                 214, 89%, 38%;
  --chart-1:              206, 100%, 82%;
  --chart-2:              4,   90%, 58%;
  --chart-3:              141, 53%, 53%;
  --chart-4:              48,  100%, 67%;
  --chart-5:              291, 64%, 42%;
  --radius:               0.5rem;
}

/* 3. Box sizing и типографика */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  line-height: 1.5;
}

/* 4. Базовые стили элементов */
body {
  @apply bg-background text-foreground antialiased;
  margin: 0;
  padding: 0;
}

input {
  @apply bg-white text-foreground; /* светлая тема: белый фон, тёмный текст */
}

.dark input {
  @apply bg-input text-foreground; /* тёмная тема: тёмный фон (–input), белый текст */
}

/* 5. Стили для ссылок и изображений */
a {
  @apply text-primary hover:underline;
}

img {
  @apply max-w-full h-auto block;
}

:focus {
  @apply outline-none ring-2 ring-offset-2;
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
```
* **Применение:** Для фонов и текста используйте созданные цвета с учётом темы. Например:

  ```jsx
  <div className="bg-background text-foreground dark:bg-background-dark dark:text-foreground-dark">
    Контент...
  </div>
  ```

> Шрифты и кнопки могут использовать `bg-primary`, `text-white` в светлой теме и `bg-primary-dark`, `text-white` в тёмной. Для переключения темы достаточно добавить CSS-класс `dark` к корневому элементу `<html>` (или `<body>`). Shadcn/ui рекомендует подход с CSS-переменными: при включении опции `cssVariables: true` в `components.json` вы можете использовать утилиты `bg-background` и `text-foreground`, которые автоматически переключаются при смене темы.

* **Акценты и состояния:** Выделяйте действия (кнопки, ссылки) «яркими» цветами (например, `primary` или `secondary`). Для состояний ошибок/предупреждений используйте стандартные красный/оранжевый (`red-500`, `yellow-500` и их тёмные варианты). Цветовые сочетания должны иметь высокий контраст: текст на фоне — минимум 4.5:1, а основные цвета (primary/secondary) — минимум 3:1 по контрасту.

---
## 3. Типографика

* **Шрифты:** Используйте санс-серифный шрифт для всего текста (Tailwind по умолчанию использует `font-sans`). Для заголовков можно применять класс `font-bold` или `font-semibold`, для обычных блоков – `font-medium` или `font-normal`.
* **Размеры:** Стандартный базовый размер текста — `text-base` (\~16px). Заголовки масштабируйте следующими шагами, например:
  * `<h1>` – `text-4xl font-bold` (примерно 36px),
  * `<h2>` – `text-3xl font-semibold`,
  * `<h3>` – `text-2xl font-semibold`,
  * `<h4>` – `text-xl font-medium`.
    Параграфы – `text-base` с `leading-relaxed` для удобочитаемости.
  ```jsx
  <h1 className="text-4xl font-bold mb-4">Заголовок первого уровня</h1>
  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
    Это пример параграфа с классом text-base для обычного текста.
  </p>
  ```
* **Иерархия:** Используйте заголовки `<h*>` последовательно. Между заголовком и текстом оставляйте отступ (`mb-2` или `mb-4`). Встроенные тексты в компонентах (кнопки, ярлыки, менюшки) могут быть меньшего размера (`text-sm` или `text-xs` для бейджей). Shadcn/ui-компоненты часто включают собственные стили типографики, но при необходимости их можно расширять классами Tailwind (например, устанавливать `font-medium` или цвет `text-foreground`).

---
## 4. Отступы и сетка

* **Шкала отступов Tailwind:** Tailwind использует базовую шкалу (1 = 0.25rem, 2 = 0.5rem и т.д.). Соглашайтесь о «вертикальном ритме» страницы: часто используются `p-4` (1rem) или `p-6` (1.5rem) для крупных блоков и меньшие отступы (`p-2`) для мелких. Не устанавливайте произвольные значения вне шкалы.
* **Глобальные контейнеры:** Для выравнивания по центру и отступов по краям применяйте контейнеры:
  ```jsx
  <div className="container mx-auto px-4">
    <!-- Контент -->
  </div>
  ```
> Здесь `mx-auto` центрирует контейнер, `px-4` обеспечивает горизонтальные поля.

* **Сетка:** Используйте утилиты `grid` и `flex` для вёрстки. Например, для списка карточек локаций:
  ```jsx
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* карточки LocationCard */}
  </div>
  ```
> Здесь `gap-6` отвечает за промежутки между элементами (1.5rem). Для блочных компонентов (`<Card>`, `<Form>`, `<Modal>`) можно применять внутренние отступы, например, `p-4` или `p-6` для обертки контента.

* **Согласованность:** Группируйте похожие элементы с одинаковыми классами отступов. Избегайте «жесткой» вёрстки через пиксели; адаптируйте ширину через относительные единицы или утилиты `w-full`, `max-w-md` и т.д., чтобы интерфейс оставался гибким.

---
## 5. Скругления и тени

* **Скругления:** Задавайте углы у элементов единообразно. Например, карточки и модальные окна могут иметь `rounded-lg` (0.5rem), кнопки — `rounded` или `rounded-full` для pill-стиля, бейджи — `rounded-full` (для «пилюльки»). Размер скругления (`rounded-md`, `rounded-lg` и т.д.) желательно выбрать один глобально для UI.
* **Тени:** Используйте легкие тени для выделения поверхностей. Tailwind предоставляет `shadow`, `shadow-md`, `shadow-lg` и т.д. Например, карточки локаций и модалки можно оформить `shadow-md`. Кнопки — без тяжелой тени (обычно `shadow-sm` или без тени), чтобы не перегружать интерфейс.
* **Примеры:**
  ```jsx
  <button className="px-4 py-2 bg-blue-500 text-white rounded-full shadow-sm hover:shadow-md">
    Кнопка
  </button>

  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4">
    {/* Контент карточки */}
  </div>
  ```
> Здесь для светлой темы фон кнопки — `bg-blue-500`, для тёмной — он может быть темнее по контрасту. Тень `shadow-md` придает слегка выпуклый эффект на карточке с локацией.

---
## 6. Адаптивность (Mobile-First)
* **Mobile-First:** По умолчанию стили адаптированы под мобильные устройства. Применяйте базовые классы без префиксов для мобильного вида, а для больших экранов добавляйте префиксы Tailwind: `sm:`, `md:`, `lg:`, `xl:`. Например:
  ```jsx
  <img 
    className="w-full object-cover sm:w-1/2 lg:w-1/3" 
    src="location.jpg" alt="Изображение локации" 
  />
  ```
 > Здесь на маленьких экранах изображение `w-full`, на больших (`sm:` и `lg:`) уменьшается в ширине.
* **Брейкпоинты:** Tailwind по умолчанию имеет:
  * `sm` (min-width: 640px),
  * `md` (768px),
  * `lg` (1024px),
  * `xl` (1280px) и выше.
> Используйте их по необходимости. Критически важен текст и навигация — они должны хорошо выглядеть на экране смартфона. Архитектура проекта предусматривает *адаптивную вёрстку под мобильные и десктоп устройства*. Это значит, например, применять верстку на flex/grid, чтобы интерфейс «перетекал» в 1, 2 или 3 колонки в зависимости от ширины.

* **Проверка:** Всегда проверяйте компоненты в разных размерах экрана. Tailwind позволяет просто скрывать элементы или менять их расположение: например, `<div className="block md:hidden">` для показа только на мобильных. Убедитесь, что все элементы остаются доступными и не вылезают за границы.

---
## 7. Компонентные токены и утилиты

* **Design Tokens:** В `tailwind.config.js` можно определить собственные токены (цвета, отступы, шрифты) в секции `extend`. Это обеспечивает единообразие: например, класс `bg-primary` всегда один и тот же цвет, вместо явных `bg-blue-500` везде.
* **Переменные shadcn/ui:** Shadcn UI поддерживает работу с CSS-переменными для темизации. При установке `tailwind.cssVariables: true` в `components.json` утилиты `bg-background`, `text-foreground` и другие будут привязаны к CSS-переменным темы. Это позволяет централизованно менять тему: в `globals.css` задаются переменные `--background`, `--foreground` и т.д.
* **Утилиты Tailwind:** Используйте встроенные классы для макета (flex, grid, space-x, space-y), типографики (text-*, font-*), состояний (`hover:bg-*`, `focus:ring`, `disabled:opacity-50` и т.п.). Не пишите лишний CSS — приоритет отдаётся утилитам.
* **Настройка компонентов:** Многие shadcn-компоненты позволяют передавать props для кастомизации: например, `<Button variant="outline">` может автоматически добавлять свои классы. В таких случаях сочетайте утилиты Tailwind с пропсами компонента. Например:
  ```jsx
  <Button className="px-6 py-2" variant="primary">
    Отправить
  </Button>
  ```
> Здесь базовые стили кнопки задает shadcn (цвет, фон), а мы добавляем собственные отступы через Tailwind. При использовании Zustand или Context (см. StateManagement) можно менять цветовые темы через поставленные переменные.

---
## 8. Иконки и графика

* **Легкие SVG-иконки:** В проекте используется пакет `lucide-react`. Каждый значок импортируется как React-компонент, и его внешний вид легко настраивается классами Tailwind. Например:
  ```jsx
  import { Search, MapPin, Star } from 'lucide-react';

  <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
  <MapPin className="w-6 h-6 text-primary" />
  <Star className="w-4 h-4 text-yellow-400" />
  ```
 > Здесь `w-5 h-5` задают размер (примерно 20px). Укажите `aria-hidden="true"` для декоративных иконок и добавляйте поясняющий `sr-only` текст или `aria-label` для функциональных иконок в кнопках.
 
* **Стилизация:** Иконки должны быть однотонными (монохромный SVG). Цвет задавайте через класс `text-...`, чтобы иконка соответствовала выбранной цветовой палитре. Можно также масштабировать через проп `size={}` у lucide, но предпочтительнее единообразно управлять размером классами `w-` и `h-`.
* **Графические элементы:** Любые изображения (например, фото локаций) должны иметь корректный `alt` и стилизоваться утилитами: `object-cover`, `rounded`, `shadow` по необходимости. Например, обложка карточки локации может быть:
  ```jsx
  <img src={location.image_url} alt={location.title} className="w-full h-32 object-cover rounded-t-lg" />
  ```
* **Консистентность:** Все пиктограммы в приложении (звезда «favorite», маркер локации, лупа поиска) должны быть в одном стиле Lucide. Не смешивайте разные иконпакеты. Размеры и отступы иконок стандартными классами (`mr-2`, `inline-block` и т.д.) должны сочетаться с текстом.

---
## 9. Условные классы (clsx, variants)

* **Использование clsx:** Для динамической смены стилей (при наведении, ошибки, состоянии компонента) применяйте библиотеки вроде `clsx` или `classnames`. Они позволяют условно склеивать классы. Например:
  ```jsx
  import clsx from 'clsx';
  <button
    className={clsx(
      "px-4 py-2 font-medium rounded",
      isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800",
      isDisabled && "opacity-50 cursor-not-allowed"
    )}
    disabled={isDisabled}
  >
    Клик
  </button>
  ```
> Здесь в зависимости от состояния `isActive` меняются фон и текст, а если `isDisabled`, добавляется «приглушенность».

* **Варианты компонентов:** Некоторые компоненты (шаблоны, карточки) могут поддерживать пропсы-варианты (например, `variant="error"`). Если вы используете такой подход, в коде часто создают объекты с базовыми и модификаторными классами, а потом выбирают нужный через переменную. Пример простого варианта для `<Alert>` компонента:
  ```js
  const baseClass = "p-4 border rounded";
  const variantClass = {
    success: "bg-green-100 border-green-400 text-green-700",
    error: "bg-red-100 border-red-400 text-red-700"
  }[props.variant];
  <div className={clsx(baseClass, variantClass)}>{props.children}</div>
  ```
> В целом избегайте тяжелых IF в JSX – лучше предварительно вычислять классы и передавать их через переменную/clsx.

---
## 10. Доступность (a11y)

* **ARIA-атрибуты:** Для кнопок без текста добавляйте `aria-label`. Пример:
  ```jsx
  <button aria-label="Закрыть" className="focus:outline-none focus:ring">
    <XIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
  </button>
  ```
> Здесь иконка чисто декоративная (`aria-hidden="true"`), а кнопка несёт ярлык «Закрыть» для скринридеров.

* **Фокус:** Уделяйте внимание видимому фокусу. Tailwind по умолчанию добавляет `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`, если вы используете set кнопки из shadcn/ui или утилиты для фокуса. Обеспечьте, чтобы элемент при фокусе не «терялся»: избегайте `outline: none` без альтернативы.
* **Контраст:** Как уже отмечено, выбор цветов должен учитывать WCAG: текст и фон – не менее 4.5:1. Проверьте оттенки (например, темно-серый текст на светлом фоне или светлый текст на тёмном).
* **Семантика:** Используйте теги `header`, `main`, `nav`, `button`, `form`, `label` по назначению. Связывайте `<label>` с `<input>` через `htmlFor`. Например:
  ```jsx
  <label htmlFor="title" className="block text-sm font-medium">Заголовок</label>
  <input id="title" name="title" className="mt-1 block w-full border rounded px-3 py-2 focus:ring" />
  ```
> Это позволяет вспомогательному ПО (скринридерам) понимать форму.

* **Скрытый текст:** Для иконок или визуальных подсказок используйте класс `sr-only` для скрытого текста. Например, в кнопке поиска:
  ```jsx
  <button className="p-2">
    <SearchIcon className="w-5 h-5" aria-hidden="true" />
    <span className="sr-only">Поиск</span>
  </button>
  ```
> Таким образом, увидевшие пользуются иконкой, а скринридер озвучит «Поиск».

---
Эти примеры можно использовать как шаблоны при генерации компонентов ИИ и для проверки соответствия стилистике проекта. В них показано сочетание классов Tailwind, компонентов shadcn/ui и интеграция с архитектурой: формы связаны с полями API, карточки отображают данные из `DataModel` (таблицы `locations`, `tags`), а видимость модалок контролируется через глобальное состояние (Zustand).
