/** Site map links. A technician pastes a map link, or bare GPS coordinates, into the site dialog. */

export const MAP_LINK_ERROR =
  'Map link must be a web link (starting with https://) or coordinates like 31.5521, -97.1467.'

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/i
const COORDS = /^\(?\s*(-?\d{1,3}(?:\.\d+)?)\s*(?:,\s*|\s+)(-?\d{1,3}(?:\.\d+)?)\s*\)?$/
const MAX_LENGTH = 2000

/**
 * Turns what the technician typed into the URL to store, or null when the field is blank.
 * Text containing a web link keeps only the first http(s) link. Bare coordinates
 * ("31.5521, -97.1467") become a Google Maps link to that point. Anything else throws MAP_LINK_ERROR.
 */
export function parseMapLink(raw: string): string | null {
  const text = raw.trim()
  if (text === '') return null
  const found = text.match(URL_IN_TEXT)
  if (found) {
    const url = found[0].replace(/[.,;:!?]+$/, '')
    if (url.length > MAX_LENGTH) throw new Error(MAP_LINK_ERROR)
    return url
  }
  const coords = text.match(COORDS)
  if (coords) {
    const [, lat, lng] = coords
    if (Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }
  }
  throw new Error(MAP_LINK_ERROR)
}

/** The stored link when it is safe to use as an href (http or https only), otherwise null. */
export function mapHref(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null
}
