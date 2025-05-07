// app/page.js  (роут /)
import LocationList from '@/components/LocationList';
import AddLocationButton from '@/components/AddLocationButton'
import Header from '@/components/Header';

export default function LocationListPage() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <Header />
      <LocationList />
      <AddLocationButton />
    </main>
  );
}
