import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RichText } from './RichText'
import { htmlToPlainSummary, htmlToPlainText, looksLikeHtml, sanitizeHtml } from './sanitize-html'

function renderHtml(content: string) {
  return render(<RichText content={content} data-testid="rich" />)
}

describe('sanitizeHtml — dangerous input', () => {
  const ATTACKS: Array<[string, string]> = [
    ['inline script', '<p>Hello</p><script>window.__pwned = 1</script>'],
    ['image error handler', '<img src=x onerror="window.__pwned = 1">'],
    ['svg onload', '<svg onload="window.__pwned = 1"></svg>'],
    ['iframe', '<iframe src="https://evil.example.com"></iframe>'],
    ['javascript: link', '<a href="javascript:window.__pwned = 1">click</a>'],
    ['data: link', '<a href="data:text/html;base64,PHNjcmlwdD4=">click</a>'],
    ['style block', '<style>body { display: none }</style><p>Hi</p>'],
    ['inline style attribute', '<p style="position:fixed;inset:0">Hi</p>'],
    ['form + button', '<form action="https://evil.example.com"><button>Go</button></form>'],
    ['object embed', '<object data="evil.swf"></object>'],
    ['event handler on allowed tag', '<p onclick="window.__pwned = 1">Hi</p>'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example.com">'],
  ]

  it.each(ATTACKS)('neutralises %s', (_name, html) => {
    const { container } = renderHtml(html)
    const markup = container.innerHTML

    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('style')).toBeNull()
    expect(container.querySelector('object')).toBeNull()
    expect(container.querySelector('form')).toBeNull()
    expect(markup).not.toContain('onerror')
    expect(markup).not.toContain('onclick')
    expect(markup).not.toContain('onload')
    expect(markup).not.toContain('javascript:')
    expect(markup).not.toContain('style=')
    expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined()
  })

  it('keeps the readable text of a rejected link', () => {
    renderHtml('<a href="javascript:alert(1)">Book here</a>')
    expect(screen.getByText('Book here')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('unwraps unknown tags but keeps their text', () => {
    renderHtml('<p>Price: <span class="x"><font color="red">€28</font></span></p>')
    expect(screen.getByTestId('rich')).toHaveTextContent('Price: €28')
    expect(screen.getByTestId('rich').querySelector('font')).toBeNull()
  })

  it('drops the content of tags that must never be displayed', () => {
    renderHtml('<p>Visible</p><script>secret()</script><style>.a{}</style>')
    const text = screen.getByTestId('rich').textContent ?? ''
    expect(text).toContain('Visible')
    expect(text).not.toContain('secret')
    expect(text).not.toContain('.a{}')
  })
})

describe('sanitizeHtml — legitimate content', () => {
  it('preserves paragraphs, emphasis and lists', () => {
    renderHtml(
      '<p>First <strong>bold</strong> and <em>italic</em>.</p><ul><li>One</li><li>Two</li></ul>'
    )
    const root = screen.getByTestId('rich')

    expect(root.querySelectorAll('p')).toHaveLength(1)
    expect(root.querySelector('strong')).toHaveTextContent('bold')
    expect(root.querySelector('em')).toHaveTextContent('italic')
    expect(root.querySelectorAll('li')).toHaveLength(2)
  })

  it('normalises b/i to strong/em', () => {
    renderHtml('<p><b>bold</b> <i>italic</i></p>')
    expect(screen.getByTestId('rich').querySelector('strong')).toHaveTextContent('bold')
    expect(screen.getByTestId('rich').querySelector('em')).toHaveTextContent('italic')
  })

  it('keeps safe links and hardens their rel', () => {
    renderHtml('<p>See <a href="https://example.org/tickets">tickets</a></p>')
    const link = screen.getByRole('link', { name: 'tickets' })

    expect(link).toHaveAttribute('href', 'https://example.org/tickets')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
    expect(link.getAttribute('rel')).toContain('nofollow')
  })

  it('demotes imported headings so they cannot outrank the page h1', () => {
    renderHtml('<h1>Imported title</h1><h2>Imported subtitle</h2>')
    const root = screen.getByTestId('rich')

    expect(root.querySelector('h1')).toBeNull()
    expect(root.querySelector('h2')).toBeNull()
    expect(root.querySelectorAll('h3')).toHaveLength(2)
  })

  it('decodes HTML entities', () => {
    renderHtml('<p>Caf&eacute; &amp; Th&eacute;&acirc;tre &mdash; 20&nbsp;&euro;</p>')
    expect(screen.getByTestId('rich').textContent).toContain('Café & Théâtre')
    expect(screen.getByTestId('rich').textContent).toContain('€')
  })

  it('renders line breaks', () => {
    renderHtml('<p>Line one<br>Line two</p>')
    expect(screen.getByTestId('rich').querySelector('br')).toBeInTheDocument()
  })

  it('wraps bare text in a paragraph so spacing is consistent', () => {
    renderHtml('Just some text with <strong>emphasis</strong>')
    expect(screen.getByTestId('rich').querySelector('p')).toHaveTextContent(
      'Just some text with emphasis'
    )
  })
})

describe('RichText — plain-text input', () => {
  it('reconstructs paragraphs from blank lines', () => {
    render(<RichText content={'First para.\n\nSecond para.'} data-testid="rich" />)
    expect(screen.getByTestId('rich').querySelectorAll('p')).toHaveLength(2)
  })

  it('reconstructs single line breaks', () => {
    render(<RichText content={'Line one\nLine two'} data-testid="rich" />)
    expect(screen.getByTestId('rich').querySelector('br')).toBeInTheDocument()
  })

  it('does not treat a stray angle bracket as markup', () => {
    render(<RichText content="Tickets < 20 euros" data-testid="rich" />)
    expect(screen.getByTestId('rich')).toHaveTextContent('Tickets < 20 euros')
  })

  it('renders nothing for empty, blank or missing content', () => {
    const { container: a } = render(<RichText content={null} />)
    const { container: b } = render(<RichText content="   " />)
    const { container: c } = render(<RichText content="" />)
    expect(a).toBeEmptyDOMElement()
    expect(b).toBeEmptyDOMElement()
    expect(c).toBeEmptyDOMElement()
  })

  it('renders nothing when markup carries no readable text', () => {
    const { container } = render(<RichText content="<p></p><script>x()</script>" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('looksLikeHtml', () => {
  it('detects tags and entities', () => {
    expect(looksLikeHtml('<p>hi</p>')).toBe(true)
    expect(looksLikeHtml('Caf&eacute;')).toBe(true)
    expect(looksLikeHtml('plain text')).toBe(false)
    expect(looksLikeHtml('a < b and c > d')).toBe(false)
  })
})

describe('htmlToPlainText', () => {
  it('strips markup and collapses whitespace', () => {
    expect(htmlToPlainText('<p>Hello   <strong>world</strong></p>\n<p>Again</p>')).toBe(
      'Hello world Again'
    )
  })

  it('excludes script and style content', () => {
    expect(htmlToPlainText('<p>Visible</p><script>secret()</script>')).toBe('Visible')
  })
})

describe('htmlToPlainSummary', () => {
  it('flattens markup to text', () => {
    expect(htmlToPlainSummary('<p>An <b>excellent</b> evening.</p>')).toBe('An excellent evening.')
  })

  it('collapses whitespace and newlines onto one line', () => {
    expect(htmlToPlainSummary('<p>One</p>\n\n<p>Two   three</p>')).toBe('One Two three')
  })

  it('drops a tag left dangling by the backend truncation', () => {
    // EventResponseMapper cuts at 237 chars with no awareness of markup.
    expect(htmlToPlainSummary('Book now at <a href="https://exam')).toBe('Book now at')
    expect(htmlToPlainSummary('Concert tonight <stro')).toBe('Concert tonight')
  })

  it('drops a half-written entity but keeps the text before it', () => {
    expect(htmlToPlainSummary('Visit the Caf&eac')).toBe('Visit the Caf')
    expect(htmlToPlainSummary('Visit the Caf&eac')).not.toContain('&')
  })

  it('keeps a complete entity', () => {
    expect(htmlToPlainSummary('Visit the Caf&eacute;')).toBe('Visit the Café')
  })

  it('preserves the truncation ellipsis', () => {
    expect(htmlToPlainSummary('<p>A long description that was cut...</p>')).toBe(
      'A long description that was cut...'
    )
  })

  it('strips script content rather than showing it', () => {
    expect(htmlToPlainSummary('<p>Real text</p><script>alert(1)</script>')).toBe('Real text')
  })

  it('returns an empty string for nothing usable', () => {
    expect(htmlToPlainSummary(null)).toBe('')
    expect(htmlToPlainSummary(undefined)).toBe('')
    expect(htmlToPlainSummary('   ')).toBe('')
    expect(htmlToPlainSummary('<p></p>')).toBe('')
  })

  it('leaves plain text untouched apart from whitespace', () => {
    expect(htmlToPlainSummary('An evening of contemporary jazz.')).toBe(
      'An evening of contemporary jazz.'
    )
  })
})

describe('sanitizeHtml return value', () => {
  it('returns an empty tree for empty input', () => {
    expect(sanitizeHtml('')).toEqual([])
    expect(sanitizeHtml('   ')).toEqual([])
  })

  it('never emits an href that is not http(s)', () => {
    const nodes = sanitizeHtml('<a href="ftp://x.example">a</a><a href="https://ok.example">b</a>')
    const hrefs = JSON.stringify(nodes).match(/"href":"[^"]+"/g) ?? []
    expect(hrefs).toHaveLength(1)
    expect(hrefs[0]).toContain('https://ok.example')
  })
})
