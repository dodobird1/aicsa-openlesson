import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getHeadings, getLessons } from '../../../lib/content';
import { RenderMDX } from '../../../components/lesson/render-mdx';
import { LessonComplete } from '../../../components/progress/progress-controls';
export async function generateStaticParams(){return (await getLessons()).map(l=>({slug:l.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {const {slug}=await params;const lesson=(await getLessons()).find(l=>l.slug===slug);return {title:lesson?.title||'Lesson not found'};}
export default async function LessonPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;const lessons=await getLessons();const index=lessons.findIndex(l=>l.slug===slug);const lesson=lessons[index];if(!lesson)notFound();
  const headings = getHeadings(lesson.source);
  return <div className="page document-page"><header className="document-header"><span className="eyebrow">{lesson.group} / {String(index+1).padStart(2,'0')}{lesson.minutes?` · ${lesson.minutes} MIN READ`:''}</span><h1>{lesson.title}</h1><p>{lesson.description}</p></header><div className="document-layout"><article className="prose"><RenderMDX source={lesson.source}/><div className="lesson-bottom"><LessonComplete id={lesson.id}/><span className="muted">Progress is saved on this device.</span></div><nav className="lesson-pagination" aria-label="Lesson navigation">{index>0?<Link href={`/lessons/${lessons[index-1].slug}`}><ArrowLeft size={13}/> {lessons[index-1].title}</Link>:<span/>}{index<lessons.length-1&&<Link href={`/lessons/${lessons[index+1].slug}`}>{lessons[index+1].title} <ArrowRight size={13}/></Link>}</nav></article><nav className="toc" aria-label="On this page"><strong>ON THIS PAGE</strong>{headings.map(h=><a key={h.id} href={`#${h.id}`}>{h.title}</a>)}</nav></div></div>;
}
