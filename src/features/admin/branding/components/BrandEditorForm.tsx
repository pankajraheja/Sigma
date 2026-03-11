// ---------------------------------------------------------------------------
// BrandEditorForm — editable form for all BrandConfig fields.
// Admin-neutral styling (gray). Does not use brand colors.
// ---------------------------------------------------------------------------

import type { BrandConfig, ButtonStyle } from '../../../../types/brand'

interface BrandEditorFormProps {
  brand: BrandConfig
  onUpdate: (path: string, value: unknown) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{children}</label>
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-[12px] font-bold text-gray-700 border-b border-gray-200 pb-1.5 mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </div>
  )
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 rounded border border-gray-300 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>
    </div>
  )
}

// ── Main form ────────────────────────────────────────────────────────────────

export default function BrandEditorForm({ brand, onUpdate }: BrandEditorFormProps) {
  return (
    <div className="space-y-1">
      {/* Identity */}
      <FieldGroup title="Identity">
        <TextInput label="Company Name" value={brand.companyName} onChange={(v) => onUpdate('companyName', v)} />
        <TextInput label="Logo URL" value={brand.logoUrl} onChange={(v) => onUpdate('logoUrl', v)} />
      </FieldGroup>

      {/* Colors */}
      <FieldGroup title="Colors">
        <ColorInput label="Primary" value={brand.colors.primary} onChange={(v) => onUpdate('colors.primary', v)} />
        <ColorInput label="Secondary" value={brand.colors.secondary} onChange={(v) => onUpdate('colors.secondary', v)} />
        <ColorInput label="Background" value={brand.colors.background} onChange={(v) => onUpdate('colors.background', v)} />
        <ColorInput label="Text" value={brand.colors.text} onChange={(v) => onUpdate('colors.text', v)} />
        <ColorInput label="Border" value={brand.colors.border} onChange={(v) => onUpdate('colors.border', v)} />
      </FieldGroup>

      {/* Typography */}
      <FieldGroup title="Typography">
        <div className="col-span-2">
          <TextInput label="Font Family" value={brand.typography.fontFamily} onChange={(v) => onUpdate('typography.fontFamily', v)} />
        </div>
        <NumberInput label="Weight Regular" value={brand.typography.fontWeightRegular} onChange={(v) => onUpdate('typography.fontWeightRegular', v)} />
        <NumberInput label="Weight Bold" value={brand.typography.fontWeightBold} onChange={(v) => onUpdate('typography.fontWeightBold', v)} />
        <NumberInput label="Base Size (px)" value={brand.typography.baseSizePx} onChange={(v) => onUpdate('typography.baseSizePx', v)} />
      </FieldGroup>

      {/* Border Radius */}
      <FieldGroup title="Border Radius">
        <TextInput label="Button" value={brand.borderRadius.button} onChange={(v) => onUpdate('borderRadius.button', v)} />
        <TextInput label="Card" value={brand.borderRadius.card} onChange={(v) => onUpdate('borderRadius.card', v)} />
        <TextInput label="Input" value={brand.borderRadius.input} onChange={(v) => onUpdate('borderRadius.input', v)} />
      </FieldGroup>

      {/* Spacing */}
      <FieldGroup title="Spacing">
        <NumberInput label="Unit (px)" value={brand.spacing.unit} onChange={(v) => onUpdate('spacing.unit', v)} />
        <div>
          <Label>Scale</Label>
          <input
            type="text"
            value={brand.spacing.scale.join(', ')}
            onChange={(e) => {
              const nums = e.target.value.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
              onUpdate('spacing.scale', nums)
            }}
            className="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </FieldGroup>

      {/* Button Style */}
      <FieldGroup title="Button Style">
        <div className="col-span-2">
          <Label>Shape</Label>
          <div className="flex gap-2">
            {(['pill', 'rounded', 'square'] as ButtonStyle[]).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onUpdate('buttonStyle', style)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${
                  brand.buttonStyle === style
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </FieldGroup>
    </div>
  )
}
