import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AchievementBanner = ({ userId }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const token = localStorage.getItem('token');
        const url = userId ? `http://localhost:5000/api/achievements/${userId}` : 'http://localhost:5000/api/achievements/user/me';
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAchievements(response.data);
      } catch (err) {
        setError('Failed to load achievements');
        console.error('Error fetching achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [refreshKey, userId]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
        <div className="animate-pulse flex items-center justify-center h-16">
          <div className="text-gray-400 text-sm sm:text-base">Loading achievements...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
         <h2 className="text-lg sm:text-xl font-bold">{userId ? 'Достижения пользователя' : 'Мои достижения'}</h2>
         <button
           onClick={handleRefresh}
           disabled={loading}
           className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors disabled:opacity-50 touch-manipulation"
         >
           {loading ? 'Загрузка...' : 'Обновить'}
         </button>
       </div>
      {achievements.length === 0 ? (
         <div className="text-center text-gray-300 text-sm sm:text-base">
           Пока нет достижений.
         </div>
       ) : (
        <div className="space-y-6">
          {/* Achievements (Main) */}
          {achievements.slice(0, Math.ceil(achievements.length / 2)).length > 0 && (
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
                {achievements.slice(0, Math.ceil(achievements.length / 2)).map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105 touch-manipulation"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <img
                        src={`http://localhost:5000/uploads/achievements/${achievement.image}`}
                        alt={achievement.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-contain rounded-lg"
                        loading="lazy"
                      />
                      <div className="text-center">
                        <h3 className="font-semibold text-xs sm:text-sm truncate" title={achievement.name}>{achievement.name}</h3>
                        <p className="text-xs text-gray-300 mt-1 hidden sm:block line-clamp-2">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges (Mini) */}
          {achievements.slice(Math.ceil(achievements.length / 2)).length > 0 && (
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
                {achievements.slice(Math.ceil(achievements.length / 2)).map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105 touch-manipulation"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <img
                        src={`http://localhost:5000/uploads/achievements/${achievement.image}`}
                        alt={achievement.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain rounded-lg"
                        loading="lazy"
                      />
                      <div className="text-center">
                        <h3 className="font-semibold text-xs sm:text-sm truncate" title={achievement.name}>{achievement.name}</h3>
                        <p className="text-xs text-gray-300 mt-1 hidden sm:block line-clamp-2">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
       )}
    </div>
  );
};

export default AchievementBanner;