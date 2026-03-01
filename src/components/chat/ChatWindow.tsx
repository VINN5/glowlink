import { useState, useEffect, useRef, useCallback } from 'react';
import { messagesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getAvatarUrl = (pic?: string) =>
  pic ? (pic.startsWith('http') ? pic : `${BASE_URL}${pic}`) : null;

interface Props {
  conversation: any;
  onMessageSent?: () => void;
}

const formatMessageTime = (date: string) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'hh:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'hh:mm a')}`;
  return format(d, 'MMM dd, hh:mm a');
};

const ChatWindow = ({ conversation, onMessageSent }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef(conversation.id);
  const pollRef = useRef<any>(null);

  useEffect(() => { convIdRef.current = conversation.id; }, [conversation.id]);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await messagesAPI.getMessages(convIdRef.current);
      setMessages(res.data);
    } catch {}
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    fetchMessages(false);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(pollRef.current);
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    const optimistic = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await messagesAPI.sendMessage(convIdRef.current, content);
      await fetchMessages(true);
      onMessageSent?.();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages: { date: string; messages: any[] }[] = [];
  messages.forEach(msg => {
    const date = format(new Date(msg.created_at), 'MMM dd, yyyy');
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else groupedMessages.push({ date, messages: [msg] });
  });

  const otherPic = getAvatarUrl(conversation.other_picture);
  const otherInitial = conversation.other_name?.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-rose-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Say hello to start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium px-2">{
                  isToday(new Date(group.messages[0].created_at)) ? 'Today' :
                  isYesterday(new Date(group.messages[0].created_at)) ? 'Yesterday' :
                  group.date
                }</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {group.messages.map((msg, i) => {
                const isMine = msg.sender_id === user?.id;
                const showAvatar = !isMine && (i === 0 || group.messages[i-1]?.sender_id !== msg.sender_id);
                return (
                  <div key={msg.id} className={`flex items-end gap-2 mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden ${showAvatar ? 'visible' : 'invisible'}`}>
                        {otherPic ? <img src={otherPic} alt="" className="w-full h-full object-cover" /> : otherInitial}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-sm flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                      } ${msg.optimistic ? 'opacity-60' : ''}`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-1">
                        {formatMessageTime(msg.created_at)}
                        {isMine && !msg.optimistic && (
                          <span className="ml-1 text-gray-300">{msg.is_read ? ' ✓✓' : ' ✓'}</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm resize-none max-h-28"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:shadow-md hover:shadow-rose-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
