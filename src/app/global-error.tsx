'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: '48px 24px', color: '#24372f', background: '#fafbf9' }}>
    <h1 style={{ fontWeight: 500 }}>This page could not be displayed.</h1>
    <p>If you are writing a lesson, check its frontmatter, headings, and components.</p>
    <button type="button" onClick={reset} style={{ border: 0, borderRadius: 6, background: '#285c46', color: 'white', padding: '12px 16px' }}>Try again</button>
  </body></html>;
}
