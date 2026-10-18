import type { Facility, Site, SiteInput } from '../lib/db'
import type { Field } from './FieldsDialog'

/** The add / edit site dialog's fields, shared by the facility page and the site page. */
export function siteFields(facilities: Facility[]): Field[] {
  return [
    { name: 'name', label: 'Name', required: true },
    {
      name: 'facility_id',
      label: 'Facility',
      required: true,
      placeholder: 'Choose a facility',
      options: facilities.map((f) => ({ value: f.id, label: f.name })),
    },
    { name: 'site_type', label: 'Site type', placeholder: 'For example: Well pad, Tank battery' },
    { name: 'notes', label: 'Notes', multiline: true },
    { name: 'map_url', label: 'Map link', placeholder: 'Paste a map link or GPS coordinates' },
  ]
}

/** A site's current values, for prefilling the edit dialog. */
export function siteFormValues(site: Site): Record<string, string> {
  return {
    name: site.name,
    facility_id: site.facility_id ?? '',
    site_type: site.site_type ?? '',
    notes: site.notes ?? '',
    map_url: site.map_url ?? '',
  }
}

/** The dialog's values as the input createSite / updateSite expect. */
export function siteInput(v: Record<string, string>): SiteInput {
  return { name: v.name, facility_id: v.facility_id, site_type: v.site_type, notes: v.notes, map_url: v.map_url }
}
