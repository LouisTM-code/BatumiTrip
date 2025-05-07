"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/LoginModal";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, LogIn, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";

export default function Header({ className }) {
  const { user, signOut } = useAuth();
  const setLoginModal = useUIStore((s) => s.setLoginModal);
  const [isSearchOpen, setSearchOpen] = useState(false);

  const handleLoginClick = () => setLoginModal(true);
  const toggleSearch = () => setSearchOpen((o) => !o);

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-30 flex w-full items-center justify-between px-4 py-3",
          "bg-primary/90 backdrop-blur-md supports-[backdrop-filter]:bg-foreground/80",
          "shadow-md text-primary-foreground",
          className
        )}
      >
        {/* Logo */}
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

        {/* Search Icon */}
        <button
          onClick={toggleSearch}
          aria-label="Поиск"
          className="p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
        >
          <Search className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Auth section */}
        {user ? (
          <div className="flex items-center gap-4">
            <span className="select-none text-base font-semibold">
              {user.id}
            </span>
            <Button
              size="md"
              variant="secondary"
              onClick={() => signOut()}
              aria-label="Выйти"
              className="gap-2 px-4 py-2"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span className="not-sr-only">Выйти</span>
            </Button>
          </div>
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

      {/* Search bar */}
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

      <LoginModal />
    </>
  );
}
