import type { ReactNode } from 'react'
import type { EquipmentWithTypes, ReadingType } from '../lib/db'
import { readingTypeLabel } from './EquipmentList'

interface Props {
  /** Only equipment that has reading types. The caller filters. */
  equipment: EquipmentWithTypes[]
  renderValue: (type: ReadingType, equipment: EquipmentWithTypes) => ReactNode
}

/** One row per reading type, grouped under its equipment, with the reading next to it. */
export default function ReadingsSheet({ equipment, renderValue }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-primary text-background">
            <th
              scope="col"
              className="px-4 py-3 text-left font-display text-xs font-semibold uppercase tracking-[0.1em] text-accent"
            >
              Item
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left font-display text-xs font-semibold uppercase tracking-[0.1em]"
            >
              Reading
            </th>
          </tr>
        </thead>
        {equipment.map((e) => (
          <tbody key={e.id}>
            <tr className="border-b border-gray-200">
              <th
                colSpan={2}
                scope="colgroup"
                className="bg-gray-50 px-4 py-2 text-left font-display text-sm font-semibold uppercase tracking-wide"
              >
                {e.name}
              </th>
            </tr>
            {e.reading_types.map((t) => (
              <tr key={t.id} className="h-[44px] border-b border-gray-200 last:border-b-0">
                <td className="px-4 py-2 font-semibold text-primary">{readingTypeLabel(t.name, t.unit)}</td>
                <td className="w-[45%] px-4 py-2 sm:w-[220px]">{renderValue(t, e)}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}
