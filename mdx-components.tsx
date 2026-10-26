import { CodeBlock } from './src/components/lesson/code-block';
import { Audio, Callout, Disclosure, Download, Embed, Image, PDF, Video } from './src/components/lesson/media';
import { MultipleChoice } from './src/components/exercises/multiple-choice';
import { LLMPractice } from './src/components/exercises/llm-practice';
import { CodeExercise } from './src/components/exercises/code-exercise';
import { ParsonsProblem } from './src/components/exercises/parsons';
import { FillBlank } from './src/components/exercises/fill-blank';
import { VibeCoding } from './src/components/exercises/vibe-coding';
export const lessonComponents = { pre:CodeBlock, Audio, Callout, Disclosure, Download, Embed, Image, PDF, Video, MultipleChoice, LLMPractice, CodeExercise, ParsonsProblem, FillBlank, VibeCoding };
export function useMDXComponents(components:Record<string,unknown>) {return {...lessonComponents,...components};}
