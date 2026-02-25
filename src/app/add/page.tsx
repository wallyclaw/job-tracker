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
      // Auto-parse if description provided
      if (form.original_description) {
        await fetch(`/api/jobs/${job.id}/parse`, { method: 'POST' });
      }
      router.push(`/jobs/${job.id}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="GTM Systems Engineer" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <input required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Grafana Labs" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Job URL</label>
          <input value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Salary Min ($)</label>
            <input type="number" value={form.salary_min} onChange={e => setForm({...form, salary_min: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="175000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salary Max ($)</label>
            <input type="number" value={form.salary_max} onChange={e => setForm({...form, salary_max: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="210000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Remote, US" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Work Type</label>
            <select value={form.remote_type} onChange={e => setForm({...form, remote_type: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Job Description (paste full text — will be auto-parsed)</label>
          <textarea value={form.original_description} onChange={e => setForm({...form, original_description: e.target.value})} rows={12} className="w-full border rounded px-3 py-2 text-sm font-mono" placeholder="Paste the full job description here..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full border rounded px-3 py-2 text-sm" placeholder="Any notes..." />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Job'}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
