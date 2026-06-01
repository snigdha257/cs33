import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import { Search, ChevronUp, ChevronDown, MessageSquare, Eye, Tag, Filter, X } from 'lucide-react';
import { faqs } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import useDocumentMeta from '../hooks/useDocumentMeta';
import useAsync from '../hooks/useAsync';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const CATEGORIES = ['general', 'technical', 'billing', 'policy', 'other'];

const CategoryIcon = ({ category }) => {
  const icons = { general: '💬', technical: '🔧', billing: '💰', policy: '📋', other: '📌' };
  return <span>{icons[category] || '📌'}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { label: '⏳ Pending',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    approved: { label: '✅ Approved', cls: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]' },
    rejected: { label: '❌ Rejected', cls: 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]' },
    flagged:  { label: '🚩 Flagged',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  };
  const b = map[status] || map.pending;
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${b.cls}`}>{b.label}</span>;
};

const SkeletonCard = () => (
  <div className="faq-card animate-pulse">
    <div className="h-5 bg-[var(--border)] rounded w-3/4 mb-3" />
    <div className="flex gap-2 mb-3">
      <div className="h-3 bg-[var(--surface)] rounded w-1/4" />
      <div className="h-3 bg-[var(--surface)] rounded w-1/3" />
    </div>
    <div className="flex items-center gap-3 mt-3">
      <div className="w-6 h-6 bg-[var(--border)] rounded-full" />
      <div className="h-3 bg-[var(--surface)] rounded w-24" />
      <div className="h-3 bg-[var(--surface)] rounded w-16" />
    </div>
  </div>
);

// ── Mobile filter drawer ──────────────────────────────────────────────────────
const FilterDrawer = ({ open, onClose, category, setCategory, tag, setTag, sort, setSort, popularTags }) => (
  open ? (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-[var(--text-h)]">Filters</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface)]"><X size={18} /></button>
        </div>

        {/* Category */}
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Category</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(category === c ? '' : c)}
              className={`px-3 py-1.5 text-sm rounded-full border capitalize flex items-center gap-1.5 transition-colors ${
                category === c ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]'
              }`}>
              <CategoryIcon category={c} /> {c}
            </button>
          ))}
        </div>

        {/* Tags */}
        {popularTags.length > 0 && (
          <>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {popularTags.map((t) => (
                <button key={t} onClick={() => setTag(tag === t ? '' : t)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    tag === t ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)]'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Sort */}
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Sort by</p>
        <div className="flex flex-wrap gap-2">
          {[['newest', 'Newest'], ['oldest', 'Oldest'], ['votes', 'Most Voted'], ['views', 'Most Viewed'], ['recently_updated', 'Recently Updated'], ['unanswered', 'Unanswered'], ['relevance', 'Relevance']].map(([v, label]) => (
            <button key={v} onClick={() => { setSort(v); onClose(); }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                sort === v ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null
);

const FAQListPage = () => {
  const { user } = useAuth();
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchFields, setSearchFields] = useState('all');
  const [category, setCategory]       = useState('');
  const [tag, setTag]                 = useState('');
  const [sort, setSort]               = useState('newest');
  const [page, setPage]               = useState(1);
  const [filterOpen, setFilterOpen]   = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, category, tag, sort]);

  // Fetch popular tags once
  const { data: tagsData } = useAsync(
    () => faqs.getAll({ limit: 100 }).then((r) => r.data.data ?? []),
    []
  );
  const popularTags = useMemo(
    () => [...new Set((tagsData ?? []).flatMap((f) => f.tags ?? []))].slice(0, 15),
    [tagsData]
  );

  // Build params object — useMemo so the reference is stable across renders
  const params = useMemo(
    () => {
      const p = { page, limit: 10, sort };
      if (debouncedSearch) {
        p.search = debouncedSearch;
        if (searchFields !== 'all') p.searchFields = searchFields;
      }
      if (category)        p.category = category;
      if (tag)             p.tag = tag;
      return p;
    },
    [page, sort, debouncedSearch, searchFields, category, tag]
  );

  const { data: faqResult, loading, error, reexecute } = useAsync(
    () => faqs.getAll(params).then((r) => r.data),
    [params]
  );

  const [faqList, setFaqList] = useState([]);
  const totalPages = faqResult?.pagination?.totalPages ?? 1;
  const totalItems = faqResult?.pagination?.totalItems ?? 0;

  // Keep local list in sync when API data changes
  useEffect(() => {
    setFaqList(faqResult?.data ?? []);
  }, [faqResult]);

  useDocumentMeta({
    title: 'Browse FAQs',
    description: 'Search and explore questions answered by the community.',
  });

  // ── Vote handler ──────────────────────────────────────────────────────────────────
  const handleVote = useCallback(
    async (faqId, rawVote, event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!user) {
        toast.error('Login to vote');
        return;
      }

      // Optimistic snapshot
      setFaqList((prev) =>
        prev.map((f) => {
          if (f._id !== faqId) return f;
          const currentVote = f.voters?.find((v) => v.user === user.id || v.user?._id === user.id)?.vote ?? 0;
          let newVote = rawVote;
          // Toggle off if clicking same direction again
          if (currentVote === rawVote) newVote = 0;
          const voteDelta = newVote - currentVote;

          // Update voters array to keep button highlight in sync
          const votersWithoutMe = (f.voters || []).filter((v) => v.user !== user.id && v.user?._id !== user.id);
          const newVoters = newVote !== 0
            ? [...votersWithoutMe, { user: user.id, vote: newVote }]
            : votersWithoutMe;

          return { ...f, votes: (f.votes || 0) + voteDelta, voters: newVoters };
        })
      );

      try {
        await faqs.vote(faqId, rawVote);
      } catch (err) {
        // Revert optimistic update on failure
        reexecute();
        toast.error(err.message || 'Failed to vote');
      }
    },
    [user, reexecute]
  );

  const getAvatarUrl = (author) =>
    author?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name || 'U')}&background=3b82f6&color=fff&size=32`;

  const pageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[var(--text-h)]">Browse FAQs</h1>
          {debouncedSearch ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-[var(--text-muted)]">
                {loading ? '...' : `${totalItems.toLocaleString()} result${totalItems !== 1 ? 's' : ''} for `}
                <span className="font-medium text-[var(--text)]">"{debouncedSearch}"</span>
              </p>
              <button onClick={() => setSearch('')} className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                <X size={12} /> Clear
              </button>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {loading ? '...' : `${totalItems.toLocaleString()} FAQs found`}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input
            type="text" placeholder="Search FAQs..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {debouncedSearch && (
            <select
              value={searchFields}
              onChange={(e) => setSearchFields(e.target.value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs border border-[var(--border)] rounded px-2 py-1 bg-[var(--surface)] text-[var(--text-muted)] focus:outline-none"
            >
              <option value="all">All fields</option>
              <option value="question">Questions only</option>
              <option value="question+body">Q + Answer</option>
            </select>
          )}
        </div>

        {/* Desktop filters — always visible */}
        <div className="hidden md:block mb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Filter size={14} className="text-[var(--text-muted)]" />
            <button onClick={() => setCategory('')} className={`px-3 py-1 text-sm rounded-full border transition-colors ${!category ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)]'}`}>All</button>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(category === c ? '' : c)}
                className={`px-3 py-1 text-sm rounded-full border capitalize transition-colors ${category === c ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)]'}`}>
                <CategoryIcon category={c} /> {c}
              </button>
            ))}
          </div>
          {popularTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={12} className="text-[var(--text-muted)]" />
              {popularTags.map((t) => (
                <button key={t} onClick={() => setTag(tag === t ? '' : t)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${tag === t ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)]'}`}>{t}</button>
              ))}
            </div>
          )}
        </div>

        {/* Sort row — desktop */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>Sort by:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="border border-[var(--border)] rounded px-2 py-1 text-sm bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="votes">Most Voted</option>
              <option value="views">Most Viewed</option>
              <option value="recently_updated">Recently Updated</option>
              <option value="unanswered">Unanswered</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
          {tag && <button onClick={() => setTag('')} className="text-xs text-[var(--primary)] hover:underline">Clear tag ✕</button>}
        </div>

        {/* Mobile: filter bar + sort */}
        <div className="flex md:hidden items-center gap-2 mb-4">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors flex-1"
          >
            <Filter size={14} /> Filters {(category || tag) && <span className="ml-1 w-2 h-2 rounded-full bg-[var(--primary)] inline-block" />}
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="border border-[var(--border)] rounded px-2 py-2 text-sm bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="votes">Top Voted</option>
            <option value="views">Most Viewed</option>
            <option value="recently_updated">Recently Updated</option>
            <option value="unanswered">Unanswered</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>
        {tag && (
          <div className="flex md:hidden mb-3">
            <button onClick={() => setTag('')} className="text-xs text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-full">
              Tag: {tag} ✕
            </button>
          </div>
        )}

        <FilterDrawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          category={category} setCategory={setCategory}
          tag={tag} setTag={setTag}
          sort={sort} setSort={setSort}
          popularTags={popularTags}
        />

        {/* FAQ list */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <EmptyState
            icon="AlertCircle"
            title="Failed to load FAQs"
            message={error?.response?.data?.error || error?.message || 'Something went wrong'}
            actionLabel="Retry"
            onAction={() => window.location.reload()}
          />
        ) : faqList.length === 0 ? (
          <EmptyState
            icon="Search"
            title="No FAQs found"
            message="Try adjusting your search or filters"
            actionLabel="Clear filters"
            onAction={() => { setSearch(''); setCategory(''); setTag(''); setSort('newest'); }}
          />
        ) : (
          <div className="space-y-3">
            {faqList.map((faq) => (
              <Link key={faq._id} to={`/faqs/${String(faq._id ?? faq.id ?? '')}`} className="faq-card">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Vote count — desktop only */}
                  <div className="hidden sm:flex flex-col items-center min-w-[40px]">
                    <button
                      onClick={(e) => handleVote(faq._id, 1, e)}
                      className={`p-0.5 rounded transition-colors ${
                        (faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) === 1
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                      }`}
                    >
                      <ChevronUp size={16} strokeWidth={2.5} />
                    </button>
                    <span className={`font-bold text-sm ${
                      (faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) !== 0
                        ? ((faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) === 1
                            ? 'text-[var(--primary)]'
                            : 'text-[var(--error)]')
                        : 'text-[var(--text)]'
                    }`}>
                      {faq.votes || 0}
                    </span>
                    <button
                      onClick={(e) => handleVote(faq._id, -1, e)}
                      className={`p-0.5 rounded transition-colors ${
                        (faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) === -1
                          ? 'text-[var(--error)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--error)]'
                      }`}
                    >
                      <ChevronDown size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[var(--text-h)] hover:text-[var(--primary)] transition-colors line-clamp-2 text-base">
                        {faq.question}
                      </h3>
                      <span className="flex-shrink-0 text-lg"><CategoryIcon category={faq.category} /></span>
                    </div>
                    {faq.body && <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{faq.body}</p>}
                    {faq.highlights?.length > 0 && (
                      <p className="text-xs text-[var(--primary)] mt-1.5 italic border-l-2 border-[var(--primary)] pl-2 line-clamp-2">
                        {faq.highlights[0]}
                      </p>
                    )}
                    {faq.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {faq.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-[var(--surface)] text-[var(--text-muted)] text-xs rounded-full">{t}</span>)}
                      </div>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs text-[var(--text-muted)] flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <img src={getAvatarUrl(faq.author)} className="w-5 h-5 rounded-full object-cover" alt="" />
                        {faq.author?.name}
                      </span>
                      <span>{format(new Date(faq.createdAt), { locale: 'en' })}</span>
                      <span className="flex items-center gap-0.5"><MessageSquare size={12} /> {faq.answers?.length || 0}</span>
                      <span className="flex items-center gap-0.5"><Eye size={12} /> {faq.views || 0}</span>
                      {faq.status !== 'approved' && <StatusBadge status={faq.status} />}
                      {/* Mobile vote buttons */}
                      <span className="sm:hidden flex items-center gap-0.5">
                        <button
                          onClick={(e) => handleVote(faq._id, 1, e)}
                          className={`p-1 rounded transition-colors ${
                            (faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) === 1
                              ? 'text-[var(--primary)]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          <ChevronUp size={15} strokeWidth={2.5} />
                        </button>
                        <span className={`font-bold text-sm ${
                          (faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) !== 0
                            ? ((faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) === 1
                                ? 'text-[var(--primary)]'
                                : 'text-[var(--error)]')
                            : 'text-[var(--text)]'
                        }`}>
                          {faq.votes || 0}
                        </span>
                        <button
                          onClick={(e) => handleVote(faq._id, -1, e)}
                          className={`p-1 rounded transition-colors ${
                            (faq.voters?.find((v) => v.user === user?.id || v.user?._id === user?.id)?.vote ?? 0) === -1
                              ? 'text-[var(--error)]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          <ChevronDown size={15} strokeWidth={2.5} />
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded disabled:opacity-40 hover:bg-[var(--surface)] disabled:cursor-not-allowed">
              Prev
            </button>
            {pageNumbers().map((p, i) =>
              p === '...' ? <span key={`e-${i}`} className="px-2 text-[var(--text-muted)]">…</span> :
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-sm border rounded ${
                    page === p ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)] hover:bg-[var(--surface)]'
                  }`}>{p}</button>
            )}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded disabled:opacity-40 hover:bg-[var(--surface)] disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQListPage;