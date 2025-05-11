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

const LocationCard = ({ location }) => {
  const {
    id,
    title,
    description,
    imgUrl,
    tags = [],
    isFavourite: initialFavourite = false,
  } = location;

  /* ---------- глобальный UI‑state ---------- */
  const selectedTags = useUIStore((s) => s.selectedTags);
  const favouritesMap = useUIStore((s) => s.favourites);
  const showOnlyFavourites = useUIStore((s) => s.showOnlyFavourites);

  const isFavourite = favouritesMap[id] ?? initialFavourite;
  /* ---------- auth ---------- */
  const { user } = useAuth();

  /* тег‑фильтр + фильтр «только избранное» */
  const matchesFilter =
    (!showOnlyFavourites || isFavourite) &&
    (selectedTags.length === 0 ||
      selectedTags.every((tag) => tags.includes(tag)));

  /* ---------- обработчик избранного ---------- */
  const toggleFavourite = useToggleFavourite(id);

  /* fallback‑изображение */
  const imageSrc =
    imgUrl && /^https?:\/\//.test(imgUrl)
      ? imgUrl
      : "https://cataas.com/cat/gif";

  if (!matchesFilter) return null;

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
      <div className="mt-3 flex flex-wrap gap-2 pb-10">
        {tags.map((tag) => (
          <TagBadge key={tag} name={tag} />
        ))}
      </div>

      {/* звезда избранного — внизу карточки, только для авторизованных */}
      {user && (
        <button
          type="button"
          onClick={toggleFavourite}
          aria-label={
            isFavourite ? "Убрать из избранного" : "Добавить в избранное"
          }
          className={cn(
            "absolute bottom-4 right-4 rounded-full p-2 shadow transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
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
    </motion.div>
  );
};
export default memo(LocationCard);