import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { format } from 'timeago.js';
import { notifications as notifApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const NotificationsPage = () => {
  const { socket } = useSocket();
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    let isMounted = true;
    notifApi.getAll()
      .then((res) => {
        if (!isMounted) return;
        setList(res.data.data ?? []);
        setUnread(res.data.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  // Real-time new notifications
  useEffect(() => {
    if (!socket) return;
    const onNew = (notif) => {
      setList((prev) => [notif, ...prev]);
      setUnread((n) => n + 1);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket]);

  const handleMarkOne = async (notif) => {
    try {
      await notifApi.markRead(notif._id);
      setList((l) => l.map((n) => n._id === notif._id ? { ...n, isRead: true } : n));
      if (!notif.isRead) setUnread((n) => Math.max(0, n - 1));
    } catch {}
    const faqId = typeof notif.faqId === 'object' ? notif.faqId._id : notif.faqId;
    if (faqId) window.location.href = `/faqs/${faqId}`;
  };

  const handleMarkAll = async () => {
    try {
      await notifApi.markAllRead();
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  const filtered = filter === 'unread' ? list.filter((n) => !n.isRead) : list;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen bg-[var(--surface)]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-h)]">Notifications</h1>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm bg-[var(--card-bg)] text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-1.5"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--primary)] font-medium"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description={filter === 'unread' ? 'All caught up!' : 'When you get a notification it will appear here.'}
        />
      ) : (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
          {filtered.map((n, i) => (
            <button
              key={n._id}
              onClick={() => handleMarkOne(n)}
              className={`w-full text-left px-4 py-4 hover:bg-[var(--surface)] transition-colors border-b border-[var(--border)] last:border-0 ${
                !n.isRead ? 'border-l-2 border-l-[var(--primary)] bg-[var(--primary)]/5' : 'border-l-2 border-l-transparent'
              }`}
            >
              <p className="text-sm text-[var(--text)] leading-snug">{n.message}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-[var(--text-muted)]">
                  {n.createdAt ? format(new Date(n.createdAt)) : ''}
                </p>
                {n.type && (
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 bg-[var(--surface)] text-[var(--text-muted)] rounded">
                    {n.type}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;