import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../../auth/auth.store';

export interface SocketUser {
  id: string;
  name: string;
  email: string;
}

export interface ChatAttachment {
  url: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  fileSize: number;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  channelId?: string;
  text: string;
  attachments?: ChatAttachment[];
  user: SocketUser;
  createdAt: string;
}

export function useKanbanSocket(projectId: string) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const [presence, setPresence] = useState<SocketUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');

  useEffect(() => {
    if (!token || !projectId) return;

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

    // Seed chat state with persistent history from MongoDB for active channel
    fetch(`${apiUrl}/api/projects/${projectId}/messages?channelId=${activeChannel}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ChatMessage[]) => setMessages(data))
      .catch(() => setMessages([]));

    const socket: Socket = io(apiUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = socket;

    socket.on('connect_error', () => {
      // Suppress unhandled socket connection errors
    });

    socket.on('connect', () => {
      socket.emit('join_project', { projectId });
    });

    socket.on('presence:update', (users: SocketUser[]) => {
      setPresence(users);
    });

    // Revalidate board cache on any task event
    const handleTaskChange = () => {
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    };

    const handleGithubActivity = () => {
      void queryClient.invalidateQueries({ queryKey: ['github', 'project-activities', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['github', 'activities'] });
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    };

    socket.on('task:created', handleTaskChange);
    socket.on('task:moved', handleTaskChange);
    socket.on('task:updated', handleTaskChange);
    socket.on('task:deleted', handleTaskChange);
    socket.on('github:activity', handleGithubActivity);

    socket.on('chat:message', (msg: ChatMessage) => {
      // Add message if it matches active channel or has no channel specified (legacy)
      if (!msg.channelId || msg.channelId === activeChannel) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('chat:typing', ({ user, isTyping }: { user: { id: string; name: string }; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(user.name) ? prev : [...prev, user.name];
        } else {
          return prev.filter((name) => name !== user.name);
        }
      });
    });

    return () => {
      socket.emit('leave_project', { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, projectId, activeChannel, queryClient]);

  function sendMessage(text: string, attachments: ChatAttachment[] = [], channelId = activeChannel) {
    if (socketRef.current && (text.trim() || attachments.length > 0)) {
      socketRef.current.emit('chat:send', {
        projectId,
        channelId,
        text,
        attachments,
      });
    }
  }

  function setTyping(isTyping: boolean) {
    if (socketRef.current) {
      socketRef.current.emit('chat:typing', { projectId, isTyping });
    }
  }

  return {
    presence,
    messages,
    typingUsers,
    activeChannel,
    setActiveChannel,
    sendMessage,
    setTyping,
  };
}

