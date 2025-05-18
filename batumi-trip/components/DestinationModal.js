"use client";
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AttachImage from "@/components/AttachImage";
import { useForm, useController } from "react-hook-form";
import countries from "i18n-iso-countries";
import ru from "i18n-iso-countries/langs/ru.json";
import EmojiFlag from "react-emoji-flag";
import { useAddDirection, useUpdateDirection } from "@/hooks/directionsHooks";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/uiStore";

// ---------- Подготовка справочника стран ---------- //
countries.registerLocale(ru);
const countryOptions = Object.entries(
  countries.getNames("ru", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "ru"));

/**
 * Выпадающий список стран с флагами (shadcn Select + react‑emoji‑flag)
 * Интеграция с react‑hook‑form через useController
 */
function CountrySelect({ control, name = "country", rules }) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name, rules });
  return (
    <div className="space-y-1">
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-label="Страна">
          <SelectValue placeholder="Страна" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {countryOptions.map(({ code, name }) => (
            <SelectItem key={code} value={code} className="flex items-center gap-2">
              <EmojiFlag countryCode={code} style={{ fontSize: "1rem" }} />
              <span>{name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive-foreground">{error.message}</p>
      )}
    </div>
  );
}

export default function DestinationModal({
  isOpen,
  onClose,
  initialData = null, // { id, title, country, city, cover_url }
}) {
  const isEditMode = Boolean(initialData?.id);
  // ---------- react‑hook‑form ---------- //
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      title: initialData?.title ?? "",
      country: initialData?.country ?? "",
      city: initialData?.city ?? "",
      coverFile: null,
    },
  });

  // эскиз: сохраняем черновик в zustand (если понадобится recovery)
  const setDraft = useUIStore((s) => s.setDirectionDraft);
  useEffect(() => {
    const subscription = watch((values) => setDraft(values));
    return () => subscription.unsubscribe();
  }, [watch, setDraft]);

  // ---------- мутации ---------- //
  const addMutation = useAddDirection();
  const updateMutation = useUpdateDirection();

  // ---------- submit ---------- //
  const onSubmit = async (values) => {
    if (isEditMode) {
      updateMutation.mutate(
        {
          id: initialData.id,
          data: {
            title: values.title.trim(),
            country: values.country,
            city: values.city.trim() || null,
            coverFile: values.coverFile,
            oldCoverUrl: initialData.cover_url,
          },
        },
        {
          onSuccess: () => {
            toast.success("Направление обновлено");
            setDraft(null);
            onClose();
          },
        }
      );
    } else {
      addMutation.mutate(
        {
          title: values.title.trim(),
          country: values.country,
          city: values.city.trim() || null,
          coverFile: values.coverFile, // required в useAddDirection
        },
        {
          onSuccess: () => {
            toast.success("Направление создано");
            setDraft(null);
            onClose();
          },
        }
      );
    }
  };

  const isSubmitting = addMutation.isLoading || updateMutation.isLoading;

  // ---------- UI ---------- //
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-background/30 backdrop-blur-sm" />

        <DialogContent className="w-full max-w-md overflow-y-auto rounded-xl bg-card text-card-foreground shadow-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            {/* ---------- Header ---------- */}
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {isEditMode ? "Редактировать направление" : "Создать направление"}
              </DialogTitle>
            </DialogHeader>

            {/* ---------- Form ---------- */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-4"
              aria-label="Форма направления"
            >
              {/* Название */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Название<span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  {...register("title", { required: "Обязательное поле" })}
                  className="mt-1 w-full"
                />
                {errors.title && (
                  <p className="text-sm text-destructive-foreground mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Страна */}
              <div>
                <label className="block text-sm font-medium">
                  Страна<span className="text-destructive">*</span>
                </label>
                <CountrySelect
                  control={control}
                  name="country"
                  rules={{ required: "Выберите страну" }}
                />
              </div>

              {/* Город */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium">
                  Город
                </label>
                <Input
                  id="city"
                  {...register("city")}
                  className="mt-1 w-full"
                />
              </div>

              {/* Обложка */}
              <div>
                <label className="block text-sm font-medium">
                  Обложка<span className="text-destructive">*</span>
                </label>
                <AttachImage
                  control={control}
                  name="coverFile"
                  rules={
                    isEditMode
                      ? undefined
                      : { required: "Изображение обязательно" }
                  }
                  initialUrl={initialData?.cover_url}
                  className="mt-1"
                />
              </div>

              {/* Footer */}
              <DialogFooter className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? "Сохраняем…"
                      : "Создаём…"
                    : isEditMode
                    ? "Сохранить"
                    : "Создать"}
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
