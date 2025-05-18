'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LocationForm from '@/components/LocationForm';
import { useUIStore } from '@/store/uiStore';

export default function AddLocationPage() {
  const { dirId } = useParams();
  const setActiveDirection = useUIStore((s) => s.setActiveDirection);

  // Устанавливаем activeDirectionId при монтировании и сбрасываем при размонтировании
  useEffect(() => {
    setActiveDirection(dirId || null);
    return () => {
      setActiveDirection(null);
    };
  }, [dirId, setActiveDirection]);

  return (
    <main className="container mx-auto px-4 py-6">
      <Header />
      <LocationForm />
    </main>
  );
}
