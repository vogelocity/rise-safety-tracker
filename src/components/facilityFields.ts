import type { Field } from './FieldsDialog'

/** The add / edit facility dialog's one field, shared by the home page and the facility page. */
export const FACILITY_FIELDS: Field[] = [{ name: 'name', label: 'Name', required: true }]

/** "82 sites", "1 site", "0 sites". */
export const siteCountLabel = (n: number) => `${n} ${n === 1 ? 'site' : 'sites'}`

/** Shown instead of the delete confirmation while a facility still has sites. */
export const facilityHasSitesMessage = (name: string, siteCount: number) =>
  `"${name}" still has ${siteCountLabel(siteCount)}. Move them to another facility or delete them first.`

export const deleteFacilityMessage = (name: string) => `Delete "${name}"? It has no sites. This cannot be undone.`
