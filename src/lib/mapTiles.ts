/** CARTO basemap URL for the current theme. `dark_all` on dark surfaces keeps
 *  the map from glaring against the Midnight background. Both hosts are allowed
 *  by the CSP `img-src` (*.basemaps.cartocdn.com). */
export function cartoTileUrl(dark: boolean): string {
  return `https://{s}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}{r}.png`;
}
