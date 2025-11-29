import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaComment, FaUserMinus, FaTrophy } from 'react-icons/fa';
import { useNotification } from '../App';
import AchievementBanner from './AchievementBanner';

const UserProfileView = ({ friendId, onClose, onStartChat, onRemoveFriend }) => {
  const { addNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/friends/profile/${friendId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile data:', response.data);
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching friend profile:', error);
        addNotification('Ошибка загрузки профиля', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (friendId) {
      fetchProfile();
    }
  }, [friendId, addNotification, onClose]);

  const removeFriend = async () => {
    setRemoving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/friends/remove/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Друг удален', 'info');
      if (onRemoveFriend) onRemoveFriend();
      onClose();
      // Refresh friends list - this should be handled by parent
    } catch (error) {
      console.error('Error removing friend:', error);
      addNotification('Ошибка удаления друга', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const startChat = () => {
    onStartChat(friendId);
    onClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Профиль пользователя</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
           <div className="text-center">
             <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 overflow-hidden">
               {profile.avatar ? (
                 <img
                   src={`http://localhost:5000${profile.avatar}`}
                   alt="Avatar"
                   className="w-full h-full object-cover"
                 />
               ) : (
                 profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
               )}
             </div>
             <h3 className="text-xl font-bold text-white">{profile.name || 'Без имени'}</h3>
             <p className="text-gray-400">{profile.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
           </div>

           {profile.stats && (
             <div className="bg-white/5 rounded-lg p-4">
               <h4 className="text-lg font-semibold text-white mb-3">Статистика активности</h4>
               <div className="grid grid-cols-3 gap-4 text-center">
                 <div>
                   <p className="text-2xl font-bold text-blue-400">{profile.stats.messageCount || 0}</p>
                   <p className="text-sm text-gray-400">Сообщений</p>
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-green-400">{profile.stats.friendCount || 0}</p>
                   <p className="text-sm text-gray-400">Друзей</p>
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-purple-400">{profile.stats.achievementCount || 0}</p>
                   <p className="text-sm text-gray-400">Достижений</p>
                 </div>
               </div>
             </div>
           )}

          <div className="flex justify-center">
            <button
              onClick={() => setShowAchievements(true)}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg"
            >
              <FaTrophy className="mr-2" />
              Посмотреть достижения
            </button>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={startChat}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FaComment className="mr-2" />
              Написать
            </button>
            <button
              onClick={removeFriend}
              disabled={removing}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {removing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
              ) : (
                <FaUserMinus className="mr-2" />
              )}
              Удалить из друзей
            </button>
          </div>
        </div>
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-semibold">Достижения пользователя</h3>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Закрыть"
              >
                <FaTimes />
              </button>
            </div>
            <AchievementBanner userId={friendId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileView;