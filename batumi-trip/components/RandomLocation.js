'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * @param {{ location: { id: string, title: string, image_url: string|null, direction_id: string } }} props
 */
export default function RandomLocation({ location }) {
  const router = useRouter();
  const { id, title, image_url, direction_id } = location;
  const imageSrc =
    image_url && /^https?:\/\//.test(image_url)
      ? image_url
      : 'https://cataas.com/cat/gif';

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/destination/${direction_id}/locations/${id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 min-w-0 rounded-2xl',
        'hover:underline focus:underline focus:outline-none',
        'transform hover:scale-[1.05] transition duration-200'
      )}
    >
      <div className="relative h-12 w-16 md:h-14 md:w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <span className="flex-1 text-left min-w-0 font-medium text-card-foreground truncate">
        {title}
      </span>
    </button>
  );
}
