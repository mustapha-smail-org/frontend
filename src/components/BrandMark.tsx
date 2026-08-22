import Link from "next/link";

/**
 * Paname Spot brand mark: location pin first, Eiffel geometry second (Brand Guide §10–13).
 * `inverse` renders the wordmark in Warm White for Midnight/dark surfaces.
 */
export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="brand-mark" aria-label="Paname Spot, accueil">
      <svg className="brand-pin-svg" width="26" height="30" viewBox="0 0 26 30" role="img" aria-hidden="true" focusable="false">
        <path d="M13 1C6.4 1 1 6.3 1 12.8 1 21.2 13 29 13 29s12-7.8 12-16.2C25 6.3 19.6 1 13 1Z" fill="#F2384A" />
        <path d="M13 6.4 9.2 18.2h7.6L13 6.4Z" fill="#F8F6F1" />
        <path d="M10.4 14.5h5.2" stroke="#F2384A" strokeWidth="1.1" />
        <circle cx="13" cy="18.6" r="1.15" fill="#F8F6F1" />
      </svg>
      <span className={`brand-word disp${inverse ? " brand-word-inverse" : ""}`}>Paname Spot</span>
    </Link>
  );
}
