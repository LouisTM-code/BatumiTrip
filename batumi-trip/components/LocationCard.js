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
