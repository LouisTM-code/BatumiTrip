"use client";
import { useEffect, useState } from "react";
import countries from "i18n-iso-countries";
import EmojiFlag from "react-emoji-flag";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// 1) Регистрация русского языка
import ruLocale from "i18n-iso-countries/langs/ru.json";
countries.registerLocale(ruLocale);

export default function CountriesPage() {
  const [countryCode, setCountryCode] = useState("");

  // 2) Генерация списка опций [{ code, name }]
  const options = Object.entries(countries.getNames("ru", { select: "official" }))
    .map(([code, name]) => ({ code, name }))
    // Опционально: отфильтровать уникальные, отсортировать
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-2">Выберите страну</h1>

      <Select onValueChange={setCountryCode} value={countryCode}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Страна" />
        </SelectTrigger>
        <SelectContent>
          {options.map(({ code, name }) => (
            <SelectItem key={code} value={code}>
              <span className="mr-2 align-middle">
                {/* 3) Эмоджи-флаг по коду */}
                <EmojiFlag countryCode={code} />
              </span>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {countryCode && (
        <p className="mt-4 text-xl">
          Выбрано: <EmojiFlag countryCode={countryCode} />{" "}
          {countries.getName(countryCode, "ru")}
        </p>
      )}
    </div>
  );
}
