// app/page.js  (роут /)
import LocationList from '@/components/LocationList';
import AddLocationButton from '@/components/AddLocationButton'
import Header from '@/components/Header';
import TagsPrefetcher from '@/lib/TagsPrefetcher';

export default function LocationListPage() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <TagsPrefetcher />
      <Header />
      <LocationList />
      <AddLocationButton />
    </main>
  );
}
