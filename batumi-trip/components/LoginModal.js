"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import {
  Dialog,
  DialogTrigger,
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

/**
 * LoginModal — модальное окно без‑парольного входа
 */
export default function LoginModal() {
  const show = useUIStore((s) => s.showLoginModal);
  const setShow = useUIStore((s) => s.setLoginModal);
  const { status } = useSession();

  const [error, setError] = useState("");
  const [login, setLogin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Закрыть при авторизации
  useEffect(() => {
    if (status === "authenticated") setShow(false);
  }, [status, setShow]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = login.trim();
    // РегExp: только латиница и кириллица, от 3 до 32 символов
    const re = /^[A-Za-z\u0400-\u04FF]{3,32}$/;
    if (!re.test(trimmed)) {
      setError(
        "Неверное имя: только буквы латиницы и кириллицы, без цифр и спецсимволов, 3–32 символа."
        );
      return;
    }
    setIsSubmitting(true);
    await signIn("credentials", {
      username: trimmed,
      redirect: false,
    });
    setIsSubmitting(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <Dialog open={show} onOpenChange={setShow}>
          <DialogPortal>                                  {/* ① */}
            <DialogOverlay />                              {/* ② */}
            <DialogContent>                                {/* ③ */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-card text-card-foreground rounded-xl shadow-lg w-full max-w-sm overflow-hidden"
              >
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle className="text-center text-xl font-semibold">
                    Войти без пароля
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 px-6 pb-6 pt-4"
                  aria-label="Форма входа"
                >
                  <Input
                    id="username"
                    placeholder="Ваш логин"
                    autoComplete="username"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                  />

                  {/* Анимированное отображение ошибки */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-red-100 border border-red-300 text-red-800 rounded p-2 text-sm"
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
