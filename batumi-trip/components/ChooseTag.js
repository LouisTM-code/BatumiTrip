"use client";

import React, { useState } from "react";
import { useController } from "react-hook-form";
import { useTags } from "@/hooks/useTags";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ChooseTag({ control, name = "tags", rules }) {
  const {
    field: { value: selected = [], onChange },
  } = useController({ control, name, rules });

  const { data: tags = [], isLoading, isError } = useTags();
  const [newTag, setNewTag] = useState("");
  const queryClient = useQueryClient();

  const createTag = useMutation({
    mutationFn: async (name) => {
      const trimmed = name.trim();
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: trimmed })
        .select()
        .single();
      if (error && error.code !== "23505") throw error;
      return data ?? { name: trimmed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["tags"]);
      if (!selected.includes(data.name)) onChange([...selected, data.name]);
      setNewTag("");
    },
  });

  const toggle = (tag) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const exists = tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      if (!selected.includes(trimmed)) toggle(trimmed);
      setNewTag("");
      return;
    }
    createTag.mutate(trimmed);
  };

  return (
    <div className="space-y-3">
      {/* Существующие теги */}
      <div className="flex flex-wrap gap-2">
        {isLoading && <span className="text-sm text-muted-foreground">Загрузка тегов…</span>}
        {isError && <span className="text-sm text-destructive-foreground">Ошибка загрузки тегов</span>}
        {tags.map((tag) => (
          <motion.span
            key={tag.id}
            whileTap={{ scale: 0.95 }}
            role="button"
            aria-pressed={selected.includes(tag.name)}
            onClick={() => toggle(tag.name)}
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium select-none transition cursor-pointer",
              selected.includes(tag.name)
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "bg-muted text-muted-foreground border-border hover:bg-secondary/20"
            )}
          >
            {tag.name}
          </motion.span>
        ))}
      </div>

      {/* Добавить свой тег */}
      <div className="flex gap-2" role="form">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Добавить тег…"
          aria-label="Новый тег"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button type="button" disabled={createTag.isLoading || !newTag.trim()} onClick={handleAdd}>
          {createTag.isLoading ? "…" : "Добавить"}
        </Button>
      </div>

      {/* Ошибка создания тега */}
      <AnimatePresence>
        {createTag.isError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-sm text-destructive-foreground"
          >
            Ошибка: {createTag.error?.message || 'не удалось добавить тег'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
