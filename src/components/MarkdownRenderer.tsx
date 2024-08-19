import React, { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, duotoneSpace } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  style?: { [key: string]: React.CSSProperties };
  components?: { [key: string]: React.ElementType };
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, style, components }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const element = containerRef.current.querySelector(`[id="${id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [content]);

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#') && containerRef.current) {
      event.preventDefault();
      const id = href.substring(1);
      const element = containerRef.current.querySelector(`[id="${id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const createHeadingComponent = (level: number) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements;
    return ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = typeof children === 'string' ? children : children?.toString() || '';
      const id = props.id || slugify(text);
      return (
        // @ts-ignore
        <Component
          id={id}
          className={`!text-current text-${['xl', 'lg', 'md', 'sm', 'xs', 'xs'][level - 1]} font-bold`}
          {...props}
        >
          {children}
        </Component>
      );
    };
  };

  return (
    <div ref={containerRef}>
      <Markdown
        components={{
          // @ts-ignore
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              // @ts-ignore
              <SyntaxHighlighter
                {...props}
                style={style ? style : duotoneSpace}
                language={match[1]}
                PreTag="div"
                className="!text-current"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code {...props} className={`${className} bg-primary rounded px-1 py-0.5 !text-current`}>
                {children}
              </code>
            );
          },
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                className="text-primary hover:text-primary-foreground underline"
                target={href?.startsWith('#') ? undefined : "_blank"}
                rel={href?.startsWith('#') ? undefined : "noopener noreferrer"}
                onClick={(e) => handleLinkClick(e, href || '')}
                {...props}
              >
                {children}
              </a>
            );
          },
          p: ({ children }) => <p className="!text-current">{children}</p>,
          h1: createHeadingComponent(1),
          h2: createHeadingComponent(2),
          h3: createHeadingComponent(3),
          h4: createHeadingComponent(4),
          h5: createHeadingComponent(5),
          h6: createHeadingComponent(6),
          strong: ({ children }) => <strong className="!text-primary">{children}</strong>,
          // Allow custom overrides
          ...components,
        }}
        className="prose prose-sm max-w-none !text-current"
      >
        {content}
      </Markdown>
    </div>
  );
};

export default MarkdownRenderer;