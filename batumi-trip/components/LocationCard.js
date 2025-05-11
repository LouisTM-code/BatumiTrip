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

/**
 * Превью‑карточка локации.
 * Добавлено: интерактивная «звёздочка» с хендлером useToggleFavourite(id).
 */
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
