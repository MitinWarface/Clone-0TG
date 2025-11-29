import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaEdit, FaSave, FaTimes, FaUser, FaTrophy } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import AchievementBanner from './AchievementBanner';

const UserProfile = ({ onClose, userId }) => {
  const { user: currentUser, role } = useAuth();
  const isOwnProfile = !userId || userId === currentUser?._id;
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(() => localStorage.getItem('profileEditing') === 'true');

  useEffect(() => {
    localStorage.setItem('profileEditing', isEditing);
  }, [isEditing]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    profile: {
      backgroundColor: '#1a1a1a',
      banner: '',
      status: 'Доступен'
    }
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'moderator': return 'Модератор';
      default: return 'Пользователь';
    }
  };


  const fetchProfile = useCallback(async () => {
    try {
      const url = userId ? `http://localhost:5000/api/friends/profile/${userId}` : 'http://localhost:5000/api/friends/profile';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(response.data);
      setEditData({
        name: response.data.name || '',
        profile: {
          backgroundColor: response.data.profile?.backgroundColor || '#1a1a1a',
          banner: response.data.profile?.banner || '',
          status: response.data.profile?.status || 'Доступен'
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put('http://localhost:5000/api/friends/profile', editData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post('http://localhost:5000/api/friends/avatar', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
      setSelectedAvatar(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };


  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Profile Header with Banner */}
      <div
        className="relative h-40 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mb-6 overflow-hidden"
        style={{
          backgroundImage: profile?.profile?.banner ? `url(${profile.profile.banner})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>


        <div className="absolute bottom-4 left-4 flex items-center space-x-4">
           <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
             {profile?.avatar ? (
               <img
                 src={`http://localhost:5000${profile.avatar}`}
                 alt="Avatar"
                 className="w-full h-full object-cover"
               />
             ) : (
               profile?.name ? profile.name.charAt(0).toUpperCase() : <FaUser />
             )}
           </div>
           <div>
             <h2 className="text-white text-xl font-bold">{profile?.name || 'Без имени'}</h2>
             <p className="text-gray-300">{profile?.profile?.status || 'Доступен'}</p>
           </div>
         </div>
        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
            aria-label="Редактировать профиль"
          >
            <FaEdit />
          </button>
        )}
      </div>


      {/* Profile Content */}
      <div className="flex-1 space-y-6">
        {/* Basic Info */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white text-base sm:text-lg font-semibold mb-4">Основная информация</h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs sm:text-sm">Имя</label>
              <p className="text-white text-sm sm:text-base">{profile?.name || 'Не указано'}</p>
            </div>
            <div>
              <label className="text-gray-400 text-xs sm:text-sm">Статус</label>
              <p className="text-white text-sm sm:text-base">{profile?.profile?.status || 'Доступен'}</p>
            </div>
            <div>
              <label className="text-gray-400 text-xs sm:text-sm">Роль</label>
              <p className="text-white text-sm sm:text-base">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  role === 'admin' ? 'bg-red-500 text-white' :
                  role === 'moderator' ? 'bg-blue-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {getRoleDisplay(role)}
                </span>
              </p>
            </div>
    
            {/* Admin Panel Button */}
            {isOwnProfile && (role === 'admin' || role === 'moderator') && (
              <div className="p-4">
                <button
                  onClick={() => window.location.href = '/adminpanel'}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg"
                >
                  Панель администратора
                </button>
              </div>
            )}

            {/* View Achievements Button for Other Users */}
            {!isOwnProfile && (
              <div className="p-4">
                <button
                  onClick={() => setShowAchievements(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                >
                  <FaTrophy />
                  <span>Посмотреть достижения</span>
                </button>
              </div>
            )}
    
            {/* Achievements (Main) */}
            {isOwnProfile && profile?.achievements && profile.achievements.filter(a => a.type === 'achievement').length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white text-base sm:text-lg font-semibold mb-4">Нашивки</h3>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 max-h-96 overflow-y-auto"
                  style={{
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none' // IE/Edge
                  }}
                >
                  <style>{`
                    div::-webkit-scrollbar {
                      display: none; // Chrome/Safari
                    }
                  `}</style>
                  {profile.achievements.filter(a => a.type === 'achievement').map((ach, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105 touch-manipulation"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <img
                          src={`http://localhost:5000/uploads/achievements/${ach.image}`}
                          alt={ach.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-contain rounded-lg"
                        />
                        <div className="text-center">
                          <h3 className="font-semibold text-xs sm:text-sm truncate" title={ach.name}>{ach.name}</h3>
                          <p className="text-xs text-gray-300 mt-1 hidden sm:block line-clamp-2">{ach.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges (Mini) */}
            {isOwnProfile && profile?.achievements && profile.achievements.filter(a => a.type === 'badge').length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white text-base sm:text-lg font-semibold mb-4">Мини-достижения</h3>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 max-h-96 overflow-y-auto"
                  style={{
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none' // IE/Edge
                  }}
                >
                  <style>{`
                    div::-webkit-scrollbar {
                      display: none; // Chrome/Safari
                    }
                  `}</style>
                  {profile.achievements.filter(a => a.type === 'badge').map((ach, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105 touch-manipulation"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <img
                          src={`http://localhost:5000/uploads/achievements/${ach.image}`}
                          alt={ach.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain rounded-lg"
                        />
                        <div className="text-center">
                          <h3 className="font-semibold text-xs sm:text-sm truncate" title={ach.name}>{ach.name}</h3>
                          <p className="text-xs text-gray-300 mt-1 hidden sm:block line-clamp-2">{ach.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
    
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
            <AchievementBanner userId={userId} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && isOwnProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-semibold">Редактировать профиль</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Закрыть"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Имя</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Аватар</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {profile?.avatar ? (
                      <img
                        src={`http://localhost:5000${profile.avatar}`}
                        alt="Current avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile?.name ? profile.name.charAt(0).toUpperCase() : <FaUser />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                    {uploadingAvatar && (
                      <p className="text-sm text-gray-400 mt-1">Загрузка...</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Статус</label>
                <select
                  id="status"
                  name="status"
                  value={editData.profile.status}
                  onChange={(e) => setEditData({
                    ...editData,
                    profile: { ...editData.profile, status: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Доступен" className="bg-gray-700 text-white">Доступен</option>
                  <option value="Занят" className="bg-gray-700 text-white">Занят</option>
                  <option value="Не беспокоить" className="bg-gray-700 text-white">Не беспокоить</option>
                  <option value="Оффлайн" className="bg-gray-700 text-white">Оффлайн</option>
                </select>
              </div>

            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                ) : (
                  <FaSave className="mr-2" />
                )}
                Сохранить
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;