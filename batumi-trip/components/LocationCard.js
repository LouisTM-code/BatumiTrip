// components/LocationCard.jsx
"use client";

import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
/**
 * LocationCard — карточка локации
 * photo, title, truncated description, list of TagBadge
 */
const LocationCard = ({ location }) => {
  const { id, title, description, imgUrl, tags, isFavourite } = location;

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
        <p className="mt-2 text-sm text-gray-600">
          {description.length > 100 ? `${description.slice(0, 100)}…` : description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <p>теги...</p>
        </div>
      </Link>
      <div
        className={cn(
          "absolute top-4 right-4 rounded-full p-2 shadow",
          isFavourite && "text-yellow-500"
        )}
        aria-label={isFavourite ? "Удалено из избранного" : "Добавлено в избранное"}
      >
        <Star size={20} />
      </div>
    </motion.div>
  );
};

export default memo(LocationCard);
