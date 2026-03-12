import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const { versionId } = await params;
  const version = db.prepare('SELECT * FROM resume_versions WHERE id = ?').get(versionId);
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(version);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const { versionId } = await params;
  const body = await request.json();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body.sections !== undefined) { updates.push('sections = ?'); values.push(typeof body.sections === 'string' ? body.sections : JSON.stringify(body.sections)); }
  if (body.version_name !== undefined) { updates.push('version_name = ?'); values.push(body.version_name); }
  if (body.tailoring_notes !== undefined) { updates.push('tailoring_notes = ?'); values.push(body.tailoring_notes); }
  if (body.page_break_before !== undefined) { updates.push('page_break_before = ?'); values.push(body.page_break_before); }

  if (updates.length === 0) return NextResponse.json({ error: 'No updates' }, { status: 400 });
  values.push(versionId);

  db.prepare(`UPDATE resume_versions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const version = db.prepare('SELECT * FROM resume_versions WHERE id = ?').get(versionId);
  return NextResponse.json(version);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const { versionId } = await params;
  db.prepare('DELETE FROM resume_versions WHERE id = ?').run(versionId);
  return NextResponse.json({ ok: true });
}
