'use client';

import { useEffect, useState } from 'react';

interface AboutMeEntry {
  id: number;
  category: string;
  topic: string;
  details: string;
  proficiency: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['tools', 'skills', 'experience', 'preferences', 'strengths', 'other'];
const PROFICIENCY_LEVELS = ['expert', 'proficient', 'familiar', 'learning', 'none'];
const PROFICIENCY_COLORS: Record<string, string> = {
  expert: 'bg-green-100 text-green-700',
  proficient: 'bg-blue-100 text-blue-700',
  familiar: 'bg-yellow-100 text-yellow-700',
  learning: 'bg-purple-100 text-purple-700',
  none: 'bg-red-100 text-red-700',
};

export default function AboutMePage() {
  const [entries, setEntries] = useState<AboutMeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'tools', topic: '', details: '', proficiency: 'proficient' });
  const [filterCat, setFilterCat] = useState('');

  const load = () => {
    const url = filterCat ? `/api/about-me?category=${filterCat}` : '/api/about-me';
    fetch(url).then(r => r.json()).then(data => { setEntries(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [filterCat]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.details) return;
    await fetch('/api/about-me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ ...form, topic: '', details: '' });
    load();
  };

  const deleteEntry = async (id: number) => {
    await fetch(`/api/about-me?id=${id}`, { method: 'DELETE' });
    load();
  };

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {} as Record<string, AboutMeEntry[]>);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">About Me</h1>
      <p className="text-sm text-gray-500 mb-6">
        Add details about your experience, tools, and skills. This knowledge base is used when tailoring resumes for specific jobs.
        Demerzel will also ask you questions about job requirements to fill gaps here.
      </p>

      {/* Add form */}
      <form onSubmit={addEntry} className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-4 gap-3 mb-3">
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border rounded px-3 py-2 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="border rounded px-3 py-2 text-sm col-span-2" placeholder="Topic (e.g. Snowflake, Python, Team Leadership)" />
          <select value={form.proficiency} onChange={e => setForm({...form, proficiency: e.target.value})} className="border rounded px-3 py-2 text-sm">
            {PROFICIENCY_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <input value={form.details} onChange={e => setForm({...form, details: e.target.value})} className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Details about your experience with this..." />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Add</button>
        </div>
      </form>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterCat('')} className={`text-xs px-3 py-1 rounded-full ${!filterCat ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`text-xs px-3 py-1 rounded-full capitalize ${filterCat === c ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No entries yet. Add your first one above, or Demerzel will ask you questions to fill this in.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">{cat}</h2>
              <div className="space-y-2">
                {items.map(entry => (
                  <div key={entry.id} className="bg-white rounded-lg border p-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{entry.topic}</span>
                        {entry.proficiency && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${PROFICIENCY_COLORS[entry.proficiency] || 'bg-gray-100'}`}>
                            {entry.proficiency}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="text-xs text-red-500 hover:text-red-700 ml-4">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
