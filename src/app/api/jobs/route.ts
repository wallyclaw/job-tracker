import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  let query = 'SELECT * FROM jobs';
  const params: string[] = [];
  
  if (status && status !== 'All') {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const jobs = db.prepare(query).all(...params);
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const stmt = db.prepare(`
    INSERT INTO jobs (title, company, url, original_description, salary_min, salary_max, salary_currency, location, remote_type, status, date_found, date_applied, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    body.title,
    body.company,
    body.url || null,
    body.original_description || null,
    body.salary_min || null,
    body.salary_max || null,
    body.salary_currency || 'USD',
    body.location || null,
    body.remote_type || null,
    body.status || 'Saved',
    body.date_found || new Date().toISOString().split('T')[0],
    body.date_applied || null,
    body.notes || null,
  );
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(job, { status: 201 });
}
