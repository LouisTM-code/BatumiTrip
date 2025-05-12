// LoginModal.js — вход без пароля.
// ⚠️ Обновлён по задаче: убраны все пути закрытия модалки, кроме успешного логина.
//    • скрыт стандартный «крестик» DialogClose (Tailwind селектор).
//    • клики по оверлею / ESC не закрывают окно (onOpenChange фильтрует false).

"use client";
import { useState, useEffect, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import animationData from "@/public/loginAnimation.json";

// ---------- lazy‑загрузка Lottie ----------
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function LoginModal() {
  /* ----- глобальный UI‑state (Zustand) ----- */
  const show = useUIStore((s) => s.showLoginModal);
  const setShow = useUIStore((s) => s.setLoginModal);
  /* ----- auth‑статус ----- */
  const { status } = useSession();

  /* ----- локальный стэйт формы ----- */
  const [login, setLogin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  /* ----- автопоказ, если пользователь не авторизован ----- */
  useEffect(() => {
    if (status === "unauthenticated" && !show) setShow(true);
  }, [status, show, setShow]);

  /* ----- закрыть МОДАЛКУ только ПОСЛЕ успешного логина ----- */
  useEffect(() => {
    if (status === "authenticated") setShow(false);
  }, [status, setShow]);

  /* ----- валидация и отправка формы ----- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = login.trim();
    const re = /^[A-Za-z\u0400-\u04FF]{3,32}$/; // 3–32 буквы (лат/кирилл)
    if (!re.test(trimmed)) {
      setError("Неверное имя: 3–32 символа, только буквы.");
      return;
    }
    setError("");
    setSubmitting(true);
    await signIn("credentials", { username: trimmed, redirect: false });
    setSubmitting(false);
  };

  /* ----- фильтруем onOpenChange, запрещая закрывать окно ----- */
  const handleOpenChange = useCallback(
    /** @param {boolean} next */ (next) => {
      if (next) setShow(true); // permit only attempts to OPEN, ignore close
    },
    [setShow]
  );

  return (
    <AnimatePresence>
      {show && (
        <Dialog open={show} onOpenChange={handleOpenChange}>
          <DialogPortal>
            {/* размытый фон вместо затемнения */}
            <DialogOverlay className="fixed inset-0 bg-background/30 backdrop-blur-sm" />

            <DialogContent
              /* скрываем стандартный крестик внутри Content */
              className="w-full max-w-sm overflow-hidden rounded-xl bg-card text-card-foreground shadow-lg [&>button]:hidden"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                {/* ---------- Header ---------- */}
                <DialogHeader className="flex flex-col items-center px-6 pt-6">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0.1 }}
                    animate={{ scale: 1.8, opacity: 1 }}
                    transition={{ duration: 6 }}
                    className="mb-4 h-24 w-24"
                  >
                    <Lottie animationData={animationData} loop autoplay />
                  </motion.div>

                  <DialogTitle className="text-center text-xl font-semibold">
                    Авторизация
                  </DialogTitle>
                  <p className="mt-2 text-center text-sm italic text-muted-foreground">
                    Бывали здесь раньше? Введите то же Имя. <br /> Оно связано с
                    Вашими локациями.
                  </p>
                </DialogHeader>

                {/* ---------- Form ---------- */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 px-6 pb-6 pt-4"
                  aria-label="Форма входа"
                >
                  <Input
                    id="username"
                    placeholder="Познакомимся?"
                    autoComplete="username"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="peer"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden rounded border border-red-300 bg-red-100 p-2 text-sm text-red-800"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Входим…" : "Войти"}
                    </Button>
                  </DialogFooter>
                </form>
              </motion.div>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
