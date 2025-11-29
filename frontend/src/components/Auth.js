import React, { useState } from 'react';
import { FaTelegramPlane } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import Notification from './Notification';

const Auth = () => {
  const { register, verifyEmail, login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: ''
  });
  const [step, setStep] = useState('login'); // 'login', 'register', 'verify'
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData.username, formData.email, formData.password);
      setStep('verify');
      setNotification({ message: 'Регистрация успешна! Проверьте email для кода подтверждения.', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Ошибка регистрации: ' + (error.response?.data?.error || error.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyEmail(formData.email, formData.otp);
      setNotification({ message: 'Email подтвержден! Вход выполнен успешно!', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Ошибка подтверждения: ' + (error.response?.data?.error || error.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.username, formData.password);
      setNotification({ message: 'Вход выполнен успешно!', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Ошибка входа: ' + (error.response?.data?.error || error.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <FaTelegramPlane className="text-3xl text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">ChatApp</h1>
          </div>
          <p className="text-gray-300">
            {step === 'login' && 'Войдите в свой аккаунт'}
            {step === 'register' && 'Создайте новый аккаунт'}
            {step === 'verify' && 'Подтвердите email'}
          </p>
        </div>

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Имя пользователя
              </label>
              <input
                type="text"
                name="username"
                placeholder="username"
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                name="password"
                placeholder="пароль"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
            <button
              type="button"
              onClick={() => setStep('register')}
              className="w-full py-2 text-gray-300 hover:text-white transition-colors"
            >
              Создать аккаунт
            </button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Имя пользователя
              </label>
              <input
                type="text"
                name="username"
                placeholder="имя пользователя"
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="пример@email.com"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                name="password"
                placeholder="пароль"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full py-2 text-gray-300 hover:text-white transition-colors"
            >
              Уже есть аккаунт?
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyEmail} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Код подтверждения
              </label>
              <input
                type="text"
                name="otp"
                placeholder="Введите код из email"
                value={formData.otp}
                onChange={handleInputChange}
                autoComplete="one-time-code"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Подтверждение...' : 'Подтвердить'}
            </button>
            <button
              type="button"
              onClick={() => setStep('register')}
              className="w-full py-2 text-gray-300 hover:text-white transition-colors"
            >
              Вернуться к регистрации
            </button>
          </form>
        )}
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Auth;