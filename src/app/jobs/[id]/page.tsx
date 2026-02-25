'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job } from '@/lib/types';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Job>>({});
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${params.id}`).then(r => r.json()).then(setJob);
  }, [params.id]);

  const parseJob = async () => {
    setParsing(true);
    const res = await fetch(`/api/jobs/${params.id}/parse`, { method: 'POST' });
    const updated = await res.json();
    setJob(updated);
    setParsing(false);
  };

  const saveEdit = async () => {
    const res = await fetch(`/api/jobs/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setJob(updated);
    setEditing(false);
  };

  if (!job) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const matchAnalysis = job.parsed_match_analysis ? JSON.parse(job.parsed_match_analysis) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Back</button>
      
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-lg text-gray-600">{job.company}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {job.location && <span>📍 {job.location}</span>}
              {job.remote_type && <span>🏠 {job.remote_type}</span>}
              {(job.salary_min || job.salary_max) && (
                <span>💰 ${job.salary_min ? `${(job.salary_min/1000).toFixed(0)}K` : '?'} - ${job.salary_max ? `${(job.salary_max/1000).toFixed(0)}K` : '?'}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">View Posting ↗</a>}
            <button onClick={() => { setEditing(true); setEditForm(job); }} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Edit</button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 mt-4">
          {['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={async () => {
                await fetch(`/api/jobs/${job.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: s }),
                });
                setJob({ ...job, status: s });
              }}
              className={`text-xs px-3 py-1 rounded-full border ${job.status === s ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {job.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">{job.notes}</div>
        )}
      </div>

      {/* Match Score */}
      {job.parsed_match_score !== null && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Resume Match Analysis</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-3xl font-bold ${job.parsed_match_score >= 70 ? 'text-green-600' : job.parsed_match_score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {job.parsed_match_score}%
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div className={`h-3 rounded-full ${job.parsed_match_score >= 70 ? 'bg-green-500' : job.parsed_match_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${job.parsed_match_score}%` }} />
            </div>
          </div>
          {matchAnalysis && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-green-700 mb-2">✅ Matching Skills ({matchAnalysis.matched?.length || 0})</h3>
                <div className="flex flex-wrap gap-1">
                  {matchAnalysis.matched?.map((s: string, i: number) => (
                    <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">⬜ Not Mentioned ({matchAnalysis.missing?.length || 0})</h3>
                <div className="flex flex-wrap gap-1">
                  {matchAnalysis.missing?.map((s: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parsed sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {job.parsed_requirements && (
          <ParsedSection title="Requirements" items={JSON.parse(job.parsed_requirements)} />
        )}
        {job.parsed_responsibilities && (
          <ParsedSection title="Responsibilities" items={JSON.parse(job.parsed_responsibilities)} />
        )}
        {job.parsed_preferred && (
          <ParsedSection title="Preferred Qualifications" items={JSON.parse(job.parsed_preferred)} />
        )}
        {job.parsed_company_info && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Company Info</h3>
            <p className="text-sm text-gray-600">{job.parsed_company_info}</p>
          </div>
        )}
      </div>

      {!job.parsed_requirements && job.original_description && (
        <button onClick={parseJob} disabled={parsing} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-6">
          {parsing ? 'Parsing...' : '🔍 Parse Job Description'}
        </button>
      )}

      {/* Original description */}
      {job.original_description && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-3">Original Job Description</h2>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{job.original_description}</pre>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Job</h2>
            <div className="space-y-3">
              <input value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Title" />
              <input value={editForm.company || ''} onChange={e => setEditForm({...editForm, company: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Company" />
              <input value={editForm.url || ''} onChange={e => setEditForm({...editForm, url: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="URL" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={editForm.salary_min || ''} onChange={e => setEditForm({...editForm, salary_min: parseInt(e.target.value) || null})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Min salary" />
                <input type="number" value={editForm.salary_max || ''} onChange={e => setEditForm({...editForm, salary_max: parseInt(e.target.value) || null})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Max salary" />
              </div>
              <input value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Location" />
              <textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={3} className="w-full border rounded px-3 py-2 text-sm" placeholder="Notes" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveEdit} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Save</button>
              <button onClick={() => setEditing(false)} className="border px-4 py-2 rounded text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ParsedSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
            <span className="text-gray-400 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
