import fs from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { parseDocument } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import { z } from 'zod';

export const metadataSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1), description: z.string().default(''),
  order: z.number().int().nonnegative(), group: z.string().default('Lessons'),
  minutes: z.number().int().positive().optional(),
});
export type LessonMeta = z.infer<typeof metadataSchema>;
export type Lesson = LessonMeta & { slug: string; source: string };
export function parseLesson(input: string, slug: string): Lesson {
  const raw = input.replace(/^\uFEFF/, '');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing lesson frontmatter: ${slug}`);
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length) throw new Error(`Invalid lesson frontmatter: ${slug}`);
  const data: unknown = document.toJS({ maxAliasCount: 20 });
  return { ...metadataSchema.parse(data), slug, source: raw.slice(match[0].length) };
}
export const getLessons = cache(async function getLessons(): Promise<Lesson[]> {
  const dir = path.join(process.cwd(), 'content/lessons');
  let files: string[];
  try { files = await fs.readdir(dir); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const lessons = await Promise.all(files.filter(f => f.endsWith('.mdx') && !f.startsWith('_')).map(async file => {
    const slug = file.slice(0, -4);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid lesson filename: ${file}`);
    return parseLesson(await fs.readFile(path.join(dir, file), 'utf8'), slug);
  }));
  if (new Set(lessons.map(l => l.id)).size !== lessons.length) throw new Error('Lesson IDs must be unique.');
  assertUniqueExerciseIds(lessons.map(l => ({ name: `content/lessons/${l.slug}.mdx`, source: l.source })));
  return lessons.sort((a,b) => a.order-b.order || a.title.localeCompare(b.title));
});

interface MarkdownNode { type: string; value?: string; depth?: number; children?: MarkdownNode[] }
function headingText(node: MarkdownNode): string {
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'inlineMath' || node.type === 'math') return node.value ?? '';
  return (node.children ?? []).map(headingText).join('');
}
/** Slug every heading, in order, so repeated names match the rendered ids. */
export function getHeadings(source: string): { title: string; id: string }[] {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(source);
  const slugger = new GithubSlugger();
  const headings: { title: string; id: string }[] = [];
  visit(tree, 'heading', (node) => {
    const heading = node as MarkdownNode;
    const title = headingText(heading).replace(/\s+/g, ' ').trim();
    const id = slugger.slug(title);
    if (heading.depth === 2 && title) headings.push({ title, id });
  });
  return headings;
}

/** Exercise ids are browser-storage keys, so collect them from rendered components only. */
export function exerciseIdsFromSource(source: string): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(source);
  const ids: string[] = [];
  visit(tree, 'html', (node) => {
    for (const match of ((node as MarkdownNode).value ?? '').matchAll(/<(?:MultipleChoice|LLMPractice|CodeExercise|ParsonsProblem|FillBlank|VibeCoding)\b[^>]*?\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      const id = match[1] ?? match[2];
      if (id) ids.push(id);
    }
  });
  return ids;
}
/** Fail fast when two exercises share an id, which would overwrite each other's saved progress. */
export function assertUniqueExerciseIds(pages: { name: string; source: string }[]): void {
  const seen = new Map<string, string>();
  for (const page of pages) for (const id of exerciseIdsFromSource(page.source)) {
    const first = seen.get(id);
    if (first) throw new Error(`Exercise IDs must be unique across the site: "${id}" is used in both ${first} and ${page.name}.`);
    seen.set(id, page.name);
  }
}
