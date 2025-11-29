import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../App';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [manageEmail, setManageEmail] = useState('');
  const [manageRole, setManageRole] = useState('user');
  const [managing, setManaging] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [messageId, setMessageId] = useState('');
  const [blockUserId, setBlockUserId] = useState('');
  const [blockAction, setBlockAction] = useState(false);
  // Notifications moved to global
  const [userAchievements, setUserAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    type: 'achievement',
    image: null
  });
  const [creating, setCreating] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [editAchievement, setEditAchievement] = useState({
    name: '',
    description: '',
    type: 'achievement',
    image: null
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { addNotification } = useNotification();

  const fetchUserAchievements = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/achievements/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserAchievements(response.data);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, achievementsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/achievements', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      const allAchievements = achievementsRes.data;
      setAchievements(allAchievements.filter(a => a.type === 'achievement'));
      setBadges(allAchievements.filter(a => a.type === 'badge'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserAchievements(selectedUser._id);
    } else {
      setUserAchievements([]);
    }
  }, [selectedUser, fetchUserAchievements]);

  const assignAchievement = async (achievementName) => {
    if (!selectedUser) return;
    setAssigning(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/achievements/assign', {
        userId: selectedUser._id,
        achievementName
      }, { headers: { Authorization: `Bearer ${token}` } });
      addNotification('Достижение выдано успешно');
      // Refresh user achievements
      fetchUserAchievements(selectedUser._id);
    } catch (error) {
      console.error('Error assigning achievement:', error);
      addNotification('Ошибка выдачи достижения', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const revokeAchievement = async (achievementName) => {
    if (!selectedUser) return;
    setAssigning(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/achievements/revoke', {
        userId: selectedUser._id,
        achievementName
      }, { headers: { Authorization: `Bearer ${token}` } });
      addNotification('Достижение отозвано успешно');
      // Refresh user achievements
      fetchUserAchievements(selectedUser._id);
    } catch (error) {
      console.error('Error revoking achievement:', error);
      addNotification('Ошибка отзыва достижения', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const createAchievement = async () => {
    if (!newAchievement.name || !newAchievement.description || !newAchievement.image) return;
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', newAchievement.name);
      formData.append('description', newAchievement.description);
      formData.append('type', newAchievement.type);
      formData.append('image', newAchievement.image);

      await axios.post('http://localhost:5000/api/achievements/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Достижение создано успешно');
      setNewAchievement({
        name: '',
        description: '',
        type: 'achievement',
        image: null
      });
      // Refresh achievements list
      fetchData();
    } catch (error) {
      console.error('Error creating achievement:', error);
      addNotification('Ошибка создания достижения', 'error');
    } finally {
      setCreating(false);
    }
  };

  const updateAchievement = async () => {
    if (!editingAchievement || !editAchievement.name || !editAchievement.description) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', editAchievement.name);
      formData.append('description', editAchievement.description);
      formData.append('type', editAchievement.type);
      if (editAchievement.image) {
        formData.append('image', editAchievement.image);
      }

      await axios.put(`http://localhost:5000/api/achievements/update/${editingAchievement._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Достижение обновлено успешно');
      setEditingAchievement(null);
      setEditAchievement({
        name: '',
        description: '',
        type: 'achievement',
        image: null
      });
      // Refresh achievements list
      fetchData();
    } catch (error) {
      console.error('Error updating achievement:', error);
      addNotification('Ошибка обновления достижения', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const deleteAchievement = async (achievementId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Вы уверены, что хотите удалить это достижение?')) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/achievements/${achievementId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Достижение удалено успешно');
      // Refresh achievements list
      fetchData();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      addNotification('Ошибка удаления достижения', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const startEditing = (achievement) => {
    setEditingAchievement(achievement);
    setEditAchievement({
      name: achievement.name,
      description: achievement.description,
      type: achievement.type,
      image: null
    });
  };

  const handleManageRole = async () => {
    if (!manageEmail.trim()) return;
    setManaging(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/admin/manage-role', {
        email: manageEmail.trim(),
        role: manageRole
      }, { headers: { Authorization: `Bearer ${token}` } });
      addNotification(`Роль обновлена на ${manageRole} успешно`);
      setManageEmail('');
    } catch (error) {
      console.error('Error managing role:', error);
      addNotification('Ошибка управления ролью', 'error');
    } finally {
      setManaging(false);
    }
  };

  const deleteMessage = async () => {
    if (!messageId.trim()) return;
    setModerating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/moderation/messages/${messageId.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Сообщение удалено успешно');
      setMessageId('');
    } catch (error) {
      console.error('Error deleting message:', error);
      addNotification('Ошибка удаления сообщения', 'error');
    } finally {
      setModerating(false);
    }
  };

  const toggleBlockUser = async () => {
    if (!blockUserId.trim()) return;
    setModerating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/moderation/block-user', {
        userId: blockUserId.trim(),
        blocked: blockAction
      }, { headers: { Authorization: `Bearer ${token}` } });
      addNotification(`Пользователь ${blockAction ? 'заблокирован' : 'разблокирован'} успешно`);
      setBlockUserId('');
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      addNotification('Ошибка блокировки/разблокировки пользователя', 'error');
    } finally {
      setModerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>

      {/* Create Achievement */}
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Создать достижение</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Название достижения"
            value={newAchievement.name}
            onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <textarea
            placeholder="Описание достижения"
            value={newAchievement.description}
            onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            rows="3"
          />
          <select
            value={newAchievement.type}
            onChange={(e) => setNewAchievement({ ...newAchievement, type: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="achievement">Достижение</option>
            <option value="badge">Мини-достижение (значок)</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewAchievement({ ...newAchievement, image: e.target.files[0] })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <button
            onClick={createAchievement}
            disabled={creating || !newAchievement.name || !newAchievement.description || !newAchievement.image}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
          >
            {creating ? 'Создание...' : 'Создать достижение'}
          </button>
        </div>
      </div>

      {/* Edit Achievement */}
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Редактировать достижение</h2>
        <div className="space-y-4">
          <select
            value={editingAchievement?._id || ''}
            onChange={(e) => {
              const ach = [...achievements, ...badges].find(a => a._id === e.target.value);
              if (ach) startEditing(ach);
            }}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">Выберите достижение для редактирования</option>
            {[...achievements, ...badges].map(ach => (
              <option key={ach._id} value={ach._id}>{ach.name} ({ach.type === 'achievement' ? 'Достижение' : 'Мини-достижение'})</option>
            ))}
          </select>
          {editingAchievement && (
            <>
              <input
                type="text"
                placeholder="Название достижения"
                value={editAchievement.name}
                onChange={(e) => setEditAchievement({ ...editAchievement, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <textarea
                placeholder="Описание достижения"
                value={editAchievement.description}
                onChange={(e) => setEditAchievement({ ...editAchievement, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                rows="3"
              />
              <select
                value={editAchievement.type}
                onChange={(e) => setEditAchievement({ ...editAchievement, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="achievement">Достижение</option>
                <option value="badge">Мини-достижение (значок)</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditAchievement({ ...editAchievement, image: e.target.files[0] })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <div className="flex space-x-3">
                <button
                  onClick={updateAchievement}
                  disabled={updating || !editAchievement.name || !editAchievement.description}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {updating ? 'Обновление...' : 'Обновить достижение'}
                </button>
                <button
                  onClick={() => deleteAchievement(editingAchievement._id)}
                  disabled={deleting}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {deleting ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users List */}
        <div className="bg-white/5 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Пользователи</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map(u => (
              <div
                key={u._id}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedUser?._id === u._id ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                }`}
                onClick={() => setSelectedUser(u)}
              >
                <p className="font-medium">{u.name || 'No name'}</p>
                <p className="text-sm text-gray-300">{u.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white/5 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Выдать нашивки</h2>
          {selectedUser ? (
            <div>
              <p className="mb-4">Выбран: {selectedUser.name || 'Без имени'} ({selectedUser.email})</p>
              <div className="space-y-2">
                {achievements.map(ach => {
                  const hasAchievement = userAchievements.some(ua => ua.name === ach.name);
                  return (
                    <div key={ach.name} className="flex items-center justify-between bg-white/10 p-3 rounded">
                      <div className="flex items-center space-x-3">
                        <img
                          src={`http://localhost:5000/uploads/achievements/${ach.image}`}
                          alt={ach.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{ach.name}</p>
                          <p className="text-sm text-gray-300">{ach.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => hasAchievement ? revokeAchievement(ach.name) : assignAchievement(ach.name)}
                        disabled={assigning}
                        className={`px-2 py-1 text-sm rounded disabled:opacity-50 ${
                          hasAchievement
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {assigning ? (hasAchievement ? 'Отзыв...' : 'Выдача...') : (hasAchievement ? 'Отозвать' : 'Выдать')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p>Выберите пользователя для назначения достижений</p>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white/5 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Выдать мини-достижения</h2>
          {selectedUser ? (
            <div>
              <p className="mb-4">Выбран: {selectedUser.name || 'Без имени'} ({selectedUser.email})</p>
              <div className="space-y-2">
                {badges.map(badge => {
                  const hasBadge = userAchievements.some(ua => ua.name === badge.name);
                  return (
                    <div key={badge.name} className="flex items-center justify-between bg-white/10 p-3 rounded">
                      <div className="flex items-center space-x-3">
                        <img
                          src={`http://localhost:5000/uploads/achievements/${badge.image}`}
                          alt={badge.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{badge.name}</p>
                          <p className="text-sm text-gray-300">{badge.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => hasBadge ? revokeAchievement(badge.name) : assignAchievement(badge.name)}
                        disabled={assigning}
                        className={`px-2 py-1 text-sm rounded disabled:opacity-50 ${
                          hasBadge
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {assigning ? (hasBadge ? 'Отзыв...' : 'Выдача...') : (hasBadge ? 'Отозвать' : 'Выдать')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p>Выберите пользователя для выдачи значков</p>
          )}
        </div>

        {/* Manage User Roles */}
        <div className="bg-white/5 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Управление ролями пользователей</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Введите email пользователя"
              value={manageEmail}
              onChange={(e) => setManageEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <select
              value={manageRole}
              onChange={(e) => setManageRole(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
            <button
              onClick={handleManageRole}
              disabled={managing || !manageEmail.trim()}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {managing ? 'Обновление...' : 'Обновить роль'}
            </button>
          </div>
        </div>

        {/* Moderation */}
         <div className="bg-white/5 rounded-lg p-4">
           <h2 className="text-xl font-semibold mb-4">Модерация</h2>
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-2">Удалить сообщение</label>
               <input
                 type="text"
                 placeholder="Введите ID сообщения"
                 value={messageId}
                 onChange={(e) => setMessageId(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
               />
               <button
                 onClick={deleteMessage}
                 disabled={moderating || !messageId.trim()}
                 className="w-full mt-2 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
               >
                 {moderating ? 'Удаление...' : 'Удалить сообщение'}
               </button>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2">Заблокировать/Разблокировать пользователя</label>
               <input
                 type="text"
                 placeholder="Введите ID пользователя"
                 value={blockUserId}
                 onChange={(e) => setBlockUserId(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
               />
               <select
                 value={blockAction}
                 onChange={(e) => setBlockAction(e.target.value === 'true')}
                 className="w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
               >
                 <option value={false}>Разблокировать</option>
                 <option value={true}>Заблокировать</option>
               </select>
               <button
                 onClick={toggleBlockUser}
                 disabled={moderating || !blockUserId.trim()}
                 className="w-full mt-2 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
               >
                 {moderating ? 'Обработка...' : blockAction ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
               </button>
             </div>
           </div>
         </div>
      </div>

      {/* Back to Profile Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Вернуться в профиль
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;