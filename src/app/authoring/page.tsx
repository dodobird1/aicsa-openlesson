import { RenderMDX } from '../../components/lesson/render-mdx';
export const metadata={title:'Authoring guide'};
const guide = `## Start with one file

Copy \`content/lessons/_template.mdx\` to \`content/lessons/your-first-lesson.mdx\`. Files beginning with an underscore are ignored. The learning path updates from these files automatically; no page code needs to change.

\`\`\`yaml
---
id: your-first-lesson
title: Your lesson title
description: What students will explore.
order: 1
group: Getting started
minutes: 5
---
\`\`\`

Use a unique, permanent lowercase \`id\` with hyphens. The filename sets the URL; \`order\` sets navigation order; \`group\` labels sidebar sections. Keep lesson and exercise IDs stable so saved progress continues to match. Exercise IDs must be unique across the whole site.

## Write and compose

Use normal Markdown for headings, paragraphs, lists, links, tables, and fenced code. Level-two headings create the page table of contents, including headings inside a quote. Links, code, and formulas in a heading are listed by their text, and repeated names stay in the same order as the page. MDX adds components directly inside the text. MDX is executable author code: only trusted maintainers should edit lesson files. Never compile student submissions as MDX.

\`\`\`mdx
<Callout title="A helpful hint">Your explanation here.</Callout>

<Disclosure title="Want another explanation?">
  Optional details go here.
</Disclosure>

<MultipleChoice
  id="your-first-lesson-check"
  question="Your question here?"
  options={[{id:'a',label:'First option'},{id:'b',label:'Second option'}]}
  answer={['a']}
  explanation="Why this answer works."
/>

<LLMPractice
  id="your-first-lesson-chat"
  preset="default"
  instructions="Describe the practice task."
  starterMessage="An optional starter prompt."
/>
\`\`\`

Set \`multiple\` on a question and supply multiple answer IDs for multi-select. Quiz answers are shipped to the browser: these are learning activities, not secure exams. Code blocks are syntax-highlighted and copyable, but never execute student code.

## Write formulas

Use LaTeX-style math in MDX: single dollar signs for inline formulas and double dollar signs on separate lines for display equations. Formulas are rendered on the server with KaTeX, including accessible MathML; students do not need a math-rendering script in their browser.

\`\`\`mdx
Inline: $a^2 + b^2 = c^2$

$$
\\frac{1}{n} \\sum_{i=1}^{n} x_i = \\bar{x}
$$
\`\`\`

Fractions, roots, sums, matrices, and aligned equations use KaTeX-supported LaTeX commands. This is math notation, not a full LaTeX document engine. Keep commands inside math delimiters so MDX does not interpret braces as JavaScript. For a literal price, escape the dollar sign (for example, a backslash before $5), or wrap it in inline code. Code fences keep formula syntax literal. Long display equations scroll horizontally on small screens. External commands and trusted HTML extensions are disabled.

## Add guided practice

Two exercise types run entirely in the learner's browser—no AI provider or API key needed. Write \`lines\` in the correct order and the framework scrambles them deterministically per exercise id, so a reload shows the same puzzle and the problem never starts already solved. Learners drag lines or use the arrow buttons; every check is recorded in browser progress.

\`\`\`mdx
<ParsonsProblem
  id="your-lesson-parsons"
  question="Arrange the lines so the program prints the sum."
  lines={['int sum = 0;', '    for (int n : numbers) {', '        sum += n;', '    }', '}']}
  explanation="Shown after checking: the declaration comes first, then the loop."
/>
\`\`\`

Fill-in-the-blank turns any MDX content into inline inputs: write three or more question marks (\`???\`) where a blank belongs, and list the correct values in \`answers\` in order. The content between the tags is normal MDX, including fenced code blocks. Checks trim surrounding whitespace and collapse repeated spaces; comparison is case-sensitive unless you set \`caseSensitive={false}\`.

\`\`\`mdx
<FillBlank
  id="your-lesson-fill"
  question="Complete the declaration and the Scanner call."
  answers={['int', 'nextInt']}
  explanation="Shown after checking."
>

??? total = scanner.???();

</FillBlank>
\`\`\`

Both components follow the same rules as the other exercises: ids must be unique across the whole site (the build fails with both file names when two collide), and answers ship to the browser—these are learning activities, not secure exams. For AI-graded free-form coding, see \`CodeExercise\` in the component showcase; its grading behavior comes from the server-side presets in \`src/lib/llm\`.

## Pair with an AI coach

\`VibeCoding\` is an IDE-style exercise: the student's code editor on one side, an AI coach chat on the other. The coach sees the task and the current code as context with every question, but it can never edit the code—there is no apply button, so every change is typed by the student. This needs a configured AI provider; the editor itself keeps working without one.

\`\`\`mdx
<VibeCoding
  id="your-lesson-vibe"
  title="调试这段程序"
  task="What the student should build or fix, in one or two sentences."
  starter={\`public class Main {
    public static void main(String[] args) {
        // starter code, up to 4000 characters
    }
}\`}
  preset="code-reviewer"
  language="java"
/>
\`\`\`

The \`preset\` chooses the coach's persona from the server-side presets in \`src/lib/llm\` (\`code-reviewer\` reviews line by line; \`socratic-tutor\` only asks guiding questions). Only the newest message carries the code snapshot, so long conversations stay within the chat limits. Students can also turn off code attachment per message.

## Bring your media

Place assets in \`public/media\` and reference them as \`/media/filename\`. Paths cannot contain \`..\` segments or literal whitespace—percent-encode spaces as \`%20\` (as in \`/media/my%20file.png\`), or avoid spaces in file names. HTTPS external media URLs are supported. Browser codec support determines which video/audio files play; MP4/WebM and MP3/OGG are common choices. Other files can always be linked as downloads.

\`\`\`mdx
<Image src="/media/diagram.png" alt="Describe the idea shown" caption="Optional caption" />
<Video src="/media/demo.mp4" title="Demo" captions="/media/demo.vtt" transcript="/media/demo.txt" />
<Audio src="/media/recording.mp3" title="Recording" transcript="/media/recording.txt" />
<Embed src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="Video title" />
<PDF src="/media/worksheet.pdf" title="Worksheet" />
<Download src="/media/files.zip" title="Exercise files" detail="ZIP archive" />
\`\`\`

Provide descriptive image alt text, WebVTT video captions, and audio/video transcripts. PDF previews may be unavailable on some devices; an open-file fallback is always included. Cross-origin downloads may open rather than download. Approved iframe providers are configured in \`src/components/lesson/media.tsx\`; add new origins deliberately. Embeds may also be blocked by a provider's own policies.

## Connect a model

Fill in \`llm.config.json\` (copy \`llm.config.example.json\` if you do not have it yet). Use an OpenAI-style \`apiKey\`, a \`baseURL\` for the provider's API root (commonly ending in /v1, not /chat/completions), and a \`model\`. The file is ignored by git. Restart the server after changes. Leave the values blank to keep chat disabled.

Environment variables \`LLM_API_KEY\`, \`LLM_BASE_URL\`, and \`LLM_MODEL\` override the file when they are set. Use those on a host instead of committing a key.

Never prefix credentials with \`NEXT_PUBLIC_\` or put them in MDX. Provider calls run through \`src/app/api/chat/route.ts\`. Edit server-owned presets in \`src/lib/llm\` to control instructions and output limits. The initial adapter targets OpenAI-compatible chat completions; providers with different APIs need another adapter.

Conversations are not saved by this app. Submitted messages are sent to the configured provider, whose retention and age policies you must review before offering it to students. Avoid personal information, configure appropriate moderation for your audience, and do not treat model responses as authoritative.

<Callout title="Before a public launch">
  Anonymous access to a paid API needs deployment-level protection. The process-local limiter is only a basic safeguard, not a reliable distributed rate limit or spending cap. Add a shared rate limiter or gateway, provider spending limits, and monitoring before enabling chat publicly. Review child privacy requirements and provider terms for your student audience.
</Callout>

## Progress and privacy

Lesson completion and quiz outcomes are saved only in this browser's local storage, with a reset control in the sidebar. They do not sync across devices, and clearing browser data removes them. Private browsing or blocked storage may prevent persistence. Chat text is not stored in local storage or a database.

## Run and deploy

\`\`\`bash
npm install
npm run dev

# Before shipping
npm run lint
npm run typecheck
npm test
npm run build

# Browser smoke tests (one-time browser installation)
npx playwright install chromium
npm run test:e2e
\`\`\`

Deploy to a host that supports the Next.js Node.js runtime and streaming responses. This is not a static-only export: the chat route requires a server. Set secrets through your host's environment settings. If chat is not needed yet, leave provider variables blank.

## Where things live

- \`content/lessons\`: course MDX and the unpublished lesson template.
- \`content/showcase.mdx\`: the separate component preview.
- \`mdx-components.tsx\`: component registration.
- \`src/components/lesson\`: code blocks, media, callouts, and disclosures.
- \`src/components/exercises\`: questions and chat practice.
- \`src/lib/content\`: metadata validation and course ordering.
- \`src/lib/progress\`: versioned browser progress.
- \`llm.config.json\`: local OpenAI-style API key, base URL, and model. Not committed.
- \`src/lib/llm\`: server configuration, validation, and provider adapter.
- \`src/app/globals.css\`: colors, typography, and responsive styling.
`;
export default function Authoring(){return <div className="page document-page"><header className="document-header"><span className="eyebrow">FROM YOUR FIRST FILE TO YOUR FIRST COURSE</span><h1>Make room for<br/><span className="serif-accent">your ideas.</span></h1><p>A practical guide for the people building the learning experience. No content management system to learn—just files and a few useful components.</p></header><div className="document-layout"><article className="prose"><RenderMDX source={guide}/></article><nav className="toc" aria-label="On this page"><strong>AUTHORING GUIDE</strong>{['Start with one file','Write and compose','Write formulas','Add guided practice','Pair with an AI coach','Bring your media','Connect a model','Progress and privacy','Run and deploy','Where things live'].map(t=><a key={t} href={'#'+t.toLowerCase().replaceAll(' ','-')}>{t}</a>)}</nav></div></div>;}
