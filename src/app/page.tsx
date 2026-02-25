'use client';

import { useEffect, useState } from 'react';
import type { Job } from '@/lib/types';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; ring: string }> = {
  Saved:      { bg: 'bg-slate-50',   text: 'text-slate-700',  border: 'border-slate-200', dot: 'bg-slate-400',  ring: 'ring-slate-300' },
  Applied:    { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',  dot: 'bg-blue-500',   ring: 'ring-blue-300' },
  Interview:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-500',  ring: 'ring-amber-300' },
  Offer:      { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500',ring: 'ring-emerald-300' },
  Rejected:   { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',   dot: 'bg-red-500',    ring: 'ring-red-300' },
  Withdrawn:  { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', ring: 'ring-purple-300' },
};

const STATUSES = ['All', 'Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs?status=All')
      .then(r => r.json())
      .then(data => { setAllJobs(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (filter === 'All') {
      setJobs(allJobs);
    } else {
      setJobs(allJobs.filter(j => j.status === filter));
    }
  }, [filter, allJobs]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(status === 'Applied' ? { date_applied: new Date().toISOString().split('T')[0] } : {}) }),
    });
    setAllJobs(allJobs.map(j => j.id === id ? { ...j, status } : j));
  };

  const deleteJob = async (id: number) => {
    if (!confirm('Delete this job?')) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    setAllJobs(allJobs.filter(j => j.id !== id));
  };

  const counts = allJobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Search Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {allJobs.length} job{allJobs.length !== 1 ? 's' : ''} tracked
            {allJobs.filter(j => j.status === 'Applied').length > 0 && (
              <span> · {allJobs.filter(j => j.status === 'Applied').length} applied</span>
            )}
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {STATUSES.filter(s => s !== 'All').map(s => {
          const config = STATUS_CONFIG[s];
          const isActive = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? 'All' : s)}
              className={`relative rounded-xl p-4 text-center transition-all border-2 ${
                isActive
                  ? `${config.bg} ${config.border} ${config.ring} ring-2 shadow-sm`
                  : `bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm`
              }`}
            >
              <div className={`text-3xl font-bold ${isActive ? config.text : 'text-slate-900'}`}>
                {counts[s] || 0}
              </div>
              <div className={`text-xs font-medium mt-1 ${isActive ? config.text : 'text-slate-500'}`}>
                {s}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter indicator */}
      {filter !== 'All' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-500">Showing:</span>
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[filter].bg} ${STATUS_CONFIG[filter].text}`}>
            {filter}
          </span>
          <button onClick={() => setFilter('All')} className="text-xs text-slate-400 hover:text-slate-600 ml-1">
            Clear filter ✕
          </button>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 mt-3">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-slate-600 font-medium mb-2">
            {filter !== 'All' ? `No ${filter.toLowerCase()} jobs` : 'No jobs tracked yet'}
          </p>
          <p className="text-slate-400 text-sm mb-4">
            {filter !== 'All' ? 'Try a different filter or add new jobs' : 'Start by adding your first job application'}
          </p>
          <a href="/add" className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm">
            Add your first job
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.Saved;
            return (
              <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <a href={`/jobs/${job.id}`} className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate">
                        {job.title}
                      </a>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.text} shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {job.status}
                      </span>
                      {job.parsed_match_score !== null && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                          job.parsed_match_score >= 70 ? 'bg-emerald-50 text-emerald-700' :
                          job.parsed_match_score >= 40 ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {job.parsed_match_score}% match
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-600 mb-2">{job.company}</div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {job.location}
                        </span>
                      )}
                      {job.remote_type && (
                        <span className="flex items-center gap-1">
                          {job.remote_type === 'remote' ? '🏠' : job.remote_type === 'hybrid' ? '🏢' : '🏛️'}
                          {job.remote_type}
                        </span>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <span className="flex items-center gap-1 font-medium text-emerald-600">
                          💰 {job.salary_min ? `$${(job.salary_min/1000).toFixed(0)}K` : ''}
                          {job.salary_min && job.salary_max ? ' – ' : ''}
                          {job.salary_max ? `$${(job.salary_max/1000).toFixed(0)}K` : ''}
                        </span>
                      )}
                      <span className="text-slate-400">Found {job.date_found}</span>
                      {job.date_applied && <span className="text-blue-500 font-medium">Applied {job.date_applied}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    <select
                      value={job.status}
                      onChange={e => updateStatus(job.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white hover:border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {STATUSES.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        Link ↗
                      </a>
                    )}
                    <button onClick={() => deleteJob(job.id)} className="text-xs text-slate-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
