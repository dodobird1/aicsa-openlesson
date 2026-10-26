'use client';
import { useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) return textOf((node.props as {children?:ReactNode}).children);
  return '';
}
export function CodeBlock({children,...props}:ComponentPropsWithoutRef<'pre'> & {'data-language'?:string}) {
  const [copied,setCopied] = useState(false);
  const [error,setError] = useState(false);
  // rehype-pretty-code sets data-language on this pre element; reading it from children's
  // props diverges between the server render and client hydration.
  const language = props['data-language'];
  async function copy() {try {await navigator.clipboard.writeText(textOf(children));setCopied(true);setError(false);setTimeout(()=>setCopied(false),2000);}catch{setError(true);}}
  return <div className="code-block"><div className="code-toolbar"><span>{language || 'code'}</span><button onClick={copy} type="button" className="code-copy">{copied?<Check size={12}/>:<Copy size={12}/>} {error?'Select code to copy':copied?'Copied':'Copy code'}</button></div><pre {...props}>{children}</pre></div>;
}
