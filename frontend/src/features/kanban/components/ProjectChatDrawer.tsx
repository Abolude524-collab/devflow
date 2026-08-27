import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../auth/auth.store';
import type { ChatAttachment, ChatMessage } from '../hooks/useKanbanSocket';

interface ProjectChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  messages: ChatMessage[];
  typingUsers: string[];
  activeChannel: string;
  onChannelChange: (channelId: string) => void;
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  onTyping: (isTyping: boolean) => void;
}

const CHANNELS = [
  { id: 'general', label: '#general', icon: '💬' },
  { id: 'dev-team', label: '#dev-team', icon: '⚡' },
  { id: 'media-sharing', label: '#media-sharing', icon: '🖼️' },
  { id: 'announcements', label: '#announcements', icon: '📢' },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const ProjectChatDrawer: React.FC<ProjectChatDrawerProps> = ({
  isOpen,
  onClose,
  projectId,
  messages,
  typingUsers,
  activeChannel,
  onChannelChange,
  onSendMessage,
  onTyping,
}) => {
  const { token } = useAuthStore();
  const [text, setText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeChannel]);

  if (!isOpen) return null;

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${apiUrl}${url}`;
  };

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${apiUrl}/api/projects/${projectId}/messages/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (res.ok) {
          const attachment: ChatAttachment = await res.json();
          setPendingAttachments((prev) => [...prev, attachment]);
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file attachment');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removePendingAttachment(index: number) {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && pendingAttachments.length === 0) return;

    onSendMessage(text.trim(), pendingAttachments);
    setText('');
    setPendingAttachments([]);
    onTyping(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/10 bg-devflow-surface/95 p-6 shadow-2xl backdrop-blur-xl transition-all">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">💬</span>
          <div>
            <h3 className="font-bold text-base text-devflow-text">Group Chat</h3>
            <p className="text-xs text-devflow-muted">Real-time team collaboration & media</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-sm font-semibold text-devflow-muted transition hover:border-white/20 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Channel Switcher */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto border-b border-white/10 pb-3 custom-scrollbar">
        {CHANNELS.map((ch) => {
          const isActive = activeChannel === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => onChannelChange(ch.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-devflow-accent text-white shadow-lg shadow-devflow-accent/20'
                  : 'bg-white/5 text-devflow-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{ch.icon}</span>
              <span>{ch.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Stream */}
      <div className="mt-3 flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <span className="text-3xl mb-2">📁</span>
            <p className="text-xs font-medium text-devflow-muted">
              No messages in <span className="font-bold text-devflow-accent">#{activeChannel}</span> yet.
            </p>
            <p className="text-[11px] text-devflow-muted/60 mt-1">
              Share ideas, code, images, audio, videos, or documents with your team!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const initials = msg.user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div key={msg.id} className="flex gap-3 group">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-devflow-accent/20 border border-devflow-accent/30 font-mono text-xs font-bold text-devflow-accent shadow-sm">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-devflow-text truncate">{msg.user.name}</span>
                  <span className="font-mono text-[10px] text-devflow-muted/70 shrink-0">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Text Body */}
                {msg.text && (
                  <div className="mt-1 rounded-2xl rounded-tl-none border border-white/5 bg-devflow-background/80 px-3.5 py-2 text-xs leading-relaxed text-devflow-text break-words shadow-sm">
                    {msg.text}
                  </div>
                )}

                {/* Multimedia Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att, idx) => {
                      const fileUrl = getMediaUrl(att.url);

                      if (att.fileType === 'image') {
                        return (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage(fileUrl)}
                            className="group/img relative max-w-xs cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-md transition hover:border-devflow-accent"
                          >
                            <img
                              src={fileUrl}
                              alt={att.fileName}
                              className="max-h-48 w-full object-cover transition transform duration-200 group-hover/img:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition">
                              <span className="rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
                                🔍 Click to expand
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (att.fileType === 'video') {
                        return (
                          <div key={idx} className="max-w-xs overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-md">
                            <video src={fileUrl} controls className="w-full max-h-52 rounded-xl" />
                            <div className="p-2 text-[10px] text-devflow-muted truncate">{att.fileName}</div>
                          </div>
                        );
                      }

                      if (att.fileType === 'audio') {
                        return (
                          <div key={idx} className="max-w-xs rounded-xl border border-white/10 bg-white/5 p-2.5 shadow-md">
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-devflow-text font-medium truncate">
                              <span>🎵</span>
                              <span className="truncate">{att.fileName}</span>
                            </div>
                            <audio src={fileUrl} controls className="w-full h-8" />
                          </div>
                        );
                      }

                      // Document / File
                      return (
                        <a
                          key={idx}
                          href={fileUrl}
                          download={att.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="flex max-w-xs items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5 transition hover:border-devflow-accent/50 hover:bg-white/10 shadow-sm"
                        >
                          <span className="text-2xl shrink-0">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-semibold text-devflow-text">{att.fileName}</p>
                            <p className="text-[10px] text-devflow-muted">{formatFileSize(att.fileSize)}</p>
                          </div>
                          <span className="rounded-lg bg-devflow-accent/20 p-1.5 text-xs text-devflow-accent">
                            ⬇️
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="py-1.5 text-[11px] font-mono text-devflow-accent animate-pulse">
          ✍️ {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Pending Upload Attachments Preview Bar */}
      {pendingAttachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-white/10 pt-2.5">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg border border-devflow-accent/30 bg-devflow-accent/10 px-2.5 py-1 text-xs text-devflow-text"
            >
              <span>{att.fileType === 'image' ? '🖼️' : att.fileType === 'video' ? '🎥' : att.fileType === 'audio' ? '🎵' : '📄'}</span>
              <span className="max-w-[120px] truncate font-medium">{att.fileName}</span>
              <button
                type="button"
                onClick={() => removePendingAttachment(idx)}
                className="text-devflow-muted hover:text-red-400 font-bold ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.json,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Send Message Form */}
      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3.5">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base text-devflow-muted transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
          title="Attach media or files"
        >
          {isUploading ? '⏳' : '📎'}
        </button>

        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          placeholder={`Message #${activeChannel}...`}
          className="flex-1 rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-xs text-devflow-text outline-none focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20"
        />

        <button
          type="submit"
          disabled={(!text.trim() && pendingAttachments.length === 0) || isUploading}
          className="rounded-xl bg-devflow-accent px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-devflow-accent/20 transition hover:bg-blue-400 disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {/* Fullscreen Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img src={previewImage} alt="Preview" className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-4 -right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
