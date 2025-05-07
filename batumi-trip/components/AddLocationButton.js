'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Кнопка «Добавить локацию» — ссылка на форму /locations/new
 * Реализована согласно ComponentsDesign‑BatumiTrip.md (AddLocationButton).
 */
export default function AddLocationButton({ className = '' }) {
  return (
    <Button
      asChild
      className={`fixed bottom-4 right-4 sm:static flex items-center gap-2 ${className}`}
      aria-label="Добавить локацию"
    >
      <Link href="/locations/new">
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Добавить локацию</span>
      </Link>
    </Button>
  );
}
