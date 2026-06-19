'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { socketService } from '@/services/socket';

export interface Notification {
  id: string;
  title: string;
  body: string;
  link?: string;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('veda_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    }
  }, []);

  // Save to localStorage when changed
  const saveNotifications = (newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem('veda_notifications', JSON.stringify(newNotifications));
    // Dispatch event to notify other components (e.g. headers)
    window.dispatchEvent(new Event('veda_notifications_changed'));
  };

  // Connect to WS and subscribe when user is logged in
  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    socketService.connect(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000");
    socketService.emit('subscribe', { userId: user._id });

    // Listen to job progress done
    const unsubDone = socketService.on('job:done', (data: any) => {
      const newNotif: Notification = {
        id: Math.random().toString(36).substring(2),
        title: 'Assignment Generated',
        body: `Your assignment "${data.title || 'Untitled'}" is ready!`,
        link: `/output/${data.assignmentId}`,
        timestamp: Date.now(),
        read: false,
      };
      
      // Load current latest notifications, append and save
      const current = JSON.parse(localStorage.getItem('veda_notifications') || '[]');
      saveNotifications([newNotif, ...current]);
    });

    const unsubFailed = socketService.on('job:failed', (data: any) => {
      const newNotif: Notification = {
        id: Math.random().toString(36).substring(2),
        title: 'Generation Failed',
        body: `Failed to generate assignment "${data.title || 'Untitled'}".`,
        timestamp: Date.now(),
        read: false,
      };

      const current = JSON.parse(localStorage.getItem('veda_notifications') || '[]');
      saveNotifications([newNotif, ...current]);
    });

    return () => {
      unsubDone();
      unsubFailed();
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
