import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ChatProvider, useChat } from './ChatContext';
import Auth from './components/Auth';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import UserProfileView from './components/UserProfileView';
import Notification from './components/Notification';
import AdminPanel from './components/AdminPanel';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

// Axios interceptor for handling token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token expired or unauthorized, logging out...');
      // Clear local storage and redirect to login
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload(); // This will trigger the auth state change
    }
    return Promise.reject(error);
  }
);

function ChatAppContent({ onNotification }) {
  const { profile, showFriendProfile, setShowFriendProfile, refreshFriends, refreshChats, startChatWithUser } = useChat();
  const { isAdmin, isModerator } = useAuth();

  return (
    <>
      <div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex"
        style={{
          backgroundColor: profile?.profile?.backgroundColor || undefined
        }}
      >
        <div className="w-96 bg-black/20 backdrop-blur-sm border-r border-white/10">
          <ChatList />
          {(isAdmin || isModerator) && (
            <div className="p-4">
              <Link to="/adminpanel" className="text-white bg-purple-600 px-4 py-2 rounded">Admin Panel</Link>
            </div>
          )}
        </div>
        <div className="flex-1 bg-black/10 backdrop-blur-sm">
          {showFriendProfile ? (
            <UserProfileView
              friendId={showFriendProfile}
              onClose={() => {
                setShowFriendProfile(null);
                refreshFriends();
                refreshChats();
              }}
              onStartChat={startChatWithUser}
              onRemoveFriend={() => {}}
            />
          ) : (
            <ChatWindow />
          )}
        </div>
      </div>

    </>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Загрузка...</p>
          </div>
        </div>
      );
    }

  return user ? (
    <NotificationProvider addNotification={addNotification}>
      <ChatProvider onNotification={addNotification}>
        <ChatAppContent onNotification={addNotification} />
        {/* Global Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      </ChatProvider>
    </NotificationProvider>
  ) : <Auth />;
}

function RouteSaver() {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('currentPath', location.pathname);
  }, [location]);

  return null;
}

function NotificationProvider({ children, addNotification }) {
  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

function App() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteSaver />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
          <NotificationProvider addNotification={addNotification}>
            <Routes>
              <Route path="/" element={<AppContent />} />
              <Route path="/adminpanel" element={<AdminPanel />} />
            </Routes>
            {/* Global Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {notifications.map(notification => (
                <Notification
                  key={notification.id}
                  message={notification.message}
                  type={notification.type}
                  onClose={() => removeNotification(notification.id)}
                />
              ))}
            </div>
          </NotificationProvider>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
