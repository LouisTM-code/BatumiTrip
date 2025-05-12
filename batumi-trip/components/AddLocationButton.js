"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
/**
 * Плавающая кнопка «Добавить локацию».
 * • фиксирована в правом нижнем углу на всех брейкпоинтах;
 * • скрыта для неавторизованных посетителей.
 */
export default function AddLocationButton({ className = "" }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Button
      asChild
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 ${className}`}
      aria-label="Добавить локацию"
    >
      <Link href="/locations/new">
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Добавить локацию</span>
      </Link>
    </Button>
  );
}
