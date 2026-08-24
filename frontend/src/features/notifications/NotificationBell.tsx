import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../auth/auth.store';
import {
  acceptInvitation,
  declineInvitation,
  getNotifications,
  type AppNotification,
} from './notifications.api';

export const NotificationBell: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(token!),
    enabled: Boolean(token),
  });

  const acceptMutation = useMutation({
    mutationFn: (notificationId: string) => acceptInvitation(token!, notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (notificationId: string) => declineInvitation(token!, notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Socket listener for real-time notifications
  useEffect(() => {
    if (!token) return;
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    const socket: Socket = io(apiUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socket.on('connect_error', () => {
      // Suppress socket error logs
    });

    socket.on('notification:new', () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('notification:updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);

  const notifications = notificationsQuery.data ?? [];
  const pendingNotifications = notifications.filter((n) => n.status === 'pending');
  const unreadCount = pendingNotifications.length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-xl border border-white/10 bg-devflow-surface p-2 text-devflow-muted transition hover:border-devflow-accent hover:text-white"
        title="Notifications"
      >
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-devflow-surface/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-sm text-devflow-text">Notifications</h3>
            <span className="font-mono text-xs text-devflow-muted">
              {unreadCount} pending
            </span>
          </div>

          <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {notifications.length === 0 && (
              <p className="py-6 text-center text-xs text-devflow-muted/60">
                No notifications yet.
              </p>
            )}

            {notifications.map((n: AppNotification) => (
              <div
                key={n.id}
                className="rounded-xl border border-white/10 bg-devflow-background/80 p-3.5 shadow-sm transition hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-devflow-accent">
                    {n.title}
                  </span>
                  <span className="font-mono text-[10px] text-devflow-muted/60">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-relaxed text-devflow-text">
                  {n.message}
                </p>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-2.5">
                  {n.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => declineMutation.mutate(n.id)}
                        disabled={declineMutation.isPending || acceptMutation.isPending}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => acceptMutation.mutate(n.id)}
                        disabled={acceptMutation.isPending || declineMutation.isPending}
                        className="rounded-lg bg-devflow-success/20 border border-devflow-success/40 px-3 py-1 text-xs font-semibold text-devflow-success transition hover:bg-devflow-success/30 disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </>
                  ) : (
                    <span
                      className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${
                        n.status === 'accepted' ? 'text-devflow-success' : 'text-red-400/70'
                      }`}
                    >
                      {n.status === 'accepted' ? '✓ Accepted' : '✕ Declined'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
