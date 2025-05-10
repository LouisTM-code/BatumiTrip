'use client';
import React, { useEffect, useRef, useState } from "react";
import { useController } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
/**
* @param {Object}   props
* @param {string?}  [props.initialUrl] – URL уже загруженного изображения
*/
// Обновлённый AttachImage: сохраняем один File вместо FileList
export default function AttachImage({ control, name = "imageFile", rules, initialUrl = null, className }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(initialUrl);

  const {
    field: { value, onChange, ref },
    fieldState: { error },
  } = useController({ control, name, rules });

  // Сохраняем один File, а не FileList
  const handleSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    onChange(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleRemove = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Очищаем preview при unmount
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className={cn("space-y-2", className)}>
      {!preview && (
        <label
          className="flex flex-col items-center justify-center w-full max-w-xs gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer text-sm text-muted-foreground hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Загрузить изображение"
        >
          <Upload className="h-6 w-6" aria-hidden="true" />
          <span>Нажмите чтобы выбрать фото</span>
          <input
            type="file"
            accept="image/*"
            ref={(el) => {
              ref(el);
              inputRef.current = el;
            }}
            onChange={handleSelect}
            className="sr-only"
          />
        </label>
      )}
      {preview && (
        <div className="relative w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Предпросмотр изображения"
            className="h-48 w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Удалить изображение"
            className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white backdrop-blur hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {error && <p className="text-sm text-destructive-foreground">{error.message}</p>}
    </div>
  );
}
