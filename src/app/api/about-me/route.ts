import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = 'SELECT * FROM about_me';
  const params: string[] = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY category, topic';
  const entries = db.prepare(query).all(...params);
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.category || !body.topic || !body.details) {
    return NextResponse.json({ error: 'category, topic, and details required' }, { status: 400 });
  }

  // Upsert — if same category+topic exists, update it
  const existing = db.prepare('SELECT id FROM about_me WHERE category = ? AND topic = ?').get(body.category, body.topic) as { id: number } | undefined;

  if (existing) {
    db.prepare("UPDATE about_me SET details = ?, proficiency = ?, updated_at = datetime('now') WHERE id = ?").run(
      body.details, body.proficiency || null, existing.id
    );
    const updated = db.prepare('SELECT * FROM about_me WHERE id = ?').get(existing.id);
    return NextResponse.json(updated);
  }

  const result = db.prepare(
    'INSERT INTO about_me (category, topic, details, proficiency) VALUES (?, ?, ?, ?)'
  ).run(body.category, body.topic, body.details, body.proficiency || null);

  const entry = db.prepare('SELECT * FROM about_me WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.prepare('DELETE FROM about_me WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
