import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../ChatContext';
import { useAuth } from '../AuthContext';
import { FaSmile, FaPaperclip } from 'react-icons/fa';

const ChatWindow = () => {
  const { currentChat, messages, sendMessage, startTyping, stopTyping, typingUsers, setShowFriendProfile } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (input.trim() || attachedFiles.length > 0) {
      const formData = new FormData();
      formData.append('text', input);

      attachedFiles.forEach((file, index) => {
        formData.append('files', file);
      });

      await sendMessage(formData);
      setInput('');
      setAttachedFiles([]);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Start typing indicator
    if (currentChat) {
      startTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
      // Stop typing when sending message
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        stopTyping();
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length + attachedFiles.length > 5) {
      alert('Можно прикрепить максимум 5 изображений');
      return;
    }
    setAttachedFiles(prev => [...prev, ...imageFiles.slice(0, 5 - prev.length)]);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (!currentChat) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Выберите чат</h2>
          <p>Начните общение, выбрав чат из списка</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-h-screen">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Чат</h2>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          maxHeight: '90vh', // 90% of viewport height
        }}
        onWheel={(e) => {
          // Prevent page scroll when scrolling chat
          const target = e.currentTarget;
          const isAtTop = target.scrollTop === 0;
          const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight;

          if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
            e.stopPropagation();
          }
        }}
      >
        {typingUsers[currentChat] && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white px-4 py-2 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-400">
                  {typingUsers[currentChat].name} печатает...
                </span>
              </div>
            </div>
          </div>
        )}
        {messages.slice().reverse().map((msg, index) => {
          const isOwnMessage = msg.sender._id === user?.id || msg.sender === user?.id;
          return (
            <div
              key={msg._id || index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-center space-x-2 mb-1 px-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isOwnMessage && (
                    <>
                      {msg.sender.avatar ? (
                        <img
                          src={`http://localhost:5000${msg.sender.avatar}`}
                          alt={msg.sender.name}
                          className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80"
                          onClick={() => setShowFriendProfile(msg.sender._id)}
                        />
                      ) : (
                        <div
                          className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80"
                          onClick={() => setShowFriendProfile(msg.sender._id)}
                        >
                          {(msg.sender.name || 'Н').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className="text-sm font-medium text-blue-300 cursor-pointer hover:underline"
                        onClick={() => setShowFriendProfile(msg.sender._id)}
                      >
                        {msg.sender.name || 'Неизвестный пользователь'}
                      </span>
                    </>
                  )}
                  {isOwnMessage && (
                    <>
                      <span className="text-sm font-medium text-purple-300">
                        Вы
                      </span>
                      {msg.sender.avatar ? (
                        <img
                          src={`http://localhost:5000${msg.sender.avatar}`}
                          alt="Ваш аватар"
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(msg.sender.name || 'В').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {msg.files && msg.files.length > 0 && (
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      {msg.files.map((file, fileIndex) => (
                        <img
                          key={fileIndex}
                          src={`http://localhost:5000${file}`}
                          alt={`Attachment ${fileIndex + 1}`}
                          className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80"
                          onClick={() => window.open(`http://localhost:5000${file}`, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                  {msg.text && <div>{msg.text}</div>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10">
        {attachedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Attachment ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-white/20"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Напишите сообщение..."
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaSmile />
              </button>
              <label className="cursor-pointer text-gray-400 hover:text-white transition-colors">
                <FaPaperclip />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Отправить
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 bg-gray-800 border border-white/20 rounded-lg p-4 shadow-lg">
            <div className="grid grid-cols-6 gap-2">
              {['😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😢', '😭', '😤', '👍', '👎', '❤️', '🔥', '🎉', '✨'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-2xl hover:bg-white/10 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;