'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    url: '',
    original_description: '',
    salary_min: '',
    salary_max: '',
    location: '',
    remote_type: 'remote',
    status: 'Saved',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      }),
    });

    if (res.ok) {
      const job = await res.json();
      if (form.original_description) {
        await fetch(`/api/jobs/${job.id}/parse`, { method: 'POST' });
      }
      router.push(`/jobs/${job.id}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Add New Job</h1>
        <p className="text-slate-500 mt-1">Paste the job description and we&apos;ll auto-parse it for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Description - First for paste & parse flow */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Job Description
            <span className="text-slate-400 font-normal ml-2">Paste the full text — auto-parsed on save</span>
          </label>
          <textarea
            value={form.original_description}
            onChange={e => setForm({...form, original_description: e.target.value})}
            rows={10}
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-y"
            placeholder="Paste the full job description here..."
          />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Job Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="GTM Systems Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Company *</label>
              <input
                required
                value={form.company}
                onChange={e => setForm({...form, company: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Grafana Labs"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Job URL</label>
            <input
              value={form.url}
              onChange={e => setForm({...form, url: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Compensation & Location */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Compensation & Location</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Salary Min ($)</label>
              <input
                type="number"
                value={form.salary_min}
                onChange={e => setForm({...form, salary_min: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="175000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Salary Max ($)</label>
              <input
                type="number"
                value={form.salary_max}
                onChange={e => setForm({...form, salary_max: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="210000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Location</label>
              <input
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Remote, US"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Work Type</label>
              <select
                value={form.remote_type}
                onChange={e => setForm({...form, remote_type: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="remote">🏠 Remote</option>
                <option value="hybrid">🏢 Hybrid</option>
                <option value="onsite">🏛️ On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({...form, notes: e.target.value})}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            placeholder="How did you find this role? Any contacts?"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm hover:shadow transition-all"
          >
            {submitting ? 'Saving...' : 'Save Job'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-200 text-slate-700 px-8 py-3 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
