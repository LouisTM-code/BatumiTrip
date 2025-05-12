"use client";
import { useTags } from "@/hooks/useTags";
/**
 * TagsPrefetcher — «ничего не рендерит», но при монтировании
 * вызывает useTags() и тем самым прогревает кеш ['tags'].
 */
export default function TagsPrefetcher() {
  useTags();
  return null;
}
