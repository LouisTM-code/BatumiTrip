"use client";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/LoginModal";
import { motion } from "framer-motion";
import { LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header – верхняя навигационная панель.
 *
 * ▸ Показывает логотип приложения (ссылку на главную страницу).
 * ▸ Если пользователь НЕ аутентифицирован – кнопка «Войти» открывает LoginModal (через Zustand).
 * ▸ Если аутентифицирован – отображает его id и кнопку «Выйти» (NextAuth signOut).
 * ▸ Анимация: лёгкий slide-down + fade-in при монтировании;
 *   фон – основной цвет (primary) с прозрачностью + мягкая тень.
 */
export default function Header({ className }) {
  const { user, signOut } = useAuth();
  const setLoginModal = useUIStore((s) => s.setLoginModal);

  const handleLoginClick = () => setLoginModal(true);

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
            src="/logo.png"          // файл public/logo.png
            alt="Batumi Trip logo"
            width={150}          
            height={100}             
            className="object-contain" />
          <span className="sr-only">Batumi Trip</span>
        </Link>

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

      <LoginModal />
    </>
  );
}
