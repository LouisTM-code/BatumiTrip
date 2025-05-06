// app/page.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, isLoading, signIn, signOut } = useAuth();
  const [counts, setCounts] = useState({
    users: null,
    locations: null,
    tags: null,
    favourites: null,
  });

  useEffect(() => {
    async function loadCounts() {
      const tables = ['users', 'locations', 'tags', 'favourites'];
      const results = {};
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { head: true, count: 'exact' });
        if (error) {
          console.error(`Error fetching ${table} count:`, error);
          results[table] = 'Error';
        } else {
          results[table] = count;
        }
      }
      setCounts(results);
    }

    loadCounts();
  }, []);

  if (isLoading) {
    return (
      <main className="p-8">
        <p>Loading authentication status…</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Setup Test</h1>

      {!user ? (
        <button
          className="px-4 py-2 bg-primary text-white rounded"
          onClick={() => signIn()}
        >
          Sign in
        </button>
      ) : (
        <div className="mb-6">
          <p className="mb-2">
            Logged in as <strong>{user.id}</strong>
          </p>
          <button
            className="px-4 py-2 bg-secondary text-white rounded"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4">Table Row Counts</h2>
        <ul className="list-disc list-inside space-y-1">
          {Object.entries(counts).map(([table, count]) => (
            <li key={table}>
              <span className="capitalize">{table}</span>: {count ?? '…'}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
