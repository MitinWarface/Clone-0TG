import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const FirstLoginModal = ({ onClose }) => {
  const { setName } = useAuth();
  const [name, setNameInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Имя не может быть пустым');
      return;
    }

    setLoading(true);
    try {
      await setName(name.trim());
      onClose();
    } catch (error) {
      setError('Ошибка сохранения имени');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Добро пожаловать!</h2>
        <p className="text-gray-300 text-center mb-6">Пожалуйста, введите ваше имя</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstLoginModal;