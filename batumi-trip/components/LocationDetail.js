'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import TagBadge from '@/components/TagBadge';
import { useRouter } from 'next/navigation';

/**
 * Компонент подробной информации о локации.
 * Отображает карточку локации с деталями и автором внизу.
 *
 * @param {{
 *   location: import('@/hooks/useOneLocation').Location & { user_id: string }
 * }} props
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
    user_id: authorId, // автор карточки
  } = location;

  // Фолбэк для некорректных URL
  const imageSrc =
    imgUrl && /^https?:\/\//.test(imgUrl)
      ? imgUrl
      : 'https://cataas.com/cat/gif';

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* ---------- Заголовок ---------- */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold break-words">{title}</h1>
      </header>

      {/* ---------- Изображение ---------- */}
      <div className="relative h-60 w-full overflow-hidden rounded-lg shadow">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>

      {/* ---------- Ключевые поля ---------- */}
      <section className="space-y-2 text-sm leading-relaxed">
        {address && (
          <p>
            <strong>Адрес:&nbsp;</strong>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(
                address,
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

      {/* ---------- Описание ---------- */}
      {description && (
        <p className="prose dark:prose-invert max-w-none">{description}</p>
      )}

      {/* ---------- Теги ---------- */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
        </div>
      )}

      {/* ---------- Автор ---------- */}
      <div className="flex items-center gap-2">
        <span className="text-base font-medium text-muted-foreground">
          Автор:
        </span>
        <span
          className="
            inline-block rounded-md bg-muted 
            px-3 py-1 text-sm font-semibold text-foreground
            select-none
          "
        >
          {authorId}
        </span>
      </div>

      {/* ---------- Навигация ---------- */}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => router.push('/')}>
          Назад
        </Button>
      </div>
    </motion.article>
  );
}
