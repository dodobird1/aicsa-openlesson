import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { lessonComponents } from '../../../mdx-components';
export function RenderMDX({source}:{source:string}) {
  return <MDXRemote source={source} components={lessonComponents} options={{blockJS:false,mdxOptions:{remarkPlugins:[remarkGfm,remarkMath],rehypePlugins:[rehypeSlug,[rehypeKatex,{trust:false,strict:'warn'}],[rehypePrettyCode,{theme:'github-light',keepBackground:false}]]}}}/>;
}
