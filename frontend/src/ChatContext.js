import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Function to play achievement unlock sound
const playAchievementSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('Sound not supported');
  }
};

export const ChatProvider = ({ children, onNotification }) => {
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showFriendProfile, setShowFriendProfile] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const refreshChats = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await axios.get('http://localhost:5000/api/chats/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data);
    } catch (error) {
      console.error('Error refreshing chats:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Загрузка чатов
      const loadChats = async () => {
        try {
          const token = await getToken();
          const response = await axios.get('http://localhost:5000/api/chats/my', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setChats(response.data);
        } catch (error) {
          console.error('Error loading chats:', error);
        }
      };
      loadChats();

      // Загрузка друзей
      const loadFriends = async () => {
        try {
          const token = await getToken();
          const response = await axios.get('http://localhost:5000/api/friends/list', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFriends(response.data);
        } catch (error) {
          console.error('Error loading friends:', error);
        }
      };
      loadFriends();

      // Загрузка запросов в друзья
      const loadFriendRequests = async () => {
        try {
          const token = await getToken();
          const response = await axios.get('http://localhost:5000/api/friends/requests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFriendRequests(response.data);
        } catch (error) {
          console.error('Error loading friend requests:', error);
        }
      };
      loadFriendRequests();

      // Загрузка профиля и проверка первого входа
      const loadProfile = async () => {
        try {
          const token = await getToken();
          const response = await axios.get('http://localhost:5000/api/friends/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfile(response.data);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      };
      loadProfile();

      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Регистрируем пользователя для получения уведомлений
      newSocket.emit('registerUser', user.id);

      // Handle online status updates
      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(new Set(users));
      });

      newSocket.on('userOnline', (userId) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('userOffline', (userId) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on('avatarUpdated', (data) => {
        // Update friends list with new avatar
        setFriends(prev => prev.map(friend =>
          friend._id === data.userId
            ? { ...friend, avatar: data.avatar }
            : friend
        ));

        // Update current user's profile if it's their avatar
        setProfile(prev => prev && prev._id === data.userId
          ? { ...prev, avatar: data.avatar }
          : prev
        );

        // Update avatar in messages
        setMessages(prev => prev.map(message =>
          message.sender && message.sender._id === data.userId
            ? { ...message, sender: { ...message.sender, avatar: data.avatar } }
            : message
        ));
      });

      newSocket.on('receiveMessage', (data) => {
        // Avoid duplicating own messages
        setMessages((prev) => {
          const isDuplicate = prev.some(msg => msg._id === data._id);
          if (isDuplicate) return prev;
          // Add new message to the beginning (since backend sorts newest first)
          return [data, ...prev];
        });
        // Update chat list to show latest message
        refreshChats();
      });

      newSocket.on('userTyping', (data) => {
        setTypingUsers((prev) => ({
          ...prev,
          [data.chatId]: { ...data.user, timestamp: Date.now() }
        }));
      });

      newSocket.on('userStopTyping', (data) => {
        setTypingUsers((prev) => {
          const newTyping = { ...prev };
          delete newTyping[data.chatId];
          return newTyping;
        });
      });

      // Слушаем уведомления о получении запроса в друзья
      newSocket.on('friendRequest', (data) => {
        console.log('Friend request received:', data);
        // Обновляем список запросов
        loadFriendRequests();
        // Показываем уведомление пользователю
        if (onNotification) {
          onNotification({
            message: `${data.fromUser.name} хочет добавить вас в друзья`,
            type: 'info'
          });
        }
      });

      // Слушаем уведомления об отправке запроса в друзья
      newSocket.on('friendRequestSent', (data) => {
        console.log('Friend request sent:', data);
        // Можно обновить UI, если нужно показать отправленные запросы
      });

      // Слушаем уведомления о принятии запроса в друзья
      newSocket.on('friendRequestAccepted', (data) => {
        console.log('Friend request accepted:', data);
        // Обновляем друзей и запросы
        loadFriends();
        loadFriendRequests();
        // Создаем чат
        loadChats();
        // Показываем уведомление пользователю
        if (onNotification) {
          onNotification({
            message: `${data.acceptedBy.name} принял ваш запрос в друзья!`,
            type: 'success'
          });
        }
      });

      // Слушаем уведомления об отклонении запроса в друзья
      newSocket.on('friendRequestRejected', (data) => {
        console.log('Friend request rejected:', data);
        // Обновляем запросы
        loadFriendRequests();
        // Показываем уведомление пользователю
        if (onNotification) {
          onNotification({
            message: `${data.rejectedBy.name} отклонил ваш запрос в друзья`,
            type: 'info'
          });
        }
      });

      // Слушаем уведомления о добавлении в друзья
      newSocket.on('friendAdded', (data) => {
        console.log('Friend added:', data);
        // Обновляем друзей
        loadFriends();
        // Создаем чат
        loadChats();
        // Показываем уведомление пользователю
        if (onNotification) {
          onNotification({
            message: `${data.friend.name} добавил вас в друзья!`,
            type: 'success'
          });
        }
      });

      // Слушаем уведомления об удалении из друзей
      newSocket.on('friendRemoved', (data) => {
        console.log('Friend removed:', data);
        // Обновляем друзей
        loadFriends();
        // Показываем уведомление пользователю
        if (onNotification) {
          onNotification({
            message: `${data.friend.name} удалил вас из друзей`,
            type: 'info'
          });
        }
      });

      // Слушаем уведомления о получении достижения
      newSocket.on('achievementUnlocked', (data) => {
        console.log('Achievement unlocked:', data);
        // Показываем уведомление пользователю
        if (onNotification) {
          const achievementType = data.achievement.type === 'badge' ? 'нашивку' : 'достижение';
          onNotification({
            message: `Поздравляем! Вы получили ${achievementType}: ${data.achievement.name}`,
            type: 'success'
          });
        }
        // Воспроизводим звуковой сигнал
        playAchievementSound();
        // Обновляем профиль для отображения нового достижения
        const loadProfile = async () => {
          try {
            const token = await getToken();
            const response = await axios.get('http://localhost:5000/api/friends/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data);
            console.log('Profile reloaded after achievement unlock');
          } catch (error) {
            console.error('Error reloading profile:', error);
          }
        };
        loadProfile();
      });

      // Debug: log all socket events
      newSocket.onAny((event, ...args) => {
        console.log('Socket event received:', event, args);
      });

      return () => newSocket.close();
    }
  }, [user, onNotification, refreshChats]);

  // Periodic check for account existence
  useEffect(() => {
    if (!user) return;

    const checkAccount = async () => {
      try {
        const token = await getToken();
        await axios.get('http://localhost:5000/api/friends/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        if (error.response?.status === 401) {
          // Account deleted
          if (onNotification) {
            onNotification({
              message: 'Ваш аккаунт был удален',
              type: 'error'
            });
          }
          // Logout
          await logout();
        }
      }
    };

    const interval = setInterval(checkAccount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, onNotification, logout]);

  const joinChat = async (chatId) => {
    if (socket && user) {
      socket.emit('joinRoom', chatId);
      setCurrentChat(chatId);
      try {
        const token = await getToken();
        const response = await axios.get(`http://localhost:5000/api/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  };

  const sendMessage = async (messageData) => {
    if (socket && currentChat && user) {
      try {
        const token = await getToken();
        const response = await axios.post(`http://localhost:5000/api/chats/${currentChat}/messages`, messageData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': messageData instanceof FormData ? 'multipart/form-data' : 'application/json'
          }
        });
        const msgData = { room: currentChat, ...response.data };
        socket.emit('sendMessage', msgData);
        // Add message to the beginning of the array (since backend sorts newest first)
        setMessages((prev) => [msgData, ...prev]);
        // Stop typing when message is sent
        socket.emit('stopTyping', { chatId: currentChat });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const startTyping = () => {
    if (socket && currentChat && user) {
      socket.emit('startTyping', { chatId: currentChat, user: { _id: user.id, name: user.name } });
    }
  };

  const stopTyping = () => {
    if (socket && currentChat) {
      socket.emit('stopTyping', { chatId: currentChat });
    }
  };

  const handleLogout = async () => {
    // Clean up socket connection
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    // Clear chat state
    setChats([]);
    setCurrentChat(null);
    setMessages([]);
    setFriends([]);
    setFriendRequests([]);
    setProfile(null);

    // Call auth logout
    if (logout) {
      await logout();
    }
  };

  const refreshFriends = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('http://localhost:5000/api/friends/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Error refreshing friends:', error);
    }
  };

  const refreshFriendRequests = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('http://localhost:5000/api/friends/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error refreshing friend requests:', error);
    }
  };


  const startChatWithUser = async (friendId) => {
    try {
      // Find existing chat
      const existingChat = chats.find(chat =>
        chat.participants.some(p => p._id === friendId)
      );

      if (existingChat) {
        joinChat(existingChat._id);
        return;
      }

      // Create new chat
      const token = await getToken();
      const response = await axios.post('http://localhost:5000/api/chats/create-private', {
        friendId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201 || response.status === 200) {
        const newChat = response.data;
        // Refresh chats to include the new one
        await refreshChats();
        // Join the new chat
        joinChat(newChat._id);
      }
    } catch (error) {
      console.error('Error starting chat with user:', error);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(prev => ({ ...prev, ...updatedProfile }));
  };

  const value = {
    chats,
    currentChat,
    messages,
    friends,
    friendRequests,
    profile,
    showFriendProfile,
    setShowFriendProfile,
    typingUsers,
    onlineUsers,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping,
    refreshFriends,
    refreshFriendRequests,
    refreshChats,
    startChatWithUser,
    handleProfileUpdate,
    logout: handleLogout
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};