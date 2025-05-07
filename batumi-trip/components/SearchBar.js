"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

/**
 * SearchBar — поле ввода для поиска локаций по заголовку и тегам.
 * Самостоятельно сохраняет текст запроса в global‑store (Zustand).
 *
 * Props:
 *  @param {string} [placeholder] — текст плейсхолдера ввода (по умолчанию «Поиск локаций…»)
 */
export default function SearchBar({ placeholder = "Поиск локаций…", className }) {
  /* Глобальный Zustand store */
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);

  /* Локальное состояние ввода */
  const [value, setValue] = useState(searchQuery);

  /* Debounce (300 мс) перед обновлением Zustand */
  useEffect(() => {
    const id = window.setTimeout(() => {
      // Обновляем global‑state только если строка изменилась
      if (value !== searchQuery) {
        setSearchQuery(value);
      }
    }, 1000);

    return () => window.clearTimeout(id);
  }, [value, searchQuery, setSearchQuery]);

  /* Сбрасываем локальный инпут, если глобальное состояние поменялось извне */
  useEffect(() => {
    if (searchQuery !== value) setValue(searchQuery);
  }, [searchQuery]);

  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поле поиска локаций"
        className="w-full" // Tailwind: растягиваем на 100 %
      />
    </motion.div>
  );
}
