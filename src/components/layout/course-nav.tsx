'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, BookOpen, Braces, Compass, Layers3 } from 'lucide-react';
import { LessonStatus, ProgressSummary, ResetProgress } from '../progress/progress-controls';

export interface NavLesson { id: string; slug: string; title: string; group: string }

function current(pathname: string, href: string) {
  return pathname === href ? 'page' as const : undefined;
}

export function CourseNav({ lessons, label }: { lessons: NavLesson[]; label: string }) {
  const pathname = usePathname();
  const blocks: { group: string; lessons: NavLesson[] }[] = [];
  for (const lesson of lessons) {
    const last = blocks.at(-1);
    if (!last || last.group !== lesson.group) blocks.push({ group: lesson.group, lessons: [lesson] });
    else last.lessons.push(lesson);
  }
  return <nav aria-label={label}>
    <div className="nav-caption">YOUR WORKSPACE</div>
    <Link className="nav-link" href="/" aria-current={current(pathname, '/')}><Compass size={18}/> Overview</Link>
    <div className="nav-caption course-caption">COURSE CONTENT <span>{lessons.length.toString().padStart(2, '0')}</span></div>
    {lessons.length === 0 && <div className="empty-nav"><BookOpen size={19}/><p>A little room to grow.</p><span>Your lessons will appear here.</span></div>}
    {blocks.map((block) => <div key={block.lessons[0].id}><div className="nav-group">{block.group}</div>{block.lessons.map((lesson) => <Link key={lesson.id} className="nav-link lesson-link" href={`/lessons/${lesson.slug}`} aria-current={current(pathname, `/lessons/${lesson.slug}`)}><LessonStatus id={lesson.id}/><span>{lesson.title}</span></Link>)}</div>)}
    <div className="nav-caption">AUTHOR TOOLS</div>
    <Link className="nav-link" href="/showcase" aria-current={current(pathname, '/showcase')}><Layers3 size={18}/> Component showcase <ArrowUpRight size={13}/></Link>
    <Link className="nav-link" href="/authoring" aria-current={current(pathname, '/authoring')}><Braces size={18}/> Authoring guide</Link>
  </nav>;
}

export function ProgressFooter({ lessonIds }: { lessonIds: string[] }) {
  return <div className="progress-footer"><ProgressSummary lessonIds={lessonIds}/><ResetProgress/><div className="local-note"><span className="status-dot"/> Saved on this device</div></div>;
}

export function MobileMenu({ lessons, lessonIds }: { lessons: NavLesson[]; lessonIds: string[] }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  return <details ref={menu} className="mobile-menu"><summary>Menu</summary><CourseNav lessons={lessons} label="Mobile navigation"/><ProgressFooter lessonIds={lessonIds}/></details>;
}
