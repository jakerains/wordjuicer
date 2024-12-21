import React, { useState } from 'react';
import { Bell, X, Check, AlertCircle, Info } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { Notification } from '../types';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const clearAll = useNotificationStore((state) => state.clearAll);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-[#A2AD1E]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#F96C57]" />;
      case 'info':
        return <Info className="w-5 h-5 text-[#F98128]" />;
    }
  };

  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
    return hours === 0 ? 'Just now' : `${hours}h ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Bell className="w-5 h-5 text-white/70 animate-bell" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#F96C57] rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="fixed right-4 top-20 w-80 bg-gray-900/75 backdrop-blur-md rounded-[20px] border border-gray-700/30 shadow-xl z-50">
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-700/30 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-white/70">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-700/30 hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full" style={{
                      backgroundColor: notification.type === 'success' ? 'rgba(162, 173, 30, 0.2)' :
                        notification.type === 'error' ? 'rgba(249, 108, 87, 0.2)' :
                        'rgba(249, 129, 40, 0.2)'
                    }}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{notification.message}</p>
                      <p className="text-sm text-gray-400">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1 rounded-full hover:bg-gray-700/30 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700/30">
              <button
                onClick={clearAll}
                className="w-full px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg text-white text-sm transition-colors font-medium"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}