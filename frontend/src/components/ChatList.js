import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaSignOutAlt, FaUsers, FaComments, FaBell, FaUser } from 'react-icons/fa';
import { useChat } from '../ChatContext';
import FriendSearch from './FriendSearch';
import FriendRequests from './FriendRequests';
import UserProfile from './UserProfile';
import Notification from './Notification';

const ChatList = ({ onNotification }) => {
  const { chats, friends, friendRequests, joinChat, currentChat, logout, setShowFriendProfile, refreshFriends, refreshChats, onlineUsers } = useChat();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'chats');
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleFriendClick = (friendId) => {
    setShowFriendProfile(friendId);
  };

  const handleStartChat = async (friendId) => {
    // Find existing chat or create new one
    const existingChat = chats.find(chat =>
      chat.participants.some(p => p._id === friendId)
    );

    if (existingChat) {
      joinChat(existingChat._id);
    } else {
      // Create new chat
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/chats/create-private', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ friendId })
        });
        const chat = await response.json();
        if (response.ok) {
          joinChat(chat._id);
        } else {
          console.error('Error creating chat:', chat);
        }
      } catch (error) {
        console.error('Error creating chat:', error);
      }
    }
  };

  const handleRemoveFriend = () => {
    refreshFriends();
    refreshChats();
  };

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chats'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaComments className="mr-1" />
              Чаты
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaUsers className="mr-1" />
              Друзья
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title="Профиль"
            >
              <FaUser />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFriendRequests(true)}
              className="relative flex items-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Запросы в друзья"
            >
              <FaBell />
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowFriendSearch(true)}
              className="flex items-center p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              title="Найти друзей"
            >
              <FaUserPlus />
            </button>
            <button
              onClick={logout}
              className="flex items-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Выйти"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'chats' ? (
          chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => joinChat(chat._id)}
              className={`p-4 mb-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                currentChat === chat._id
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-l-4 border-purple-500'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {chat.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{chat.name}</p>
                  <p className="text-gray-400 text-sm truncate">Последнее сообщение...</p>
                </div>
              </div>
            </div>
          ))
        ) : activeTab === 'friends' ? (
          friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => handleFriendClick(friend._id)}
              className="p-4 mb-2 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                    {friend.avatar ? (
                      <img
                        src={`http://localhost:5000${friend.avatar}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      friend.name ? friend.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  {onlineUsers.has(friend._id) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {friend.name || 'Без имени'}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    {onlineUsers.has(friend._id) ? 'онлайн' : 'оффлайн'}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <UserProfile />
        )}
      </div>

      {showFriendSearch && (
        <FriendSearch
          onClose={() => setShowFriendSearch(false)}
          onNotification={setNotification}
        />
      )}

      {showFriendRequests && (
        <FriendRequests
          onClose={() => setShowFriendRequests(false)}
        />
      )}


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

export default ChatList;