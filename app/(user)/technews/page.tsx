'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  User,
  ExternalLink,
  Search,
  RefreshCw,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Rss,
  Zap,
} from 'lucide-react';
import axios from 'axios';

interface NewsArticle {
  _id: string;
  title: string;
  imageUrl: string;
  url: string;
  author: string;
  publishedAt: Date;
  description: string;
  source: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function timeAgo(date: Date | string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

// Card skeleton
function NewsCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="h-48 bg-white/10" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-5 bg-white/10 rounded w-full" />
        <div className="h-5 bg-white/10 rounded w-4/5" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-8 bg-white/10 rounded w-1/3 mt-4" />
      </div>
    </div>
  );
}

// Hero featured card (first article)
function HeroCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-3xl overflow-hidden flex flex-col lg:flex-row col-span-full cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        minHeight: '360px',
      }}
    >
      {/* Image */}
      <div className="relative lg:w-1/2 h-64 lg:h-auto overflow-hidden flex-shrink-0">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
            <Newspaper className="w-20 h-20 text-white/30" />
          </div>
        )}
        {/* gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, transparent 60%, rgba(10,10,20,0.95))' }} />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center p-8 lg:pl-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
            style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }}>
            ⚡ Top Story
          </span>
          {article.source && (
            <span className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
              {article.source}
            </span>
          )}
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-4 transition-colors duration-200"
          style={{ color: '#f1f5f9' }}
        >
          {article.title}
        </h2>
        <p className="text-sm leading-relaxed mb-6 line-clamp-3" style={{ color: '#94a3b8' }}>
          {article.description}
        </p>
        <div className="flex items-center gap-4 text-sm mb-6" style={{ color: '#64748b' }}>
          <span className="flex items-center gap-1">
            <User size={14} />
            {article.author || 'Unknown'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {timeAgo(article.publishedAt)}
          </span>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 group-hover:gap-3"
          style={{ color: '#818cf8' }}>
          Read Full Story <ExternalLink size={15} />
        </span>
      </div>
    </a>
  );
}

// Regular news card
function NewsCard({ article, index }: { article: NewsArticle; index: number }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.style.background =
                'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
            <Newspaper className="w-12 h-12 text-white/20" />
          </div>
        )}
        {/* source badge */}
        {article.source && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#e2e8f0' }}>
              {article.source}
            </span>
          </div>
        )}
        {/* gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(10,10,30,0.8) 0%, transparent 60%)' }} />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#64748b' }}>
          <span className="flex items-center gap-1">
            <User size={12} />
            {article.author || 'Unknown'}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={12} />
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-3 line-clamp-2 transition-colors duration-200 group-hover:text-indigo-300"
          style={{ color: '#e2e8f0' }}>
          {article.title}
        </h3>

        <p className="text-xs leading-relaxed line-clamp-3 mb-4 flex-1" style={{ color: '#64748b' }}>
          {article.description}
        </p>

        <div className="flex items-center gap-1 text-xs font-medium transition-colors duration-200 group-hover:text-indigo-400"
          style={{ color: '#818cf8' }}>
          Read More <ExternalLink size={12} />
        </div>
      </div>
    </a>
  );
}

export default function TechNews() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEmpty, setIsEmpty] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchNews = useCallback(async (page = 1, q = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '11' });
      if (q) params.set('q', q);

      const res = await axios.get(`/api/news?${params.toString()}`);
      const { allNews, pagination: pag } = res.data;

      setNews(allNews || []);
      setPagination(pag || null);
      setIsEmpty(!allNews || allNews.length === 0);
    } catch (err) {
      console.error('Error fetching news:', err);
      setIsEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchNews]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await axios.post('/api/news/seed');
      await fetchNews(1, '');
      setSearch('');
      setCurrentPage(1);
    } catch (err) {
      console.error('Error seeding:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleRefreshLatest = async () => {
    try {
      setRefreshing(true);
      await axios.get('/api/news/latest');
      await fetchNews(1, debouncedSearch);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const featuredArticle = !debouncedSearch && currentPage === 1 && news.length > 0 ? news[0] : null;
  const gridArticles = featuredArticle ? news.slice(1) : news;

  return (
    <div className="min-h-screen" style={{ background: '#080810' }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #4f46e5 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl border-b"
          style={{ background: 'rgba(8,8,16,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Brand */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Rss size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold" style={{ color: '#f1f5f9' }}>TechPulse</h1>
                  <p className="text-xs" style={{ color: '#475569' }}>Live Tech News</p>
                </div>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-lg relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#475569' }} />
                <input
                  type="text"
                  placeholder="Search articles, authors, topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleRefreshLatest}
                  disabled={refreshing}
                  title="Fetch latest from NewsAPI"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                  }}
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{refreshing ? 'Fetching...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  title="Load demo articles"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                  }}
                >
                  <Zap size={15} className={seeding ? 'animate-pulse' : ''} />
                  <span className="hidden sm:inline">{seeding ? 'Loading...' : 'Demo Data'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Banner */}
        {!debouncedSearch && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#6366f1' }}>
                  Technology & Innovation
                </p>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #f1f5f9 30%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                  Latest Tech News
                </h2>
              </div>
              {pagination && (
                <p className="text-sm hidden sm:block" style={{ color: '#475569' }}>
                  {pagination.total} articles
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Loading skeletons */}
          {loading && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(9)].map((_, i) => <NewsCardSkeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && isEmpty && (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Newspaper size={36} style={{ color: '#6366f1' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#e2e8f0' }}>
                {debouncedSearch ? 'No articles found' : 'No news yet'}
              </h3>
              <p className="text-sm mb-8 max-w-xs" style={{ color: '#475569' }}>
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different keyword.`
                  : 'Click "Demo Data" to load sample articles, or "Refresh" to fetch live news.'}
              </p>
              {!debouncedSearch && (
                <button onClick={handleSeed} disabled={seeding}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                  <Zap size={16} />
                  {seeding ? 'Loading Demo Data...' : 'Load Demo Articles'}
                </button>
              )}
            </div>
          )}

          {/* Articles grid */}
          {!loading && !isEmpty && (
            <>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {/* Featured hero card spans full width */}
                {featuredArticle && <HeroCard article={featuredArticle} />}
                {/* Regular cards */}
                {gridArticles.map((article, index) => (
                  <NewsCard key={article._id} article={article} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                    }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
                      const page = i + 1;
                      const isActive = page === currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className="w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200"
                          style={{
                            background: isActive
                              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                              : 'rgba(255,255,255,0.04)',
                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            color: isActive ? 'white' : '#64748b',
                          }}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Page info */}
              {pagination && (
                <p className="text-center text-xs mt-4" style={{ color: '#334155' }}>
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} total articles
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
