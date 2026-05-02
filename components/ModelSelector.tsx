'use client'

import { MODE_MODELS } from '@/lib/types'
import type { Mode, AIModel } from '@/lib/types'

interface Props {
  mode: Mode
  model: AIModel
  onChange: (model: AIModel) => void
}

export default function ModelSelector({ mode, model, onChange }: Props) {
  const options = MODE_MODELS[mode]

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 text-base font-medium whitespace-nowrap">Model :</span>
      <select
        value={model}
        onChange={(e) => onChange(e.target.value as AIModel)}
        className="border border-gray-300 rounded-xl px-3 py-2 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
