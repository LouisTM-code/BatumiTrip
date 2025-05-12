'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* анимированная обёртка для shadcn‑кнопок */
const MotionButton = motion(Button);

/**
 * FormNavigation – нижняя навигация формы.  
 * • на мобильных (< md) фиксирована внизу экрана;  
 * • на десктопе (≥ md) остаётся на своём месте в потоке.  
 *
 * Цвета/варианты кнопок остаются прежними.
 */
export default function FormNavigation({
  currentStep,
  totalSteps,
  onBack,
  isSubmitting,
  className = '',
}) {
  const isLast = currentStep === totalSteps;

  return (
    <div
      className={cn(
        /* mobile — fixed bottom bar */
        'fixed bottom-0 left-0 z-40 w-full border-t border-border bg-card/90 backdrop-blur-md px-4 py-3',
        /* desktop — как было */
        'md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0',
        'flex justify-between',
        className,
      )}
    >
      <MotionButton
        variant="outline"
        type="button"
        onClick={onBack}
        aria-label="Вернуться"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Назад
      </MotionButton>

      <MotionButton
        type="submit"
        disabled={isSubmitting}
        aria-label={isLast ? 'Сохранить' : 'Следующий шаг'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isLast
          ? isSubmitting
            ? 'Сохраняем…'
            : 'Сохранить'
          : 'Далее'}
      </MotionButton>
    </div>
  );
}
