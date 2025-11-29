import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaUserPlus } from 'react-icons/fa';

const FriendSearch = ({ onClose, onNotification }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingFriend, setAddingFriend] = useState(null);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      onNotification({ message: 'Ошибка поиска пользователей', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId) => {
    setAddingFriend(friendId);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/friends/request', {
        friendId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onNotification({ message: 'Запрос в друзья отправлен!', type: 'success' });
      onClose();
    } catch (error) {
      console.error('Error sending friend request:', error);
      onNotification({ message: 'Ошибка отправки запроса', type: 'error' });
    } finally {
      setAddingFriend(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Найти друзей</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Введите имя пользователя"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
            />
            <button
              onClick={searchUsers}
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <FaSearch />
            </button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Поиск...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="text-white font-medium">
                          {user.name || 'Без имени'}
                        </p>
                        <p className="text-gray-400 text-sm">{user.profile?.status || 'Доступен'}</p>
                      </div>
                      {user.role && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-500 text-white' :
                          user.role === 'moderator' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {user.role === 'admin' ? 'Админ' :
                           user.role === 'moderator' ? 'Модератор' :
                           'Пользователь'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => sendFriendRequest(user._id)}
                    disabled={addingFriend === user._id}
                    className="flex items-center justify-center w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Отправить запрос в друзья"
                  >
                    {addingFriend === user._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                    ) : (
                      <FaUserPlus />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && !loading && searchQuery && (
            <div className="text-center py-8">
              <p className="text-gray-400">Пользователи не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendSearch;