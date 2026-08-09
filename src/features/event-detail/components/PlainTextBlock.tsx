import { useMemo } from 'react'

/**
 * PRD FR-DETAIL-007: external descriptions are rendered as plain text.
 * `dangerouslySetInnerHTML` is banned by an ESLint rule; paragraph and line
 * breaks are reconstructed structurally instead, so nothing can execute.
 */
export function PlainTextBlock({ text, className }: { text: string; className?: string }) {
  const paragraphs = useMemo(
    () =>
      text
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph !== ''),
    [text]
  )

  if (paragraphs.length === 0) return null

  return (
    <div className={className}>
      {paragraphs.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex} className="mt-3 first:mt-0">
          {paragraph.split('\n').map((line, lineIndex, lines) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}
