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
  const selectedTags = useUIStore((s) => s.selectedTags);
  const matchesFilter =
    selectedTags.length === 0 ||
    selectedTags.every((tag) => tags.includes(tag));

  if (!matchesFilter) return null;

  // Фолбэк для некорректных URL
  const imageSrc = imgUrl && /^https?:\/\//.test(imgUrl)
    ? imgUrl
    : "https://cataas.com/cat/gif";

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-2xl bg-white p-4 shadow transition-shadow"
    >
      <Link href={`/locations/${id}`}>
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