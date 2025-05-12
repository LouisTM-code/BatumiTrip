'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function CircleProgress({ current, total, size = 48, stroke = 4 }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = current / total;
  const offset = circ * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-primary"
      aria-hidden="true"
    >
      {/* фон */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        opacity={0.15}
        fill="none"
      />
      {/* прогресс — поворачиваем сам путь, а не весь svg */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circ}
        initial={false}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* числовой счётчик — остаётся горизонтальным */}
      <motion.text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.28}
        fill="currentColor"
        className="origin-center text-foreground select-none"
        key={current}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.35 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {`${current}/${total}`}
      </motion.text>
    </svg>
  );
}

export default function FormHeader({
  currentStep,
  totalSteps,
  title,
  nextTitle,
  className = '',
}) {
  return (
    <header className={cn('mb-6 flex items-center gap-4', className)}>
      <CircleProgress current={currentStep} total={totalSteps} />
      <div className="flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={title}
            className="text-lg font-semibold leading-tight"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {title}
          </motion.h2>
        </AnimatePresence>
        {nextTitle && (
          <span className="text-xs text-muted-foreground">
            Далее:&nbsp;{nextTitle}
          </span>
        )}
      </div>
    </header>
  );
}