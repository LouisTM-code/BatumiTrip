"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * TagBadge — компактный «pill»‑бейдж для отображения/выбора тега локации.
 *
 * @prop {string}  name      – текст тега
 * @prop {(tag:string)=>void} [onClick]
 * @prop {string}  [className]
 *
 * Если передан onClick → элемент получает role="button"
 * и лёгкую анимацию hover/tap через Framer Motion.
 */
export default function TagBadge({ name, onClick, className }) {
  const interactive = typeof onClick === "function";

  const handleClick = (e) => {
    if (!interactive) return
      e.stopPropagation();
      e.preventDefault();
      onClick(name);
  };

  return (
      <motion.span
        whileHover={interactive ? { scale: 1.05 } : undefined}
        whileTap={interactive ? { scale: 0.95 } : undefined}
        onClick={handleClick}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? `Фильтровать по тегу «${name}»` : undefined}
      className={cn(
        "inline-flex select-none items-center rounded-full border border-border",
        "bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
        interactive && "cursor-pointer hover:bg-secondary/20",
        className
      )}
    >
      {name}
    </motion.span>
  );
}
