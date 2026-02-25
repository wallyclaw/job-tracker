import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  
  const fields = Object.keys(body).filter(k => k !== 'id');
  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => body[f]);
  
  db.prepare(`UPDATE jobs SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return NextResponse.json(job);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
