import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and set user
      axios.get('http://localhost:5000/api/friends/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => {
        setUser({ email: response.data.email, id: response.data._id, role: response.data.role, hasSetName: response.data.hasSetName });
      }).catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-email', {
        email,
        otp
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      });
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Legacy method for backward compatibility
  const loginWithEmail = async (email) => {
    // For test email, simulate confirmation
    if (email === 'test@example.com') {
      return {
        confirm: async (code) => {
          if (code === '123456') {
            const mockUser = { id: 'test-user-123', email: email };
            setUser(mockUser);
            localStorage.setItem('token', 'mock-token');
            return { user: mockUser };
          } else {
            throw new Error('Invalid verification code');
          }
        }
      };
    }
    throw new Error('Email login is no longer supported. Use username/password login.');
  };

  const verifyCode = async (confirmationResult, code) => {
    try {
      const result = await confirmationResult.confirm(code);
      setUser(result.user);
      return result.user;
    } catch (error) {
      console.error('Ошибка проверки кода:', error);
      throw error;
    }
  };

  const setName = async (name) => {
    // Для тестового пользователя симулировать установку имени
    if (localStorage.getItem('token') === 'mock-token') {
      setUser({ ...user, name, hasSetName: true });
      return;
    }
    try {
      const response = await axios.put('http://localhost:5000/api/auth/set-name', { name }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Ошибка установки имени:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      console.log('Пользователь вышел успешно');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      setUser(null);
    }
  };

  const isAdmin = user && user.role === 'admin';
  const isModerator = user && (user.role === 'moderator' || user.role === 'admin');
  const role = user ? user.role : null;

  const value = {
    user,
    register,
    verifyEmail,
    login,
    loginWithEmail, // Legacy
    verifyCode,
    setName,
    logout,
    loading,
    isAdmin,
    isModerator,
    role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};