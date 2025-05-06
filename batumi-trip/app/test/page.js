// файл: app/test/page.jsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TestAuthPage() {
  const { user, isLoading, signIn, signOut } = useAuth();  // кастомный хук для работы сессией :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
  const [login, setLogin] = useState('');
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    if (!login.trim()) {
      setError('Логин не может быть пустым');
      return;
    }
    try {
      await signIn(login);  // вызывает Credentials Provider без пароля
    } catch (err) {
      setError(err.message || 'Ошибка при входе');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Тест аутентификации</h1>

      {isLoading && <p>Проверка сессии...</p>}

      {!isLoading && !user && (
        <form onSubmit={handleSignIn} className="space-y-3">
          <input
            type="text"
            placeholder="Введите логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Войти
          </button>
        </form>
      )}

      {!isLoading && user && (
        <div className="space-y-3">
          <p>Авторизован как: <span className="font-medium">{user.id}</span></p>
          <button
            onClick={() => signOut()}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Выйти
          </button>
          <p className="text-sm text-gray-500">
            После выхода попробуйте перейти на защищённый маршрут, например <code>/locations</code>, – должно произойти перенаправление на логин.
          </p>
        </div>
      )}
    </div>
);
}
