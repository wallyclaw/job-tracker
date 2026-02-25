'use client';

import { useEffect, useState } from 'react';
import type { ResumeSection } from '@/lib/types';

export default function ResumePage() {
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/resume').then(r => r.json()).then(data => { setSections(data); setLoading(false); });
  }, []);

  const startEdit = (section: ResumeSection) => {
    setEditing(section.id);
    setEditContent(section.content);
  };

  const saveEdit = async (id: number) => {
    // Validate JSON
    try {
      JSON.parse(editContent);
    } catch {
      alert('Invalid JSON. Please check your edits.');
      return;
    }

    await fetch('/api/resume', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: editContent }),
    });

    setSections(sections.map(s => s.id === id ? { ...s, content: editContent } : s));
    setEditing(null);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resume Builder</h1>
        <a href="/api/resume/preview" target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Preview PDF ↗</a>
      </div>

      <div className="space-y-4">
        {sections.map(section => {
          const content = JSON.parse(section.content);
          return (
            <div key={section.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold capitalize">{section.title || section.section_type}</h2>
                <button
                  onClick={() => editing === section.id ? saveEdit(section.id) : startEdit(section)}
                  className={`text-xs px-3 py-1 rounded ${editing === section.id ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {editing === section.id ? 'Save' : 'Edit'}
                </button>
              </div>

              {editing === section.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={15}
                    className="w-full border rounded px-3 py-2 text-sm font-mono"
                  />
                  <button onClick={() => setEditing(null)} className="text-xs text-gray-500 mt-1">Cancel</button>
                </div>
              ) : (
                <ResumePreview type={section.section_type} content={content} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResumePreview({ type, content }: { type: string; content: Record<string, unknown> }) {
  switch (type) {
    case 'contact':
      return (
        <div className="text-sm text-gray-600 flex flex-wrap gap-4">
          <span>{content.name as string}</span>
          <span>📍 {content.location as string}</span>
          <span>✉️ {content.email as string}</span>
          <span>📱 {content.phone as string}</span>
          <span>💼 {content.linkedin as string}</span>
          <span>🐱 {content.github as string}</span>
        </div>
      );
    case 'summary':
      return <p className="text-sm text-gray-600">{content.text as string}</p>;
    case 'experience':
      return (
        <div className="space-y-3">
          {(content as unknown as Array<{ company: string; title: string; startDate: string; endDate: string; bullets: string[] }>).map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <div>
                  <span className="font-medium text-sm">{exp.title}</span>
                  <span className="text-sm text-gray-500"> — {exp.company}</span>
                </div>
                <span className="text-xs text-gray-400">{exp.startDate} - {exp.endDate}</span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.map((b: string, j: number) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-gray-300">•</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case 'skills':
      return (
        <div className="space-y-2">
          {(content as unknown as { categories: Array<{ name: string; skills: string[] }> }).categories.map((cat, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="font-medium text-gray-700 min-w-[120px]">{cat.name}:</span>
              <span className="text-gray-600">{cat.skills.join(', ')}</span>
            </div>
          ))}
        </div>
      );
    case 'education':
      return (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{content.degree as string}</span> — {content.school as string} ({content.years as string})
        </div>
      );
    case 'certifications':
      return (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{content.summary as string}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {(content as unknown as { certs: string[] }).certs.map((c: string, i: number) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c}</span>
            ))}
          </div>
        </div>
      );
    case 'projects':
      return (
        <div className="space-y-2">
          {(content as unknown as Array<{ name: string; company: string; date: string; description: string }>).map((p, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{p.name}</span>
              {p.company && <span className="text-gray-500"> — {p.company}</span>}
              <span className="text-xs text-gray-400 ml-2">{p.date}</span>
              <p className="text-xs text-gray-600 mt-0.5">{p.description}</p>
            </div>
          ))}
        </div>
      );
    case 'community':
      return (
        <div className="space-y-1">
          {(content as unknown as Array<{ title: string; org: string; years: string }>).map((c, i) => (
            <div key={i} className="text-sm text-gray-600">
              <span className="font-medium">{c.title}</span> — {c.org} ({c.years})
            </div>
          ))}
        </div>
      );
    default:
      return <pre className="text-xs text-gray-500">{JSON.stringify(content, null, 2)}</pre>;
  }
}
