import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import type { ResumeSection } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get('versionId');

  let sectionMap: Record<string, unknown> = {};
  let pageBreakBefore = searchParams.get('pageBreakBefore') || 'certifications';

  if (versionId) {
    const version = db.prepare('SELECT * FROM resume_versions WHERE id = ?').get(versionId) as { sections: string; page_break_before: string | null } | undefined;
    if (!version) return new NextResponse('Version not found', { status: 404 });
    const versionSections = JSON.parse(version.sections);
    for (const s of versionSections) {
      const content = typeof s.content === 'string' ? JSON.parse(s.content) : s.content;
      sectionMap[s.section_type] = content;
    }
    if (version.page_break_before) pageBreakBefore = version.page_break_before;
  } else {
    const sections = db.prepare('SELECT * FROM resume_sections WHERE is_active = 1 ORDER BY section_order ASC').all() as ResumeSection[];
    for (const s of sections) {
      sectionMap[s.section_type] = JSON.parse(s.content);
    }
  }

  const contact = sectionMap.contact as Record<string, string> || {};
  const summary = sectionMap.summary as Record<string, string> || {};
  const experience = (sectionMap.experience || []) as Array<{ company: string; title: string; startDate: string; endDate: string; bullets: string[] }>;
  const skills = sectionMap.skills as { categories: Array<{ name: string; skills: string[] }> } || { categories: [] };
  const education = sectionMap.education as Record<string, string> || {};
  const certifications = sectionMap.certifications as { summary: string; certs: string[] } || { summary: '', certs: [] };
  const projects = (sectionMap.projects || []) as Array<{ name: string; company: string; url: string; date: string; description: string }>;
  const community = (sectionMap.community || []) as Array<{ title: string; org: string; years: string; description?: string }>;

  // Build sections in order, marking which one gets the page break
  const sectionOrder = ['summary', 'experience', 'skills', 'education', 'certifications', 'projects', 'community'];

  const renderSection = (type: string): string => {
    const pageBreak = type === pageBreakBefore ? ' page-break-before' : '';
    switch (type) {
      case 'summary':
        return `<div class="section${pageBreak}"><h2>Summary</h2><div class="summary">${summary.text || ''}</div></div>`;
      case 'experience':
        return `<div class="section${pageBreak}"><h2>Experience</h2>${experience.map(exp => `
          <div class="exp-block">
            <div class="exp-header">
              <div><span class="exp-title">${exp.title}</span> <span class="exp-company">— ${exp.company}</span></div>
              <span class="exp-date">${exp.startDate} - ${exp.endDate}</span>
            </div>
            <ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
          </div>`).join('')}</div>`;
      case 'skills':
        return `<div class="section${pageBreak}"><h2>Skills</h2>${skills.categories.map(c => `
          <div class="skills-row">
            <span class="skills-label">${c.name}:</span>
            <span class="skills-list">${c.skills.join(', ')}</span>
          </div>`).join('')}</div>`;
      case 'education':
        return `<div class="section${pageBreak}"><h2>Education</h2>
          <div style="font-size:9.5pt"><strong>${education.degree || ''}</strong> — ${education.school || ''}, ${education.location || ''} (${education.years || ''})</div></div>`;
      case 'certifications':
        return `<div class="section${pageBreak}"><h2>Certifications</h2>
          <div class="cert-list"><strong>${certifications.summary}</strong> — ${certifications.certs.join(', ')}</div></div>`;
      case 'projects':
        return `<div class="section${pageBreak}"><h2>Projects</h2>${projects.map(p => `
          <div class="project">
            <span class="project-name">${p.name}</span>${p.company ? ` <span class="project-meta">— ${p.company}</span>` : ''} <span class="project-meta">(${p.date})</span>
            <div class="project-desc">${p.description}</div>
          </div>`).join('')}</div>`;
      case 'community':
        return `<div class="section${pageBreak}"><h2>Community & Honors</h2>${community.map(c => `
          <div style="font-size:9.5pt"><strong>${c.title}</strong> — ${c.org} (${c.years})${c.description ? ` · ${c.description}` : ''}</div>`).join('')}</div>`;
      default:
        return '';
    }
  };

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${contact.name || 'Resume'}</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    @media print {
      body { margin: 0; }
      .print-controls { display: none !important; }
      .page-break-before { break-before: page; page-break-before: always; }
    }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 0.5in; color: #1a1a1a; font-size: 10pt; line-height: 1.4; }
    h1 { font-size: 18pt; margin: 0 0 4px 0; }
    .contact { color: #555; font-size: 9pt; margin-bottom: 12px; }
    .contact a { color: #555; text-decoration: none; }
    h2 { font-size: 11pt; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 14px 0 6px 0; letter-spacing: 0.5px; }
    .summary { font-size: 9.5pt; color: #333; margin-bottom: 8px; }
    .exp-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .exp-title { font-weight: 600; }
    .exp-company { color: #555; }
    .exp-date { color: #777; font-size: 9pt; white-space: nowrap; }
    .exp-block { margin-bottom: 4px; }
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
    .page-break-before { break-before: page; page-break-before: always; }
    .print-controls { position: fixed; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 100; }
    .print-btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  </div>
  
  <h1>${contact.name || ''}</h1>
  <div class="contact">
    ${contact.location || ''} · ${contact.email || ''} · ${contact.phone || ''} · ${contact.linkedin || ''} · ${contact.github || ''}
  </div>

  ${sectionOrder.map(s => renderSection(s)).join('\n')}
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
