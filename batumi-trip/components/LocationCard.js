'use client';
import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import TagBadge from '@/components/TagBadge';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useToggleFavourite } from '@/hooks/useToggleFavourite';

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

  /* tag‑filter + favourite‑filter */
  const matchesFilter =
    (!showOnlyFavourites || isFavourite) &&
    (selectedTags.length === 0 ||
      selectedTags.every((tag) => tags.includes(tag)));

  /* optimistic favourite toggle */
  const toggleFavourite = useToggleFavourite(id);

  /* fallback image */
  const imageSrc =
    imgUrl && /^https?:\/\//.test(imgUrl)
      ? imgUrl
      : 'https://cataas.com/cat/gif';

  if (!matchesFilter) return null;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="
        group relative rounded-2xl bg-card p-4 shadow
        transition-shadow
        hover:shadow-lg
      "
    >
      <Link href={`/locations/${id}`} className="block space-y-2">
        <Image
          src={imageSrc}
          alt={title}
          width={400}
          height={240}
          className="h-40 w-full rounded-lg object-cover"
        />

        <h3 className="text-lg font-semibold text-card-foreground break-words">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-3">
          {description}
        </p>
      </Link>

      {/* tags */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 pb-10">
          {tags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
        </div>
      )}

      {/* favourite star (auth only) */}
      {user && (
        <button
          type="button"
          onClick={toggleFavourite}
          aria-label={
            isFavourite ? 'Убрать из избранного' : 'Добавить в избранное'
          }
          className={cn(
            'absolute bottom-4 right-4 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-ring',
            isFavourite
              ? 'text-yellow-400'
              : 'text-muted-foreground hover:text-yellow-400'
          )}
        >
          <Star
            size={20}
            stroke="currentColor"
            fill={isFavourite ? 'currentColor' : 'none'}
          />
        </button>
      )}
    </motion.div>
  );
};

export default memo(LocationCard);