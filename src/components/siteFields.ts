import type { Site, SiteInput } from '../lib/db'
import type { Field } from './FieldsDialog'

/** The add / edit site dialog's fields, shared by the Sites page and the site page. */
export const SITE_FIELDS: Field[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'site_type', label: 'Site type', placeholder: 'For example: Well pad, Tank battery' },
  { name: 'notes', label: 'Notes', multiline: true },
  { name: 'map_url', label: 'Map link', placeholder: 'Paste a map link or GPS coordinates' },
]

/** A site's current values, for prefilling the edit dialog. */
export function siteFormValues(site: Site): Record<string, string> {
  return {
    name: site.name,
    site_type: site.site_type ?? '',
    notes: site.notes ?? '',
    map_url: site.map_url ?? '',
  }
}

/** The dialog's values as the input createSite / updateSite expect. */
export function siteInput(v: Record<string, string>): SiteInput {
  return { name: v.name, facility_id: v.facility_id ?? '', site_type: v.site_type, notes: v.notes, map_url: v.map_url }
}
