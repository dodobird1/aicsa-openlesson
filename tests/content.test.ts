import { describe, expect, it } from 'vitest';
import { getHeadings, getLessons, parseLesson } from '../src/lib/content';
import { safeMediaUrl } from '../src/components/lesson/media';
describe('lesson authoring',()=>{
  it('loads the published course without publishing its template',async()=>{const lessons=await getLessons();expect(lessons.length).toBeGreaterThan(0);expect(lessons.map((l)=>l.slug)).not.toContain('_template');expect(lessons.map((l)=>l.slug)).not.toContain('bank-grading-guide');expect(new Set(lessons.map((l)=>l.id)).size).toBe(lessons.length);});
  it('parses and validates metadata',()=>{const lesson=parseLesson('---\nid: sample\ntitle: Sample\norder: 2\n---\n## Hello','sample');expect(lesson.group).toBe('Lessons');expect(lesson.source).toContain('## Hello');});
  it('rejects invalid IDs and missing metadata',()=>{expect(()=>parseLesson('---\nid: Bad ID\ntitle: Test\norder: 1\n---','test')).toThrow();expect(()=>parseLesson('No metadata','test')).toThrow();});
  it('ignores fenced headings and matches rendered heading ids',()=>{
    expect(getHeadings('## Real\n```md\n## Fake\n```\n## Next').map(h=>h.title)).toEqual(['Real','Next']);
    expect(getHeadings('## Read [the guide](/authoring)\n> ## Quoted idea\n### Intro\n## Intro').map(h=>[h.title,h.id])).toEqual([['Read the guide','read-the-guide'],['Quoted idea','quoted-idea'],['Intro','intro-1']]);
    expect(getHeadings('## The $x^2$ case')[0]).toMatchObject({title:'The x^2 case',id:'the-x2-case'});
  });
});
describe('media URL policy',()=>{
  it('accepts local paths and HTTPS',()=>{expect(safeMediaUrl('/media/test.png')).toBe('/media/test.png');expect(safeMediaUrl('https://example.com/a')).toBe('https://example.com/a');});
  it('rejects executable, ambiguous, and traversing URLs',()=>{for(const value of ['javascript:alert(1)','//evil.com','/\\evil.com','data:text/html,test','http://example.com','/media/../../secret','/media/%2e%2e/secret'])expect(()=>safeMediaUrl(value)).toThrow();});
});
