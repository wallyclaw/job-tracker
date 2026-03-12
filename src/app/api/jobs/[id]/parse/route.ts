import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Job, ResumeSection } from '@/lib/types';
import { parseJobDescription, analyzeMatch } from '@/lib/parser';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined;

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!job.original_description) return NextResponse.json({ error: 'No description to parse' }, { status: 400 });

  // Parse the job description
  const parsed = parseJobDescription(job.original_description);

  // Get resume skills for match analysis
  const skillsSection = db.prepare("SELECT content FROM resume_sections WHERE section_type = 'skills'").get() as { content: string } | undefined;
  const allResumeSkills: string[] = [];
  if (skillsSection) {
    const skills = JSON.parse(skillsSection.content);
    for (const cat of skills.categories) {
      allResumeSkills.push(...cat.skills);
    }
  }

  // Get about-me knowledge
  const aboutMe = db.prepare('SELECT topic, details, proficiency FROM about_me').all() as Array<{ topic: string; details: string; proficiency: string | null }>;

  // Analyze match
  const match = analyzeMatch(parsed.keySkills, allResumeSkills, aboutMe, job.original_description);

  // Save parsed data
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
    match.score,
    JSON.stringify(match),
    id,
  );

  // Auto-create a tailored resume version
  const baseSections = db.prepare('SELECT * FROM resume_sections WHERE is_active = 1 ORDER BY section_order ASC').all() as ResumeSection[];

  // Check if a version already exists for this job
  const existingVersion = db.prepare('SELECT id FROM resume_versions WHERE job_id = ?').get(id);

  if (!existingVersion) {
    // Clone base resume and apply tailoring based on match analysis
    const tailoredSections = baseSections.map((s: ResumeSection) => {
      const content = JSON.parse(s.content);

      if (s.section_type === 'skills' && match.matchedAboutMe.length > 0) {
        // Add skills from About Me that are proficient+ but not on resume
        const toAdd = match.matchedAboutMe
          .filter(a => a.proficiency === 'expert' || a.proficiency === 'proficient')
          .map(a => a.topic);

        if (toAdd.length > 0 && content.categories) {
          // Add to a "Highlighted for this role" category or existing relevant one
          content.categories.push({
            name: 'Additional Relevant',
            skills: toAdd,
          });
        }
      }

      return {
        section_type: s.section_type,
        title: s.title,
        content: JSON.stringify(content),
      };
    });

    const tailoringNotes = [
      `Auto-generated for ${job.company} - ${job.title}`,
      `Match score: ${match.score}%`,
      match.tailoringTips.length > 0 ? `Tips: ${match.tailoringTips.join('; ')}` : '',
      match.gapSkills.length > 0 ? `Gaps to address: ${match.gapSkills.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    db.prepare(
      'INSERT INTO resume_versions (job_id, version_name, sections, tailoring_notes) VALUES (?, ?, ?, ?)'
    ).run(
      id,
      `${job.company} - ${job.title}`,
      JSON.stringify(tailoredSections),
      tailoringNotes,
    );
  }

  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return NextResponse.json(updated);
}
