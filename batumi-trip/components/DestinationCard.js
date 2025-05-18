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
import { MoreVertical, Plus } from 'lucide-react';
import { useLocationForCard } from '@/hooks/useLocationForCard';
import RandomLocation from '@/components/RandomLocation';
import Flag from 'react-world-flags';
import { Button } from '@/components/ui/button';

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
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.4)_100%)]" />
          </div>
          {/* текстовый блок */}
          <div className="flex w-full flex-col justify-between p-4 md:w-1/3">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-2xl font-semibold leading-tight line-clamp-2">
                <Flag code={country.toUpperCase()} height="32" width="32" />
                {title}
              </h3>
              {city && (
                <p className="text text-muted-foreground line-clamp-1">
                  {city}
                </p>
              )}
            </div>

            {/* Random locations or Add button */}
            {randomLocations.length > 0 ? (
              <div className="sm:p-4 pt-4">
                <div className="grid grid-cols-1 md:gap-y-6 gap-y-4">
                  {randomLocations.map(loc => (
                    <RandomLocation key={loc.id} location={loc} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="sm:p-4 pt-4 flex justify-center">
                <Button
                  asChild
                  className="w-full hover:no-underline focus:no-underline sm:w-auto flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-primary text-primary-foreground"
                >
                  <Link href={`/destination/${id}/locations/new`}>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Добавить локацию</span>
                  </Link>
                </Button>
              </div>
            )}

            {/* счётчик локаций — выделен стилизацией */}
            <div className="mt-4 md:mt-0 transform hover:scale-[1.08] transition duration-200">
              <span className="flex justify-center items-center gap-x-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                <LocationCount directionId={id} />
                <span> locations</span>
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
