'use client';
export default function LocationCard({ title, description }) {
  return (
    <div className="bg-card rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground text-sm line-clamp-3">{description}</p>}
    </div>
  );
}