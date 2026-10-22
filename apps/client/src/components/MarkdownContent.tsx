import { Children, isValidElement } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidChart } from './MermaidChart';

const components: Components = {
  pre({ children, ...props }) {
    const child = Children.toArray(children)[0];
    if (
      isValidElement<{ className?: string; children?: unknown }>(child) &&
      child.props.className?.split(/\s+/).includes('language-mermaid')
    ) {
      return <MermaidChart chart={child.props.children} />;
    }
    if (
      isValidElement<{ className?: string }>(child) &&
      child.props.className?.split(/\s+/).some((name) => name.startsWith('language-'))
    ) {
      return <>{children}</>;
    }
    return <pre {...props}>{children}</pre>;
  },
  code({ className, children, ...props }) {
    if (className?.split(/\s+/).includes('language-mermaid')) {
      const chart = String(children).replace(/\n$/, '');
      return <MermaidChart chart={chart} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

/** Render standard Markdown/GFM and turn Mermaid fenced blocks into diagrams. */
export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
