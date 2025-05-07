"use client";
import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import TagBadge from "@/components/TagBadge";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

const LocationCard = ({ location }) => {
  const { id, title, description, imgUrl, tags = [], isFavourite } = location;

  // текущее состояние фильтра  
  const selectedTags = useUIStore((s) => s.selectedTags);

  // карточка видна, только если содержит ВСЕ выбранные теги
  const matchesFilter =
    selectedTags.length === 0 ||
    selectedTags.every((tag) => tags.includes(tag));

  if (!matchesFilter) return null;           // << ключевая строка

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-2xl bg-white p-4 shadow transition-shadow"
    >
      <Link href={`/locations/${id}`}>
        <Image
          src={imgUrl}
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

      {/* теги — теперь без пропа onClick, TagBadge управляет фильтром сам */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagBadge key={tag} name={tag} />
        ))}
      </div>

      <div
        className={cn(
          "absolute top-4 right-4 rounded-full p-2 shadow",
          isFavourite && "text-yellow-500"
        )}
        aria-label={
          isFavourite ? "Удалено из избранного" : "Добавлено в избранное"
        }
      >
        <Star size={20} />
      </div>
    </motion.div>
  );
};

export default memo(LocationCard);
