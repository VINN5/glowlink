import { useState, useEffect } from 'react';
import { messagesAPI } from '../../services/api';
import { MessageCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChatWindow from '../../components/chat/ChatWindow';

// Treats naive UTC timestamps from MongoDB as UTC
const parseUTC = (ts?: string) => {
  if (!ts) return new Date();
  if (ts.endsWith('Z') || ts.includes('+')) return new Date(ts);
  return new Date(ts + 'Z');
};

const SpecialistMessages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchConversations = async () => {
    try {
      const res = await messagesAPI.listConversations();
      setConversations(res.data);
      if (active) {
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
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = conversations.filter(c =>
    c.other_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full lg:w-80 border-r border-purple-50 flex flex-col bg-white flex-shrink-0 ${active ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-purple-50">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400"
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
              <MessageCircle className="w-10 h-10 text-violet-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Clients will message you here</p>
            </div>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-violet-50/50 transition-colors text-left border-b border-gray-50 ${active?.id === c.id ? 'bg-violet-50' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {c.other_picture
                      ? <img src={c.other_picture} alt="" className="w-full h-full object-cover" />
                      : c.other_name?.charAt(0).toUpperCase()}
                  </div>
                  {c.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {c.unread_count > 9 ? '9+' : c.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${active?.id === c.id ? 'text-violet-600' : 'text-gray-800'}`}>
                      {c.other_name}
                    </p>
                    {c.last_message_at && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatDistanceToNow(parseUTC(c.last_message_at), { addSuffix: false }).replace('about ', '')}
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
            <div className="bg-white border-b border-purple-50 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setActive(null)} className="lg:hidden text-gray-400 hover:text-gray-600 text-sm font-medium mr-1">
                ← Back
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                {active.other_picture
                  ? <img src={active.other_picture} alt="" className="w-full h-full object-cover" />
                  : active.other_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{active.other_name}</p>
                <p className="text-xs text-emerald-500 font-medium">Client</p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <ChatWindow conversation={active} onMessageSent={fetchConversations} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-violet-300" />
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

export default SpecialistMessages;
