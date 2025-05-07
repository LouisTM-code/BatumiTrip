"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

/**
 * Бейдж‑тег, который сам переключает фильтр.
 * Выбранные теги берём из Zustand, поэтому отдельный
 * prop `onClick` больше не нужен.
 */
export default function TagBadge({ name, className }) {
  // селектор через zustand — важно, чтобы объект не пересоздавался лишний раз
  const selectedTags =  useUIStore((s) => s.selectedTags);
  const toggleTag = useUIStore((s) => s.toggleTag);

  const isActive = selectedTags.includes(name);

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleTag(name);
      }}
      role="button"
      aria-pressed={isActive}
      aria-label={`Фильтр по тегу «${name}»`}
      className={cn(
        // базовые стили
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium select-none transition",
        // состояние
        isActive
          ? "bg-secondary text-secondary-foreground border-secondary"
          : "bg-muted text-muted-foreground border-border hover:bg-secondary/20",
        className
      )}
    >
      {name}
    </motion.span>
  );
}
