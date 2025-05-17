'use client';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Mini card for a random location: small photo and title.
 * @param {{ location: { id:string, title:string, image_url:string|null, direction_id:string } }} props
 */
export default function RandomLocation({ location }) {
  const { id, title, image_url, direction_id } = location;
  const imageSrc =
    image_url && /^https?:\/\//.test(image_url)
      ? image_url
      : 'https://cataas.com/cat/gif';

  return (
    <Link
      href={`/destination/${direction_id}/locations/${id}`}
      className={cn(
        'flex items-center gap-3 min-w-0 rounded-2xl',
        'no-underline hover:underline focus:underline'
      )}
    >
      <div className="relative h-12 w-16 md:h-14 md:w-20 flex-shrink-0 rounded-xl overflow-hidden mr-1 bg-muted">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <span className="flex-1 min-w-0 text font-medium text-card-foreground truncate">
        {title}
      </span>
    </Link>
  );
}
