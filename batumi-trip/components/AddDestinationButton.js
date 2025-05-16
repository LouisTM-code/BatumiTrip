// components/AddDestinationButton.jsx
"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import DestinationModal from "@/components/DestinationModal";

/**
 * Плавающая кнопка «Добавить направление».
 * • fixed bottom-right поверх destinationGrid (z-50);
 * • скрыта для гостей;
 * • по клику открывает DestinationModal (stub).
 */
export default function AddDestinationButton({ className = "" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button
        type="button"
        aria-label="Добавить направление"
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 ${className}`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Добавить направление</span>
      </Button>

      <DestinationModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
