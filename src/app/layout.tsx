import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { SiteShell } from '../components/layout/site-shell';
import 'katex/dist/katex.min.css';
import './globals.css';

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = DM_Serif_Display({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
export const metadata: Metadata = { title: {default:'AI 学力 × AP CSA — aicsa-openlesson', template:'%s · aicsa-openlesson'}, description:'零基础高中生课程：先学会用 AI 学习，再用这套能力从零攻下 AP Computer Science A。中文讲解 + 英文术语。' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-CN" className={`${sans.variable} ${serif.variable}`}><body><a className="skip-link" href="#main-content">Skip to content</a><SiteShell>{children}</SiteShell></body></html>;
}
