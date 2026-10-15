/** Common reading types. Tapping one in the dialog fills the name and unit; the fields stay editable. */
export interface ReadingTypePreset {
  label: string
  values: { name: string; unit: string }
}

export const READING_TYPE_PRESETS: ReadingTypePreset[] = [
  { label: 'Ohms (Ω)', values: { name: 'Ohms', unit: 'Ω' } },
  { label: 'Voltage (V)', values: { name: 'Voltage', unit: 'V' } },
  { label: 'Amps (A)', values: { name: 'Amps', unit: 'A' } },
  { label: 'Pressure (psi)', values: { name: 'Pressure', unit: 'psi' } },
  { label: 'Temperature (°F)', values: { name: 'Temperature', unit: '°F' } },
]
