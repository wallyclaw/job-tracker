import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Job } from '@/lib/types';

// Simple regex-based parser (no external AI API needed — works offline)
function parseJobDescription(description: string) {
  const sections = {
    requirements: [] as string[],
    responsibilities: [] as string[],
    preferred: [] as string[],
    companyInfo: '',
    compensation: '',
  };

  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentSection = '';
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    // Detect section headers
    if (lower.match(/^(requirements|qualifications|what you.?ll need|what we.?re looking for|must have|minimum qualifications)/)) {
      currentSection = 'requirements';
      continue;
    }
    if (lower.match(/^(responsibilities|what you.?ll do|what you.?ll be doing|the role|job description|about the role)/)) {
      currentSection = 'responsibilities';
      continue;
    }
    if (lower.match(/^(preferred|nice to have|bonus|ideal|plus|desired)/)) {
      currentSection = 'preferred';
      continue;
    }
    if (lower.match(/^(about the company|about us|who we are|company)/)) {
      currentSection = 'company';
      continue;
    }
    if (lower.match(/^(compensation|salary|pay|benefits|perks)/)) {
      currentSection = 'compensation';
      continue;
    }
    
    // Add content to current section
    const bullet = line.replace(/^[-•·*]\s*/, '').trim();
    if (!bullet) continue;
    
    switch (currentSection) {
      case 'requirements':
        sections.requirements.push(bullet);
        break;
      case 'responsibilities':
        sections.responsibilities.push(bullet);
        break;
      case 'preferred':
        sections.preferred.push(bullet);
        break;
      case 'company':
        sections.companyInfo += (sections.companyInfo ? ' ' : '') + bullet;
        break;
      case 'compensation':
        sections.compensation += (sections.compensation ? ' ' : '') + bullet;
        break;
    }
  }

  // Extract salary from description if not in sections
  if (!sections.compensation) {
    const salaryMatch = description.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per year|annually|\/year|base))?/i);
    if (salaryMatch) sections.compensation = salaryMatch[0];
  }

  return sections;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined;
  
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!job.original_description) return NextResponse.json({ error: 'No description to parse' }, { status: 400 });
  
  const parsed = parseJobDescription(job.original_description);
  
  // Get resume skills for match analysis
  const skillsSection = db.prepare("SELECT content FROM resume_sections WHERE section_type = 'skills'").get() as { content: string } | undefined;
  let matchScore = 0;
  let matchAnalysis = '';
  
  if (skillsSection) {
    const skills = JSON.parse(skillsSection.content);
    const allSkills = skills.categories.flatMap((c: { skills: string[] }) => c.skills).map((s: string) => s.toLowerCase());
    const descLower = job.original_description.toLowerCase();
    
    const matched = allSkills.filter((s: string) => descLower.includes(s.toLowerCase()));
    const missing = allSkills.filter((s: string) => !descLower.includes(s.toLowerCase()));
    
    matchScore = Math.round((matched.length / allSkills.length) * 100);
    matchAnalysis = JSON.stringify({ matched, missing, score: matchScore });
  }
  
  db.prepare(`
    UPDATE jobs SET 
      parsed_requirements = ?,
      parsed_responsibilities = ?,
      parsed_preferred = ?,
      parsed_company_info = ?,
      parsed_compensation = ?,
      parsed_match_score = ?,
      parsed_match_analysis = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    JSON.stringify(parsed.requirements),
    JSON.stringify(parsed.responsibilities),
    JSON.stringify(parsed.preferred),
    parsed.companyInfo,
    parsed.compensation,
    matchScore,
    matchAnalysis,
    id,
  );
  
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return NextResponse.json(updated);
}
