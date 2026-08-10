/**
 * Allowlist HTML sanitiser (PRD FR-DETAIL-007).
 *
 * Catalog descriptions and price details are authored upstream (Paris open
 * data) and contain real markup — paragraphs, lists, emphasis, links. Rendering
 * them as literal text shows tag soup to the user; rendering them with
 * `dangerouslySetInnerHTML` would hand an untrusted third party script
 * execution in our origin.
 *
 * This module takes the third route: parse into an inert document, walk it, and
 * emit a small tree of *known* nodes. The output is rendered by `RichText` as
 * ordinary React elements, so `dangerouslySetInnerHTML` is never used and the
 * ESLint ban on it stays in force.
 *
 * Why this is safe:
 *  - `DOMParser.parseFromString(..., 'text/html')` builds an inert document.
 *    Scripts do not run, and `img`/`iframe` src values are never fetched.
 *  - Only tags on ALLOWED_TAGS survive. Everything else is unwrapped (children
 *    kept) or dropped entirely for content that is never displayable.
 *  - Only `href` survives, only on `<a>`, and only after protocol validation.
 *  - No attribute from the source is ever copied through verbatim, so
 *    `onerror`, `style`, `srcdoc`, `formaction` and friends cannot appear.
 */

import { safeExternalUrl } from '@/shared/utils/safe-url'

/** Tags that keep their semantics. Everything else is unwrapped or dropped. */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'hr',
])

/** Tags whose *content* must never be shown, not merely unwrapped. */
const DROPPED_SUBTREES = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'svg',
  'math',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'link',
  'meta',
  'title',
  'head',
])

/** Headings are demoted so imported content cannot outrank the page's own. */
const TAG_ALIASES: Record<string, string> = {
  b: 'strong',
  i: 'em',
  h1: 'h3',
  h2: 'h3',
  div: 'p',
  section: 'p',
  article: 'p',
}

export type SafeNode =
  | { type: 'text'; text: string }
  | { type: 'element'; tag: string; href?: string; children: SafeNode[] }

const VOID_TAGS = new Set(['br', 'hr'])

function normaliseTag(tagName: string): string | null {
  const lower = tagName.toLowerCase()
  if (DROPPED_SUBTREES.has(lower)) return null
  const aliased = TAG_ALIASES[lower] ?? lower
  return ALLOWED_TAGS.has(aliased) ? aliased : ''
}

function convert(node: Node): SafeNode[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    return text === '' ? [] : [{ type: 'text', text }]
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return []

  const element = node as Element
  const tag = normaliseTag(element.tagName)

  // Disallowed and dangerous: drop the element and everything inside it.
  if (tag === null) return []

  const children = Array.from(element.childNodes).flatMap(convert)

  // Unknown but harmless (span, font, table, …): keep the text, drop the tag.
  if (tag === '') return children

  if (VOID_TAGS.has(tag)) return [{ type: 'element', tag, children: [] }]

  if (tag === 'a') {
    const href = safeExternalUrl(element.getAttribute('href'))
    // A link with an unusable or unsafe href degrades to its own text.
    if (!href) return children
    if (children.length === 0) return []
    return [{ type: 'element', tag: 'a', href, children }]
  }

  if (children.length === 0) return []

  return [{ type: 'element', tag, children }]
}

/** True when the string contains something that could plausibly be markup. */
export function looksLikeHtml(value: string): boolean {
  return /<[a-z!/][^>]*>/i.test(value) || /&[a-z]+;|&#\d+;/i.test(value)
}

function collapseWhitespace(nodes: SafeNode[]): SafeNode[] {
  return nodes
    .map((node) =>
      node.type === 'text'
        ? { ...node, text: node.text.replace(/[ \t\r\n]+/g, ' ') }
        : { ...node, children: collapseWhitespace(node.children) }
    )
    .filter((node) => node.type !== 'text' || node.text.trim() !== '' || node.text === ' ')
}

/**
 * Converts HTML into a safe node tree. Returns an empty array for input with no
 * displayable content, so callers can omit the section entirely.
 */
export function sanitizeHtml(html: string): SafeNode[] {
  if (html.trim() === '') return []

  // jsdom and every supported browser provide DOMParser; guard anyway so a
  // non-DOM environment degrades to plain text rather than throwing.
  if (typeof DOMParser === 'undefined') {
    return [{ type: 'text', text: html }]
  }

  const document = new DOMParser().parseFromString(html, 'text/html')
  const nodes = collapseWhitespace(Array.from(document.body.childNodes).flatMap(convert))

  // Guarantee a block wrapper so bare text and inline runs still get spacing.
  const BLOCKS = new Set(['p', 'ul', 'ol', 'blockquote', 'h3', 'h4', 'h5', 'h6', 'hr'])
  const result: SafeNode[] = []
  let inlineRun: SafeNode[] = []

  const flush = () => {
    if (inlineRun.length === 0) return
    const hasText = inlineRun.some((node) => node.type !== 'text' || node.text.trim() !== '')
    if (hasText) result.push({ type: 'element', tag: 'p', children: inlineRun })
    inlineRun = []
  }

  for (const node of nodes) {
    if (node.type === 'element' && BLOCKS.has(node.tag)) {
      flush()
      result.push(node)
    } else {
      inlineRun.push(node)
    }
  }
  flush()

  return result
}

/**
 * Plain-text projection for a truncated summary (PRD FR-LIST-002).
 *
 * `EventResponseMapper.summarize` cuts the description at 237 characters and
 * appends an ellipsis, with no awareness of markup — so a summary can end
 * mid-tag (`… book at <a href="htt`) or mid-entity (`Caf&eac`). Rendering that
 * as text shows tag soup on the card.
 *
 * This strips markup, drops any dangling fragment the truncation left behind,
 * and collapses whitespace so the result sits cleanly in a clamped line.
 * Returns an empty string when nothing readable survives, so the caller can
 * omit the element entirely.
 */
export function htmlToPlainSummary(html: string | null | undefined): string {
  if (!html || html.trim() === '') return ''

  // An unterminated final tag would otherwise leak its attribute text.
  const withoutDanglingTag = html.replace(/<[^>]*$/, '')
  const text = htmlToPlainText(withoutDanglingTag)

  // Likewise a half-written entity such as `&eac` at the cut point.
  return text.replace(/&[a-z]{0,8}$/i, '').trimEnd()
}

/** Plain-text projection, for meta descriptions and other text-only contexts. */
export function htmlToPlainText(html: string): string {
  if (typeof DOMParser === 'undefined') return html

  const document = new DOMParser().parseFromString(html, 'text/html')

  /*
   * `textContent` includes the source of <script> and <style>, which would
   * otherwise leak JavaScript into a meta description. Remove those subtrees
   * before projecting to text.
   */
  document.body.querySelectorAll([...DROPPED_SUBTREES].join(',')).forEach((element) => {
    element.remove()
  })

  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
