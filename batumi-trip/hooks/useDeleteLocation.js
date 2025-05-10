"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import deleteImage from "@/lib/deleteImage";
import toast from "react-hot-toast";
import { useUIStore } from "@/store/uiStore";
/**
 * useDeleteLocation — удаляет локацию через RPC‑функцию `delete_location`,
 * чистит связанные записи из favourites, locations_tags и файл в Storage.
 * После успеха должен быть вызван `router.push('/')` на уровне компонента,
 * где используется этот хук (см. LocationDetailPage).
 *
 * Возвращает объект `mutation` из React‑Query.
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  const clearFavourite = useUIStore((s) => s.toggleFavourite);

  return useMutation({
    /**
     * @param {{ id: string, imageUrl?: string|null }} payload
     */
    mutationFn: async ({ id, imageUrl }) => {
      // 1) Удаляем запись + связки тегов каскадом через RPC
      const { error: rpcError } = await supabase.rpc("delete_location", {
        location_id: id,
      });
      if (rpcError) throw rpcError;

      // 2) Удаляем favourites текущего пользователя к этой локации (без RPC)
      const { error: favErr } = await supabase
        .from("favourites")
        .delete()
        .eq("location_id", id);
      if (favErr) {
        // не критично — просто логируем
        console.warn("Failed to delete favourites for location", favErr);
      }

      // 3) Удаляем картинку из Storage, если была
      try {
        if (imageUrl) await deleteImage(imageUrl);
      } catch (imgErr) {
        console.warn("Failed to delete image file:", imgErr);
      }

      return { id };
    },

    // ====== React‑Query callbacks ======
    onSuccess: (_data, { id }) => {
      /* Инвалидируем кеши списка локаций / избранного */
      queryClient.invalidateQueries(["locations"]);
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      // Сбрасываем флаг избранного локально, если был
      clearFavourite(id);
      toast.success("Локация удалена");
    },

    onError: (err) => {
      toast.error(err?.message || "Не удалось удалить локацию");
    },
  });
}
