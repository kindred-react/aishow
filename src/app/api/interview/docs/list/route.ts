import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Document {
  slug: string;
  title: string;
  description: string;
  category: string;
}

export async function GET() {
  try {
    const docsDirectory = path.join(process.cwd(), 'public', 'md');
    const documents: Document[] = [];

    const entries = fs.readdirSync(docsDirectory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(docsDirectory, entry.name);

      if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace('.md', '');
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        documents.push({
          slug,
          title: data.title || slug,
          description: data.description || '',
          category: data.category || '根目录',
        });
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('node_modules')) {
        const subFiles = fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));

        for (const subFile of subFiles) {
          const subSlug = `${entry.name}/${subFile.replace('.md', '')}`;
          const subFullPath = path.join(fullPath, subFile);
          const fileContents = fs.readFileSync(subFullPath, 'utf8');
          const { data } = matter(fileContents);

          documents.push({
            slug: subSlug,
            title: data.title || subFile.replace('.md', ''),
            description: data.description || '',
            category: data.category || entry.name,
          });
        }
      }
    }

    documents.sort((a, b) => a.slug.localeCompare(b.slug, 'zh-CN', { numeric: true }));

    const categories = [...new Set(documents.map(doc => doc.category))];

    return NextResponse.json({ documents, categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load documents', details: String(error) }, { status: 500 });
  }
}