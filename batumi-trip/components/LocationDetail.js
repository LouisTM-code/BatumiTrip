// file: components/LocationDetail.js
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
          onLoadingComplete={() => setImgLoaded(true)}
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
