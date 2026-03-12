import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import type { ResumeSection } from '@/lib/types';

// GET all resume versions for a job
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const versions = db.prepare('SELECT * FROM resume_versions WHERE job_id = ? ORDER BY created_at DESC').all(id);
  return NextResponse.json(versions);
}

// POST create a tailored resume version for a job
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  // Get base resume sections
  const baseSections = db.prepare('SELECT * FROM resume_sections WHERE is_active = 1 ORDER BY section_order ASC').all() as ResumeSection[];

  // Get about_me knowledge for richer tailoring
  const aboutMe = db.prepare('SELECT * FROM about_me ORDER BY category, topic').all();

  // If custom sections provided, use those; otherwise clone base
  const sections = body.sections || baseSections.map((s: ResumeSection) => ({
    section_type: s.section_type,
    title: s.title,
    content: s.content,
  }));

  const result = db.prepare(
    'INSERT INTO resume_versions (job_id, version_name, sections, tailoring_notes, page_break_before) VALUES (?, ?, ?, ?, ?)'
  ).run(
    id,
    body.version_name || `Tailored for Job #${id}`,
    JSON.stringify(sections),
    body.tailoring_notes || null,
    body.page_break_before || 'certifications',
  );

  const version = db.prepare('SELECT * FROM resume_versions WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ version, aboutMe }, { status: 201 });
}
