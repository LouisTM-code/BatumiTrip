'use client';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function FavouriteFilterButton({ className = '' }) {
  // 1) хуки всегда на самом верху
  const { user } = useAuth();
  const showOnlyFavourites = useUIStore((s) => s.showOnlyFavourites);
  const toggle = useUIStore((s) => s.toggleShowOnlyFavourites);

  // 2) только после этого — ранний return для неавторизованных
  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn('fixed bottom-4 left-4 z-50', className)}
    >
      <Button
        variant={showOnlyFavourites ? 'secondary' : 'outline'}
        size="icon"
        aria-label={
          showOnlyFavourites
            ? 'Показать все локации'
            : 'Показать только избранные'
        }
        onClick={toggle}
        className="rounded-full shadow-lg"
      >
        <Star
          className="h-5 w-5"
          stroke="currentColor"
          fill={showOnlyFavourites ? 'currentColor' : 'none'}
        />
      </Button>
    </motion.div>
  );
}
