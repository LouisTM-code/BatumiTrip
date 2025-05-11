"use client";

import React from "react";
import SearchBar from "@/components/SearchBar";

export default function TestSearchPage() {
  return (
      <div className="min-h-screen flex flex-col items-center justify-start p-8 bg-gray-50">
        <h1 className="text-3xl font-semibold mb-6">SearchBar Isolation Test</h1>
        <div className="w-full max-w-md">
          <SearchBar placeholder="Тестовый поиск…" />
        </div>
      </div>
  );
}
