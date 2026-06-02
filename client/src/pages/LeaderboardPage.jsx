import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { users } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const MEDAL = {
  0: { icon: '🥇', bg: 'bg-[var(--card-bg)]', border: 'border-[var(--primary)]', text: 'text-[var(--primary)]' },
  1: { icon: '🥈', bg: 'bg-[var(--surface)]', border: 'border-[var(--border)]',  text: 'text-[var(--text-muted)]'  },
  2: { icon: '🥉', bg: 'bg-[var(--card-bg)]', border: 'border-[var(--accent)]',  text: 'text-[var(--accent)]'      },
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  // Fetch leaderboard data on mount
  const { data, loading, error } = useAsync(
    () => users.getLeaderboard().then((r) => r.data.data ?? []),
    []
  );

  const board = data ?? [];
  const myRank = user
    ? board.find((u) => String(u._id) === String(user.id) || String(u._id) === String(user._id)) ?? null
    : null;

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy size={20} className="text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">Leaderboard</h1>
            <p className="text-sm text-[var(--text-muted)]">Top contributors by reputation</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <EmptyState icon="AlertCircle" title="Failed to load leaderboard"
            message={error?.response?.data?.error || error?.message}
            actionLabel="Retry" onAction={() => window.location.reload()} />
        ) : (
          <>
            {/* Top 3 podium */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {board.slice(0, 3).map((u, i) => {
                const isMe = user && (String(u._id) === String(user.id) || String(u._id) === String(user._id));
                const rankLabel = ['', '1st', '2nd', '3rd'][i];
                const size = i === 0 ? 'text-6xl' : 'text-5xl';
                // Deduplicate badges by name (same badge shouldn't appear twice)
                const uniqueBadges = (u.badges || []).reduce((acc, b) => {
                  if (!acc.find((x) => x.name === b.name)) acc.push(b);
                  return acc;
                }, []);
                return (
                  <Link key={u._id} to={`/profile/${String(u._id || '')}`}
                    className={`relative flex items-center gap-5 rounded-2xl border p-5 bg-[var(--card-bg)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group ${isMe ? 'ring-2 ring-[var(--primary)]' : 'border-[var(--border)]'}`}>
                    {/* Rank badge */}
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-white ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                      <span className={`leading-none ${size}`}>{MEDAL[i].icon}</span>
                    </div>
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{rankLabel} Place</p>
                        {isMe && <span className="text-xs px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">(you)</span>}
                      </div>
                      <p className="text-xl font-bold text-[var(--text-h)] truncate group-hover:text-[var(--primary)] transition-colors">{u.name}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {uniqueBadges.slice(0, 3).map((b, bi) => (
                          <span key={bi} className="text-[11px] px-2 py-0.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] rounded-full capitalize">
                            {b.name?.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-3xl font-black text-[var(--primary)]">{u.reputation?.toLocaleString()}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{u.faqCount || 0} FAQs answered</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Ranked list 4+ */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-gray-100">
              {board.slice(3).map((u, idx) => {
                const rank = idx + 4;
                const isMe = user && (String(u._id) === String(user.id) || String(u._id) === String(user._id));
                const uniqueBadges = (u.badges || []).reduce((acc, b) => {
                  if (!acc.find((x) => x.name === b.name)) acc.push(b);
                  return acc;
                }, []);
                return (
                  <Link key={u._id} to={`/profile/${String(u._id || '')}`}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface)] transition-colors ${isMe ? 'bg-[var(--primary)]/10' : ''}`}>
                    <span className="w-7 text-center font-mono text-sm font-semibold text-[var(--text)] flex-shrink-0">
                      #{rank}
                    </span>
                    <img
                      src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff&size=36`}
                      alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-[var(--primary)]' : 'text-[var(--text-h)]'}`}>
                        {u.name} {isMe && <span className="text-xs text-[var(--primary)]">(you)</span>}
                      </p>
                      {uniqueBadges.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {uniqueBadges.slice(0, 2).map((b, bi) => (
                            <span key={bi} className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full capitalize">
                              {b.name?.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[var(--text-h)]">{u.reputation?.toLocaleString()}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{u.faqCount || 0} FAQs</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* My rank (outside top 10) - only show if user not already in top 10 */}
            {myRank && !board.slice(0, 10).some((u) => user && (String(u._id) === String(user.id) || String(u._id) === String(user._id))) && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[var(--primary)] bg-[var(--primary)]/10 px-5 py-3.5 flex items-center gap-4">
                <span className="w-7 text-center font-mono text-sm font-semibold text-[var(--primary)] flex-shrink-0">
                  #{board.length + 1}
                </span>
                <img
                  src={myRank.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(myRank.name)}&background=3b82f6&color=fff&size=36`}
                  alt={myRank.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--primary)]">You</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[var(--primary)]">{myRank.reputation?.toLocaleString()}</p>
                  <p className="text-[11px] text-[var(--primary)]">your score</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;