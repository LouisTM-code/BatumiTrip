"use client";
import { useState, useEffect } from "react";
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

/**
 * LoginModal — модальное окно для входа по логину без пароля.
 *
 * ● При отсутствии авторизационной cookie открывается автоматически.  
 * ● Фон под модалкой не затемняется, а размывается (backdrop‑blur).  
 * ● Закрывается сразу после успешной авторизации.
 */
export default function LoginModal() {
  const show         = useUIStore((s) => s.showLoginModal);
  const setShow      = useUIStore((s) => s.setLoginModal);
  const { status }   = useSession();

  const [login, setLogin]           = useState("");
  const [error, setError]           = useState("");
  const [isSubmitting, setLoading]  = useState(false);

  /* ---------- автопоказ модалки, если куки нет ---------- */
  useEffect(() => {
    if (status === "unauthenticated" && !show) setShow(true);
  }, [status, show, setShow]);

  /* ---------- закрытие после логина ---------- */
  useEffect(() => {
    if (status === "authenticated") setShow(false);
  }, [status, setShow]);

  /* ---------- отправка формы ---------- */
  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = login.trim();
    const re = /^[A-Za-z\u0400-\u04FF]{3,32}$/;
    if (!re.test(trimmed)) {
      setError(
        "Неверное имя: 3–32 символа, только буквы латиницы или кириллицы."
      );
      return;
    }
    setLoading(true);
    await signIn("credentials", { username: trimmed, redirect: false });
    setLoading(false);
  }

  /* ---------- рендер ---------- */
  return (
    <AnimatePresence>
      {show && (
        <Dialog open={show} onOpenChange={setShow}>
          <DialogPortal>
            {/* размытие вместо затемнения */}
            <DialogOverlay className="fixed inset-0 bg-background/30 backdrop-blur-sm" />
            <DialogContent>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-sm overflow-hidden rounded-xl bg-card text-card-foreground shadow-lg"
              >
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle className="text-center text-xl font-semibold">
                    Войти без пароля
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