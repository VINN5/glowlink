import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { messagesAPI } from '../../services/api';
import { MessageCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChatWindow from '../../components/chat/ChatWindow';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getAvatarUrl = (pic?: string) =>
  pic ? (pic.startsWith('http') ? pic : `${BASE_URL}${pic}`) : null;

const ClientMessages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const location = useLocation();

  const fetchConversations = async (autoSelectId?: string) => {
    try {
      const res = await messagesAPI.listConversations();
      setConversations(res.data);
      // Auto-select conversation if coming from specialist page
      if (autoSelectId) {
        const match = res.data.find((c: any) => c.id === autoSelectId);
        if (match) setActive(match);
        else if (res.data.length > 0) setActive(res.data[0]);
      } else if (active) {
        const updated = res.data.find((c: any) => c.id === active.id);
        if (updated) setActive(updated);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we navigated here with a conversation to open
    const state = location.state as any;
    fetchConversations(state?.conversationId);
    const interval = setInterval(() => fetchConversations(), 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = conversations.filter(c =>
    c.other_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full lg:w-80 border-r border-rose-50 flex flex-col bg-white flex-shrink-0 ${active ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-rose-50">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-10 h-10 text-rose-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Book a specialist to start chatting</p>
            </div>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-rose-50/50 transition-colors text-left border-b border-gray-50 ${active?.id === c.id ? 'bg-rose-50' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {getAvatarUrl(c.other_picture)
                      ? <img src={getAvatarUrl(c.other_picture)!} alt="" className="w-full h-full object-cover" />
                      : c.other_name?.charAt(0).toUpperCase()}
                  </div>
                  {c.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {c.unread_count > 9 ? '9+' : c.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${active?.id === c.id ? 'text-rose-600' : 'text-gray-800'}`}>
                      {c.other_name}
                    </p>
                    {c.last_message_at && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false }).replace('about ', '')}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${c.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {c.last_message || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex flex-col ${!active ? 'hidden lg:flex' : 'flex'}`}>
        {active ? (
          <>
            <div className="bg-white border-b border-rose-50 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setActive(null)} className="lg:hidden text-gray-400 hover:text-gray-600 text-sm font-medium mr-1">
                ← Back
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                {getAvatarUrl(active.other_picture)
                  ? <img src={getAvatarUrl(active.other_picture)!} alt="" className="w-full h-full object-cover" />
                  : active.other_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{active.other_name}</p>
                <p className="text-xs text-emerald-500 font-medium">Beauty Specialist</p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <ChatWindow conversation={active} onMessageSent={fetchConversations} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-rose-300" />
              </div>
              <p className="font-semibold text-gray-600">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Pick one from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientMessages;
