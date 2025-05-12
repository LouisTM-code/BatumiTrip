// components/SearchBar.js
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/uiStore";
import { useTags } from "@/hooks/useTags";
import TagBadge from "@/components/TagBadge";
import { cn } from "@/lib/utils";

/**
 * SearchBar — поле ввода + список тегов‑фильтров.
 *
 * • Ввод записывается в Zustand (`searchQuery`) c debounce = 1 с.
 * • Теги берутся через useTags() и отображаются под инпутом.
 * • Клик по тегу переключает его в Zustand (`toggleTag` в TagBadge).
 *
 * @param {string} placeholder – плейсхолдер строки поиска
 */
export default function SearchBar({
  placeholder = "Поиск локаций…",
  className,
}) {
  /* ---------- глобальный поиск (Zustand) ---------- */
  const searchQuery     = useUIStore((s) => s.searchQuery);
  const setSearchQuery  = useUIStore((s) => s.setSearchQuery);

  /* ---------- локальное состояние ввода ---------- */
  const [value, setValue] = useState(searchQuery);

  /* debounce → глобальный store */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value !== searchQuery) setSearchQuery(value);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [value, searchQuery, setSearchQuery]);

  /* если searchQuery изменился извне — синхронизируем input */
  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);           // <‑‑ убрали value из зависимостей

  /* ---------- список тегов ---------- */
  const { data: tags = [], isLoading, isError } = useTags();

  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -8, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("w-full space-y-3", className)}
    >
      {/* строка поиска */}
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поле поиска локаций"
        className="w-full"
      />

      {/* блок тегов */}
      <AnimatePresence initial={false}>
        <motion.div
          key="tag-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {isLoading && (
              <span className="text-sm text-muted-foreground">
                Загружаем теги…
              </span>
            )}
            {isError && (
              <span className="text-sm text-destructive-foreground">
                Не удалось загрузить теги
              </span>
            )}
            {tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
