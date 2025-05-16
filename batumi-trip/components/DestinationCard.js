'use client';
import React, { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * DestinationCard — упрощённая карточка направления (ветки).
 * Показывает обложку (cover_url) и название. При клике ведёт во внутренний
 * список локаций `/destination/{id}`.
 *
 * • Обложка берётся из `direction.cover_url`; если нет — используется placeholder.
 * • Анимация наведения аналогична LocationCard (scale ≈ 1.03).
 * • Размеры/классы соответствуют StyleGuide‑BatumiTrip.
 *
 * @param {Object} props
 * @param {{ id:string, title:string, cover_url?:string|null }} props.direction
 */
function DestinationCard({ direction }) {
  const { id, title, cover_url: coverUrl } = direction;
  const [imgLoaded, setImgLoaded] = useState(false);

  const imageSrc = coverUrl && /^https?:\/\//.test(coverUrl)
    ? coverUrl
    : 'https://cataas.com/cat/gif';

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03 }}
      className="group relative rounded-2xl bg-card text-card-foreground p-4 shadow transition-shadow"
    >
      <Link
        href={`/destination/${id}`}
        className="block no-underline hover:no-underline focus:no-underline"
      >
        {/* Обложка */}
        <div className="relative h-40 w-full overflow-hidden rounded-lg">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              'object-cover transition-opacity duration-500',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImgLoaded(true)}
            priority={false}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
        </div>
        {/* Название */}
        <h3 className="mt-4 text-lg font-semibold line-clamp-2">{title}</h3>
      </Link>
    </motion.div>
  );
}

export default memo(DestinationCard);