// components/SkeletonCard.jsx
"use client";
import React from "react";

/**
 * SkeletonCard — placeholder-карточка для списка локаций
 * Показ отображается при загрузке данных
 */
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl bg-gray-200 p-4 shadow">
    <div className="h-40 w-full rounded-lg bg-gray-300"></div>
    <div className="mt-4 h-6 w-3/4 rounded bg-gray-300"></div>
    <div className="mt-2 h-4 w-1/2 rounded bg-gray-300"></div>
    <div className="mt-4 flex space-x-2">
      <div className="h-6 w-16 rounded bg-gray-300"></div>
      <div className="h-6 w-16 rounded bg-gray-300"></div>
    </div>
  </div>
);

export default SkeletonCard;
