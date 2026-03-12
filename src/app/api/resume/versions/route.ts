import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all resume versions across all jobs
export async function GET() {
  const versions = db.prepare(`
    SELECT rv.*, j.title as job_title, j.company as job_company
    FROM resume_versions rv
    JOIN jobs j ON rv.job_id = j.id
    ORDER BY rv.created_at DESC
  `).all();
  return NextResponse.json(versions);
}
