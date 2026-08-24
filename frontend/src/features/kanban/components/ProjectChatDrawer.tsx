import React, { FormEvent, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../hooks/useKanbanSocket';

interface ProjectChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  typingUsers: string[];
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export const ProjectChatDrawer: React.FC<ProjectChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  typingUsers,
  onSendMessage,
  onTyping,
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
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
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-devflow-surface/95 p-6 shadow-2xl backdrop-blur-xl transition-all">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">💬</span>
          <div>
            <h3 className="font-bold text-base text-devflow-text">Project Chat</h3>
            <p className="text-xs text-devflow-muted">Real-time team discussion</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-sm font-semibold text-devflow-muted transition hover:border-white/20 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Messages Stream */}
      <div className="mt-4 flex-1 space-y-3.5 overflow-y-auto pr-1 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-xs text-devflow-muted/60">
              No chat messages yet. Start the conversation!
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
            <div key={msg.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-devflow-accent/20 border border-devflow-accent/30 font-mono text-xs font-bold text-devflow-accent">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-devflow-text">{msg.user.name}</span>
                  <span className="font-mono text-[10px] text-devflow-muted/70">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="mt-1 rounded-2xl rounded-tl-none border border-white/5 bg-devflow-background/80 px-3.5 py-2 text-xs leading-relaxed text-devflow-text">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="py-2 text-[11px] font-mono text-devflow-accent animate-pulse">
          ✍️ {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Send Message Form */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 border-t border-white/10 pt-4">
        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-xs text-devflow-text outline-none focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-xl bg-devflow-accent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};
