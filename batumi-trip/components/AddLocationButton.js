'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
/**
 * Плавающая кнопка «Добавить локацию» внутри ветки.
 * Ссылается на маршрут /destination/[dirId]/locations/new
 */
export default function AddLocationButton({ className = "" }) {
  const { user } = useAuth();
  const activeDirectionId = useUIStore((s) => s.activeDirectionId);

  // Показываем кнопку только если есть авторизованный юзер и выбрано направление
  if (!user || !activeDirectionId) return null;

  return (
    <Button
      asChild
      className={`fixed hover:no-underline focus:no-underline bottom-4 right-4 z-50 flex items-center gap-2 ${className}`}
      aria-label="Добавить локацию"
    >
      <Link href={`/destination/${activeDirectionId}/locations/new`}>
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Добавить локацию</span>
      </Link>
    </Button>
  );
}
