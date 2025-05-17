'use client';
import React, { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteDirection } from '@/hooks/directionsHooks';
import DestinationModal from '@/components/DestinationModal';
import LocationCount from '@/components/LocationCount';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import EmojiFlag from 'react-emoji-flag';
import { useLocationForCard } from '@/hooks/useLocationForCard';
import RandomLocation from '@/components/RandomLocation';
/**
 * @param {{
 *   id: string;
 *   title: string;
 *   cover_url?: string|null;
 *   user_id: string;
 *   country: string;        // ISO-код (Alpha-2) для EmojiFlag
 *   city?: string|null;
 * }} props.direction
 */
function DestinationCard({ direction }) {
  const {
    id,
    title,
    cover_url: coverUrl,
    user_id: authorId,
    country,
    city,
  } = direction;

  const { user } = useAuth();
  const deleteMutation = useDeleteDirection();
  const [isModalOpen, setModalOpen] = useState(false);
  const canEdit = user?.id === authorId;
  const { data: randomLocations = [] } = useLocationForCard(id);

  const handleDelete = () => {
    if (
      window.confirm(
        'Вы уверены? Это удалит направление и все связанные с ним локации. Действие необратимо.',
      )
    ) {
      deleteMutation.mutate({ id, coverUrl });
    }
  };
  /* fallback, если coverUrl пустой или не http/https */
  const imageSrc =
    coverUrl && /^https?:\/\//.test(coverUrl)
      ? coverUrl
      : 'https://cataas.com/cat/gif';

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.02 }}
        className={cn(
          'group relative overflow-hidden rounded-2xl bg-card text-card-foreground shadow transition-shadow md:flex',
          'md:h-[25rem]' // фиксированная высота 25rem на десктопе
        )}
      >
        {/* ----- меню “три точки” для автора ----- */}
        {canEdit && (
          <div className="absolute right-2 top-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Меню направления"
                  className="rounded-full bg-muted p-2 backdrop-blur hover:bg-muted/90 focus:outline-none"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setModalOpen(true)}>
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={handleDelete}
                >
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {/* ссылка охватывает оба блока: контент + изображение */}
        <Link
          href={`/destination/${id}`}
          className="flex flex-1 flex-col md:flex-row-reverse no-underline hover:no-underline focus:no-underline"
        >
          {/* изображение */}
          <div className="relative h-44 w-full shrink-0 md:h-full md:w-2/3">
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (min-width: 768px) 66vw"
              className="object-cover transition-opacity duration-500"
            />
          </div>
          {/* текстовый блок */}
          <div className="flex w-full flex-col justify-between p-4 md:w-1/3">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-lg font-semibold leading-tight line-clamp-2">
                <EmojiFlag
                  countryCode={country}
                  style={{ fontSize: '1.1rem' }}
                />
                {title}
              </h3>
              {city && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {city}
                </p>
              )}
            </div>
            {randomLocations.length > 0 && (
              <div className="sm:p-4 pt-4">
                <div className="grid grid-cols-1 md:gap-y-6 gap-y-4">
                  {randomLocations.map(loc => (
                    <RandomLocation key={loc.id} location={loc} />
                  ))}
                </div>
              </div>
            )}
            {/* счётчик локаций — выделен стилизацией */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-x-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                <LocationCount directionId={id} />
                <span>locations</span>
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
      {/* модалка редактирования */}
      {isModalOpen && (
        <DestinationModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          initialData={direction}
        />
      )}
    </>
  );
}

export default memo(DestinationCard);