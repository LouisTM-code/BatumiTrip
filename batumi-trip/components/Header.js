"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import animationData from "@/public/userAnimation.json";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/LoginModal";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Lottie ‑ динамический импорт на клиенте
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function Header({ className }) {
  const { user, signOut } = useAuth();
  const setLoginModal = useUIStore((s) => s.setLoginModal);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const lottieRef = useRef(null);

  const handleLoginClick = () => setLoginModal(true);
  const toggleSearch = () => setSearchOpen((o) => !o);

  /** Запускаем один цикл анимации при нажатии */
  const playAnimation = () => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0, true);
    }
  };

  return (
    <>
      {/* ---------- Шапка ---------- */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-30 flex w-full items-center justify-between px-4 py-3",
          "bg-primary/90 backdrop-blur-md supports-[backdrop-filter]:bg-foreground/80",
          "shadow-md text-primary-foreground",
          className,
        )}
      >
        {/* Логотип */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Batumi Trip logo"
            width={150}
            height={100}
            className="object-contain"
          />
          <span className="sr-only">Batumi Trip</span>
        </Link>

        {/* Иконка поиска */}
        <button
          onClick={toggleSearch}
          aria-label="Поиск"
          className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Search className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* ---------- Auth‑блок ---------- */}
        {user ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <div
                role="button"
                aria-label="Меню пользователя"
                className="h-10 w-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={playAnimation}
              >
                <Lottie
                  lottieRef={lottieRef}
                  animationData={animationData}
                  loop={false}
                  autoplay={false}
                  className="h-10 w-10"
                />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="block w-full text-center uppercase truncate select-none tracking-wide px-2 py-1">
                {user.id}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  signOut();
                }}
                className="text-destructive focus:text-destructive"
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="md"
            onClick={handleLoginClick}
            aria-label="Войти"
            className="gap-2 px-4 py-2"
          >
            <LogIn className="h-5 w-5" aria-hidden="true" />
            <span className="not-sr-only">Войти</span>
          </Button>
        )}
      </motion.header>

      {/* ---------- Поисковая строка ---------- */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-4 py-2 flex justify-end">
              <SearchBar placeholder="Найти локацию..." />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Модалка логина ---------- */}
      <LoginModal />
    </>
  );
}
