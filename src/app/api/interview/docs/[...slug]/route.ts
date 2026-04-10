import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Parent } from 'unist';

function rehypeCodeBlockCollapse() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index: number | undefined, parent: Parent | undefined) => {
      if (node.tagName === 'pre' && typeof index === 'number' && parent) {
        const codeNode = node.children.find(
          (child): child is Element =>
            child.type === 'element' && child.tagName === 'code'
        );

        if (codeNode && parent) {
          const className = codeNode.properties?.className as string[] | undefined;
          const language = Array.isArray(className) && className[0]
            ? className[0].replace('language-', '')
            : '代码';

          const detailsNode: Element = {
            type: 'element',
            tagName: 'details',
            properties: { className: ['code-block'] },
            children: [
              {
                type: 'element',
                tagName: 'summary',
                properties: { className: ['code-summary'] },
                children: [{ type: 'text', value: `📋 ${language}` }],
              },
              node,
            ],
          };

          parent.children.splice(index, 1, detailsNode);
        }
      }
    });
  };
}

const docsDirectory = path.join(process.cwd(), 'public', 'md');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const slugPath = Array.isArray(slug) ? slug.join('/') : slug;

    let fullPath = path.join(docsDirectory, `${slugPath}.md`);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(docsDirectory, slugPath.replace('/', '/'));
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeHighlight)
      .use(rehypeCodeBlockCollapse)
      .use(rehypeStringify)
      .process(content);

    const contentHtml = processedContent.toString();

    return NextResponse.json({
      title: data.title || slugPath,
      contentHtml,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load document', details: String(error) },
      { status: 500 }
    );
  }
}