import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { ResumeSection } from '@/lib/types';

export async function GET() {
  const sections = db.prepare('SELECT * FROM resume_sections WHERE is_active = 1 ORDER BY section_order ASC').all() as ResumeSection[];

  const sectionMap: Record<string, unknown> = {};
  for (const s of sections) {
    sectionMap[s.section_type] = JSON.parse(s.content);
  }

  const contact = sectionMap.contact as Record<string, string> || {};
  const summary = sectionMap.summary as Record<string, string> || {};
  const experience = (sectionMap.experience || []) as Array<{ company: string; title: string; startDate: string; endDate: string; bullets: string[] }>;
  const skills = sectionMap.skills as { categories: Array<{ name: string; skills: string[] }> } || { categories: [] };
  const education = sectionMap.education as Record<string, string> || {};
  const certifications = sectionMap.certifications as { summary: string; certs: string[] } || { summary: '', certs: [] };
  const projects = (sectionMap.projects || []) as Array<{ name: string; company: string; url: string; date: string; description: string }>;
  const community = (sectionMap.community || []) as Array<{ title: string; org: string; years: string; description?: string }>;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${contact.name || 'Resume'}</title>
  <style>
    @media print { body { margin: 0; } @page { margin: 0.5in; } }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 0.5in; color: #1a1a1a; font-size: 10pt; line-height: 1.4; }
    h1 { font-size: 18pt; margin: 0 0 4px 0; }
    .contact { color: #555; font-size: 9pt; margin-bottom: 12px; }
    .contact a { color: #555; text-decoration: none; }
    h2 { font-size: 11pt; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 14px 0 6px 0; letter-spacing: 0.5px; }
    .summary { font-size: 9.5pt; color: #333; margin-bottom: 8px; }
    .exp-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .exp-title { font-weight: 600; }
    .exp-company { color: #555; }
    .exp-date { color: #777; font-size: 9pt; }
    ul { margin: 2px 0 8px 0; padding-left: 16px; }
    li { font-size: 9.5pt; margin-bottom: 1px; color: #333; }
    .skills-row { display: flex; margin-bottom: 2px; font-size: 9.5pt; }
    .skills-label { font-weight: 600; min-width: 130px; }
    .skills-list { color: #333; }
    .project { margin-bottom: 6px; }
    .project-name { font-weight: 600; }
    .project-meta { color: #777; font-size: 9pt; }
    .project-desc { font-size: 9pt; color: #333; }
    .cert-list { font-size: 9.5pt; color: #333; }
    .print-btn { position: fixed; top: 10px; right: 10px; background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  
  <h1>${contact.name || ''}</h1>
  <div class="contact">
    ${contact.location || ''} · ${contact.email || ''} · ${contact.phone || ''} · ${contact.linkedin || ''} · ${contact.github || ''}
  </div>

  <h2>Summary</h2>
  <div class="summary">${summary.text || ''}</div>

  <h2>Experience</h2>
  ${experience.map(exp => `
    <div>
      <div class="exp-header">
        <div><span class="exp-title">${exp.title}</span> <span class="exp-company">— ${exp.company}</span></div>
        <span class="exp-date">${exp.startDate} - ${exp.endDate}</span>
      </div>
      <ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    </div>
  `).join('')}

  <h2>Skills</h2>
  ${skills.categories.map(c => `
    <div class="skills-row">
      <span class="skills-label">${c.name}:</span>
      <span class="skills-list">${c.skills.join(', ')}</span>
    </div>
  `).join('')}

  <h2>Education</h2>
  <div style="font-size:9.5pt"><strong>${education.degree || ''}</strong> — ${education.school || ''}, ${education.location || ''} (${education.years || ''})</div>

  <h2>Certifications</h2>
  <div class="cert-list"><strong>${certifications.summary}</strong> — ${certifications.certs.join(', ')}</div>

  <h2>Projects</h2>
  ${projects.map(p => `
    <div class="project">
      <span class="project-name">${p.name}</span>${p.company ? ` <span class="project-meta">— ${p.company}</span>` : ''} <span class="project-meta">(${p.date})</span>
      <div class="project-desc">${p.description}</div>
    </div>
  `).join('')}

  <h2>Community & Honors</h2>
  ${community.map(c => `
    <div style="font-size:9.5pt"><strong>${c.title}</strong> — ${c.org} (${c.years})${c.description ? ` · ${c.description}` : ''}</div>
  `).join('')}
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
