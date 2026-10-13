import { useState, type FormEvent } from 'react'
import Modal, { dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from './Modal'

export interface Field {
  name: string
  label: string
  multiline?: boolean
  required?: boolean
  placeholder?: string
}

interface Props {
  title: string
  fields: Field[]
  initial?: Record<string, string>
  submitLabel?: string
  busy?: boolean
  onSubmit: (values: Record<string, string>) => void
  onCancel: () => void
  /** Optional destructive action shown on the left, for example deleting the thing being edited. */
  onDelete?: { label: string; run: () => void }
}

/** A small form dialog: text fields, Save and Cancel, with an inline "required" check. */
export default function FieldsDialog({
  title,
  fields,
  initial = {},
  submitLabel = 'Save',
  busy,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? ''])),
  )
  const [missing, setMissing] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const empty = fields.find((f) => f.required && (values[f.name] ?? '').trim() === '')
    if (empty) {
      setMissing(empty.name)
      return
    }
    onSubmit(values)
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <form onSubmit={submit} className="space-y-3">
        {fields.map((f, i) => {
          const id = `field-${f.name}`
          const common = {
            id,
            value: values[f.name] ?? '',
            placeholder: f.placeholder,
            autoFocus: i === 0,
            onChange: (e: { target: { value: string } }) => {
              setValues((v) => ({ ...v, [f.name]: e.target.value }))
              if (missing === f.name) setMissing(null)
            },
          }
          return (
            <div key={f.name}>
              <label htmlFor={id} className="block text-sm">
                {f.label}
              </label>
              {f.multiline ? (
                <textarea {...common} rows={3} className={`${inputClass} mt-1`} />
              ) : (
                <input {...common} type="text" className={`${inputClass} mt-1`} />
              )}
              {missing === f.name && <p className="mt-1 text-sm text-danger">{f.label} is required.</p>}
            </div>
          )
        })}
        <div className="flex items-center justify-between gap-2 pt-1">
          {onDelete ? (
            <button type="button" onClick={onDelete.run} disabled={busy} className={dangerButtonClass}>
              {onDelete.label}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={primaryButtonClass}>
              {busy ? 'Saving…' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
