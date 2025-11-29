import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useNotification } from '../App';

const FriendRequests = ({ onClose }) => {
  const { addNotification } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/friends/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      addNotification('Ошибка загрузки запросов', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const acceptRequest = async (requestId) => {
    setProcessing(requestId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/friends/accept/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRequests(prev => prev.filter(req => req._id !== requestId));
      addNotification('Запрос принят!', 'success');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      addNotification('Ошибка принятия запроса', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const rejectRequest = async (requestId) => {
    setProcessing(requestId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/friends/reject/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRequests(prev => prev.filter(req => req._id !== requestId));
      addNotification('Запрос отклонен', 'info');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      addNotification('Ошибка отклонения запроса', 'error');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Запросы в друзья</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Загрузка...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {request.from.name ? request.from.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {request.from.name || 'Без имени'}
                      </p>
                      <p className="text-gray-400 text-sm">{request.from.name || 'Без имени'}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => acceptRequest(request._id)}
                      disabled={processing === request._id}
                      className="flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      title="Принять"
                    >
                      {processing === request._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                      ) : (
                        <FaCheck />
                      )}
                    </button>
                    <button
                      onClick={() => rejectRequest(request._id)}
                      disabled={processing === request._id}
                      className="flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      title="Отклонить"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Нет новых запросов</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;