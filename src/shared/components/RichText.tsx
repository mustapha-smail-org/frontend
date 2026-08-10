import { Fragment, useMemo, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { looksLikeHtml, sanitizeHtml, type SafeNode } from './sanitize-html'

/**
 * Renders backend-supplied rich text (PRD FR-DETAIL-007).
 *
 * The input is sanitised into an allowlisted node tree and then emitted as
 * ordinary React elements — `dangerouslySetInnerHTML` is never used, so nothing
 * from the payload can execute. Content with no markup falls back to
 * paragraph/line-break reconstruction from plain text.
 */

function renderNodes(nodes: SafeNode[]): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === 'text') return <Fragment key={index}>{node.text}</Fragment>

    const children = renderNodes(node.children)

    switch (node.tag) {
      case 'br':
        return <br key={index} />
      case 'hr':
        return <hr key={index} className="border-border my-4" />
      case 'p':
        return (
          <p key={index} className="mt-3 first:mt-0">
            {children}
          </p>
        )
      case 'strong':
        return (
          <strong key={index} className="font-semibold">
            {children}
          </strong>
        )
      case 'em':
        return <em key={index}>{children}</em>
      case 'u':
        return <u key={index}>{children}</u>
      case 'ul':
        return (
          <ul key={index} className="mt-3 list-disc space-y-1 pl-5 first:mt-0">
            {children}
          </ul>
        )
      case 'ol':
        return (
          <ol key={index} className="mt-3 list-decimal space-y-1 pl-5 first:mt-0">
            {children}
          </ol>
        )
      case 'li':
        return <li key={index}>{children}</li>
      case 'blockquote':
        return (
          <blockquote
            key={index}
            className="border-border text-muted-foreground mt-3 border-l-2 pl-3 first:mt-0"
          >
            {children}
          </blockquote>
        )
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const Heading = node.tag
        return (
          <Heading key={index} className="mt-5 text-base font-semibold first:mt-0">
            {children}
          </Heading>
        )
      }
      case 'a':
        return (
          <a
            key={index}
            href={node.href}
            target="_blank"
            // Every link here comes from an untrusted payload.
            rel="noopener noreferrer nofollow ugc"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            {children}
          </a>
        )
      default:
        return <Fragment key={index}>{children}</Fragment>
    }
  })
}

/** Paragraph/line-break reconstruction for content that carries no markup. */
function renderPlainText(text: string): ReactNode {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
    .map((paragraph, paragraphIndex) => (
      <p key={paragraphIndex} className="mt-3 first:mt-0">
        {paragraph.split('\n').map((line, lineIndex, lines) => (
          <Fragment key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </Fragment>
        ))}
      </p>
    ))
}

interface RichTextProps {
  content: string | null | undefined
  className?: string
  'data-testid'?: string
}

export function RichText({ content, className, 'data-testid': testId }: RichTextProps) {
  const rendered = useMemo(() => {
    const value = content?.trim()
    if (!value) return null
    if (!looksLikeHtml(value)) return renderPlainText(value)

    const nodes = sanitizeHtml(value)
    // Everything was stripped (e.g. markup with no readable text): show nothing
    // rather than an empty block.
    if (nodes.length === 0) return null
    return renderNodes(nodes)
  }, [content])

  if (!rendered) return null

  return (
    <div data-testid={testId} className={cn('break-words', className)}>
      {rendered}
    </div>
  )
}
