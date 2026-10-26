import { Download as DownloadIcon, Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';

export function safeMediaUrl(src:string):string {
  if (src.startsWith('/') && !src.startsWith('//') && !/[\\\u0000-\u0020]/.test(src)) {
    let decoded = src;
    try { decoded = decodeURIComponent(src); } catch { throw new Error('Media sources must be local absolute paths or HTTPS URLs.'); }
    const pathOnly = decoded.split(/[?#]/)[0];
    if (!pathOnly.split('/').includes('..')) return src;
  }
  try {const url = new URL(src); if(url.protocol === 'https:' && !url.username && !url.password) return url.href;} catch {}
  throw new Error('Media sources must be local absolute paths or HTTPS URLs.');
}
export function Callout({title='A little note',children}:{title?:string;children:ReactNode}) {
  return <aside className="callout"><Lightbulb size={18}/><div><strong>{title}</strong><div>{children}</div></div></aside>;
}
export function Disclosure({title,children}:{title:string;children:ReactNode}) {return <details className="disclosure"><summary>{title}</summary>{children}</details>;}
export function Image({src,alt,caption,width,height}:{src:string;alt:string;caption?:string;width?:number;height?:number}) {
  return <figure className="media-figure">
    {/* Native images deliberately support arbitrary author-owned HTTPS media and animated GIFs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={safeMediaUrl(src)} alt={alt} width={width} height={height} loading="lazy"/>
    {caption&&<figcaption>{caption}</figcaption>}
  </figure>;
}
export function Video({src,title,poster,captions,transcript}:{src:string;title:string;poster?:string;captions?:string;transcript?:string}) {
  return <figure className="media-figure"><video controls preload="metadata" aria-label={title} poster={poster?safeMediaUrl(poster):undefined}><source src={safeMediaUrl(src)}/>{captions&&<track kind="captions" src={safeMediaUrl(captions)} srcLang="en" label="English" default/>}Your browser cannot play this video.</video><figcaption>{title} · <a href={safeMediaUrl(src)}>Open video</a>{transcript&&<> · <a href={safeMediaUrl(transcript)}>Read transcript</a></>}</figcaption></figure>;
}
export function Audio({src,title,transcript}:{src:string;title:string;transcript?:string}) {
  return <figure className="media-figure"><audio controls preload="metadata" aria-label={title} src={safeMediaUrl(src)}>Your browser cannot play this audio.</audio><figcaption>{title} · <a href={safeMediaUrl(src)}>Open audio</a>{transcript&&<> · <a href={safeMediaUrl(transcript)}>Read transcript</a></>}</figcaption></figure>;
}
// Add approved origins here deliberately, rather than allowing arbitrary iframe destinations.
export const embedOrigins = ['https://www.youtube-nocookie.com','https://player.vimeo.com','https://www.desmos.com','https://scratch.mit.edu'];
export function Embed({src,title}:{src:string;title:string}) {
  const url = new URL(safeMediaUrl(src));
  if (!embedOrigins.includes(url.origin)) throw new Error(`Embed origin not approved: ${url.origin}`);
  return <figure className="media-figure"><iframe className="media-frame" style={{aspectRatio:'16/9'}} src={url.href} title={title} loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" allow="fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><figcaption><a href={url.href} target="_blank" rel="noopener noreferrer">Open {title} in a new tab</a></figcaption></figure>;
}
export function PDF({src,title}:{src:string;title:string}) {
  const url = safeMediaUrl(src);
  // An empty sandbox blocks the browser's built-in PDF viewer, so the preview uses the viewer and the link remains the fallback.
  return <figure className="media-figure"><iframe className="media-frame" style={{height:480}} src={url} title={title} loading="lazy"/><figcaption>Preview unavailable? <a href={url} target="_blank" rel="noopener noreferrer">Open {title}</a></figcaption></figure>;
}
export function Download({src,title,detail}:{src:string;title:string;detail?:string}) {return <a className="download" href={safeMediaUrl(src)} download><DownloadIcon size={18}/><span>{title}</span>{detail&&<small>{detail}</small>}</a>;}
