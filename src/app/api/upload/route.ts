import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) || 'misc';
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const safeFolder = folder.replace(/[^a-z_]/gi, '');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const id = crypto.randomBytes(8).toString('hex');
  const filename = `${Date.now()}-${id}.${ext}`;
  const userDir = path.join(process.cwd(), 'public', 'uploads', user.id, safeFolder);
  await mkdir(userDir, { recursive: true });
  const filepath = path.join(userDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, bytes);
  const url = `/uploads/${user.id}/${safeFolder}/${filename}`;
  return NextResponse.json({ url });
}
