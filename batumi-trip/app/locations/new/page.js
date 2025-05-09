'use client';
import React from 'react';
import LocationForm from '@/components/LocationForm';

export default function AddLocationPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Добавить локацию</h1>
      <LocationForm />
    </main>
  );
}