import { helper } from '@/lib/helper';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { BlinkoStore } from '@/store/blinkoStore';
import { RootStore } from '@/store';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import { Code } from './Code';
import { LinkPreview } from './LinkPreview';
import { ImageWrapper } from './ImageWrapper';
import { ListItem } from './ListItem';

const highlightTags = (text) => {
  if (!text) return text
  try {
    const lines = text?.split("\n");
    return lines.map((line, lineIndex) => {
      const parts = line.split(" ");
      const processedParts = parts.map((part, index) => {
        if (part.startsWith('#') && part.length > 1 && part.match(helper.regex.isContainHashTag)) {
          return (
            <Link key={`${lineIndex}-${index}`} className='select-none blinko-tag px-11 font-bold cursor-pointer hover:opacity-80 transition-all' onClick={() => {
              RootStore.Get(BlinkoStore).forceQuery++
            }} href={`/all?searchText=${part}`}>
              {part + " "}
            </Link>
          );
        } else {
          return part + " ";
        }
      });
      return [...processedParts, <br key={`br-${lineIndex}`} />];
    });
  } catch (e) {
    return text
  }
};

export const MarkdownRender = observer(({ content = '', onChange, disableOverflowing = false }: { content?: string, onChange?: (newContent: string) => void, disableOverflowing?: boolean }) => {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(disableOverflowing ?? false);
  const contentRef = useRef(null);
  const { t } = useTranslation()

  useEffect(() => {
    if (contentRef.current) {
      //@ts-ignore
      const isContentOverflowing = contentRef.current.scrollHeight > contentRef.current.clientHeight;
      //@ts-ignore
      const isSingleLine = contentRef.current.clientHeight === parseFloat(getComputedStyle(contentRef.current).lineHeight);
      if (!disableOverflowing) {
        setIsOverflowing(isContentOverflowing && !isSingleLine);
      }
    }
  }, []);

  return (
    <div className={`markdown-body`}>
      <div ref={contentRef} data-markdown-theme={theme} className={`markdown-body content ${isExpanded ? "expanded" : "collapsed"}  ${disableOverflowing ? 'expanded' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            [remarkMath, {
              singleDollarTextMath: true,
              inlineMath: [['$', '$']],
              blockMath: [['$$', '$$']]
            }]
          ]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeKatex, {
              throwOnError: false,
              output: 'html',
              trust: true,
              strict: false
            }]
          ]}
          components={{
            p: ({ node, children }) => <p>{highlightTags(children)}</p>,
            code: Code,
            a: ({ node, children }) => <LinkPreview href={children} />,
            li: ({ node, children }) => <ListItem content={content} onChange={onChange}>{children}</ListItem>,
            img: ImageWrapper
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {!disableOverflowing && isOverflowing && content && (
        <div className='mt-2 cursor-pointer font-bold select-none hover:opacity-70 transition-all  tex-sm'
          onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? t('show-less') : t('show-more')}
        </div>
      )}
    </div>
  );
});

export const StreamingCodeBlock = observer(({ markdown }: { markdown: string }) => {
  return (
    <ReactMarkdown components={{ code: Code }}>
      {markdown}
    </ReactMarkdown>
  );
}); 