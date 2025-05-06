'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';

export default function LoginModal() {
  const show    = useUIStore((s) => s.showLoginModal);
  const setShow = useUIStore((s) => s.setLoginModal);
  const [login, setLogin] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!login.trim()) return;
    await signIn('credentials', { username: login, redirect: false });
    setShow(false);              // закрыть модалку после успешного входа
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Войти без пароля</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Введите логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />

          <DialogFooter>
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
