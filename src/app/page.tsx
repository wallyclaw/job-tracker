'use client';

import { useEffect, useState } from 'react';
import type { Job } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  Saved: 'bg-gray-100 text-gray-700',
  Applied: 'bg-blue-100 text-blue-700',
  Interview: 'bg-yellow-100 text-yellow-700',
  Offer: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Withdrawn: 'bg-purple-100 text-purple-700',
};

const STATUSES = ['All', 'Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs?status=${filter}`)
      .then(r => r.json())
      .then(data => { setJobs(data); setLoading(false); });
  }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(status === 'Applied' ? { date_applied: new Date().toISOString().split('T')[0] } : {}) }),
    });
    setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
  };

  const deleteJob = async (id: number) => {
    if (!confirm('Delete this job?')) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    setJobs(jobs.filter(j => j.id !== id));
  };

  const counts = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Job Search Dashboard</h1>
        <div className="text-sm text-gray-500">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} tracked
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {STATUSES.filter(s => s !== 'All').map(s => (
          <div key={s} className={`rounded-lg p-3 text-center cursor-pointer ${filter === s ? 'ring-2 ring-blue-500' : ''} ${STATUS_COLORS[s]}`} onClick={() => setFilter(filter === s ? 'All' : s)}>
            <div className="text-2xl font-bold">{counts[s] || 0}</div>
            <div className="text-xs">{s}</div>
          </div>
        ))}
      </div>

      {/* Job list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No jobs tracked yet.</p>
          <a href="/add" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add your first job</a>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <a href={`/jobs/${job.id}`} className="text-lg font-semibold hover:text-blue-600">{job.title}</a>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>{job.status}</span>
                    {job.parsed_match_score !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${job.parsed_match_score >= 70 ? 'bg-green-100 text-green-700' : job.parsed_match_score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {job.parsed_match_score}% match
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{job.company}</div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    {job.location && <span>📍 {job.location}</span>}
                    {job.remote_type && <span>🏠 {job.remote_type}</span>}
                    {(job.salary_min || job.salary_max) && (
                      <span>💰 {job.salary_min ? `$${(job.salary_min/1000).toFixed(0)}K` : ''}{job.salary_min && job.salary_max ? ' - ' : ''}{job.salary_max ? `$${(job.salary_max/1000).toFixed(0)}K` : ''}</span>
                    )}
                    <span>Found: {job.date_found}</span>
                    {job.date_applied && <span>Applied: {job.date_applied}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={job.status}
                    onChange={e => updateStatus(job.id, e.target.value)}
                    className="text-xs border rounded px-2 py-1"
                  >
                    {STATUSES.filter(s => s !== 'All').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Link ↗</a>
                  )}
                  <button onClick={() => deleteJob(job.id)} className="text-xs text-red-500 hover:text-red-700">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
