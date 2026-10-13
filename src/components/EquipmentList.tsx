import type { EquipmentWithTypes, ReadingType } from '../lib/db'

export function readingTypeLabel(name: string, unit: string | null): string {
  return unit ? `${name} (${unit})` : name
}

/** Handlers for edit mode. When the prop is omitted (logged out), no control is rendered at all. */
export interface EquipmentActions {
  onRename: (equipment: EquipmentWithTypes) => void
  onDelete: (equipment: EquipmentWithTypes) => void
  onAddType: (equipment: EquipmentWithTypes) => void
  onCopyTypes: (equipment: EquipmentWithTypes) => void
  onEditType: (equipment: EquipmentWithTypes, type: ReadingType) => void
}

const smallButton = 'min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-sm'

export default function EquipmentList({
  equipment,
  actions,
}: {
  equipment: EquipmentWithTypes[]
  actions?: EquipmentActions
}) {
  if (equipment.length === 0) return <p className="text-muted">No equipment yet.</p>

  return (
    <ul className="space-y-3">
      {equipment.map((e) => (
        <li key={e.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="font-semibold">{e.name}</div>
          {e.reading_types.length === 0 ? (
            <div className="mt-1 text-sm text-muted">No reading types</div>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {e.reading_types.map((t) => (
                <li key={t.id}>
                  {actions ? (
                    <button
                      type="button"
                      onClick={() => actions.onEditType(e, t)}
                      aria-label={`Edit reading type ${readingTypeLabel(t.name, t.unit)}`}
                      className="min-h-[44px] rounded-full border border-gray-300 px-3 text-sm"
                    >
                      {readingTypeLabel(t.name, t.unit)} ✎
                    </button>
                  ) : (
                    <span className="inline-block rounded-full border border-gray-200 px-3 py-1 text-sm">
                      {readingTypeLabel(t.name, t.unit)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => actions.onAddType(e)} className={smallButton}>
                + Add reading type
              </button>
              <button type="button" onClick={() => actions.onCopyTypes(e)} className={smallButton}>
                Copy reading types from…
              </button>
              <button type="button" onClick={() => actions.onRename(e)} className={smallButton}>
                Rename
              </button>
              <button type="button" onClick={() => actions.onDelete(e)} className={`${smallButton} text-danger`}>
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
