import { useEffect } from 'react'

const BASE_TITLE = 'CityPulse — Events in Paris'

function setMetaDescription(content: string): void {
  let element = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!element) {
    element = document.createElement('meta')
    element.name = 'description'
    document.head.appendChild(element)
  }
  element.content = content
}

function setCanonical(path: string): void {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = new URL(path, window.location.origin).toString()
}

/**
 * PRD FR-DETAIL-009. A pure SPA cannot guarantee rich social-crawler previews;
 * that limitation is accepted for MVP and documented in the README.
 */
export function useDocumentMetadata(input: {
  title?: string | null
  description?: string | null
  canonicalPath?: string | null
}): void {
  const { title, description, canonicalPath } = input

  useEffect(() => {
    const previousTitle = document.title
    document.title = title ? `${title} — CityPulse` : BASE_TITLE
    return () => {
      document.title = previousTitle
    }
  }, [title])

  useEffect(() => {
    if (!description) return
    const trimmed = description.replace(/\s+/g, ' ').trim().slice(0, 160)
    setMetaDescription(trimmed)
  }, [description])

  useEffect(() => {
    if (!canonicalPath) return
    setCanonical(canonicalPath)
  }, [canonicalPath])
}
