import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const sections = db.prepare('SELECT * FROM resume_sections WHERE is_active = 1 ORDER BY section_order ASC').all();
  return NextResponse.json(sections);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, content, title } = body;
  
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  const updates: string[] = [];
  const values: (string | number)[] = [];
  
  if (content !== undefined) { updates.push('content = ?'); values.push(typeof content === 'string' ? content : JSON.stringify(content)); }
  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  
  if (updates.length === 0) return NextResponse.json({ error: 'No updates' }, { status: 400 });
  
  updates.push("updated_at = datetime('now')");
  values.push(id);
  
  db.prepare(`UPDATE resume_sections SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  const section = db.prepare('SELECT * FROM resume_sections WHERE id = ?').get(id);
  return NextResponse.json(section);
}
