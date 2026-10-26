import Link from 'next/link';
import { BookOpen, Sparkles } from 'lucide-react';
import { getLessons } from '../../lib/content';
import { CourseNav, MobileMenu, ProgressFooter } from './course-nav';

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const lessons = (await getLessons()).map(({ id, slug, title, group }) => ({ id, slug, title, group }));
  const lessonIds = lessons.map((lesson) => lesson.id);
  return <div className="app-shell">
    <aside className="sidebar"><Link href="/" className="brand"><span className="brand-icon"><Sparkles size={21}/></span> aicsa-openlesson<span className="brand-dot">.</span></Link>
      <div className="workspace-label">THE AI LEARNING FRAMEWORK</div>
      <CourseNav lessons={lessons} label="Main navigation"/>
      <div className="sidebar-bottom"><ProgressFooter lessonIds={lessonIds}/></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Learning studio</strong></div><div className="topbar-right"><span className="tag"><span className="status-dot"/> A space for curious minds</span><Link className="icon-link" href="/authoring" aria-label="Open authoring guide"><BookOpen size={18}/></Link></div>
      <MobileMenu lessons={lessons} lessonIds={lessonIds}/>
    </header><main id="main-content">{children}</main><footer className="footer"><span>课程原文以 <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh">CC BY-NC-SA 4.0</a> 发布。AP 与 College Board 为其权利人所有。</span><span>aicsa-openlesson <span className="footer-star">✳</span> Start curious. Keep going.</span></footer></div>
  </div>;
}
