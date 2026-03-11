// ---------------------------------------------------------------------------
// BrandPreview — live component showcase rendered using active BrandConfig.
// Uses inline styles only for the preview surface to isolate from admin shell.
// ---------------------------------------------------------------------------

import type { BrandConfig } from '../../../../types/brand'

interface BrandPreviewProps {
  brand: BrandConfig
}

function btnRadius(brand: BrandConfig): string {
  switch (brand.buttonStyle) {
    case 'pill':    return '9999px'
    case 'rounded': return '8px'
    case 'square':  return '2px'
  }
}

export default function BrandPreview({ brand }: BrandPreviewProps) {
  const { colors, typography, borderRadius, spacing } = brand
  const unit = spacing.unit

  return (
    <div
      style={{
        fontFamily: typography.fontFamily,
        fontSize: `${typography.baseSizePx}px`,
        fontWeight: typography.fontWeightRegular,
        color: colors.text,
        background: colors.background,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Top nav / header ─────────────────────────────────────── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${unit * 3}px ${unit * 5}px`,
          background: colors.primary,
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: `${unit * 2}px` }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: typography.fontWeightBold,
            }}
          >
            {brand.companyName.charAt(0)}
          </div>
          <span style={{ fontWeight: typography.fontWeightBold, fontSize: '14px' }}>
            {brand.companyName} Workspace
          </span>
        </div>
        <div style={{ display: 'flex', gap: `${unit * 4}px`, fontSize: '13px', opacity: 0.85 }}>
          <span>Home</span>
          <span>Catalog</span>
          <span>Builder</span>
        </div>
      </nav>

      {/* ── Hero section ─────────────────────────────────────────── */}
      <div
        style={{
          padding: `${unit * 8}px ${unit * 5}px`,
          background: colors.secondary,
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontWeight: typography.fontWeightBold, fontSize: '20px', marginBottom: `${unit * 2}px` }}>
          Welcome to {brand.companyName}
        </h2>
        <p style={{ fontSize: '13px', opacity: 0.85, marginBottom: `${unit * 4}px` }}>
          AI-powered enterprise workspace tailored to your brand.
        </p>
        <button
          type="button"
          style={{
            padding: `${unit * 2}px ${unit * 6}px`,
            borderRadius: btnRadius(brand),
            background: '#FFFFFF',
            color: colors.secondary,
            fontWeight: typography.fontWeightBold,
            fontSize: '13px',
            border: 'none',
            cursor: 'default',
          }}
        >
          Get Started
        </button>
      </div>

      {/* ── Card + Input + Buttons showcase ──────────────────────── */}
      <div style={{ padding: `${unit * 5}px` }}>
        {/* Card */}
        <div
          style={{
            borderRadius: borderRadius.card,
            border: `1px solid ${colors.border}`,
            padding: `${unit * 4}px`,
            marginBottom: `${unit * 4}px`,
          }}
        >
          <h3 style={{ fontWeight: typography.fontWeightBold, fontSize: '14px', marginBottom: `${unit}px` }}>
            Sample Card
          </h3>
          <p style={{ fontSize: '13px', color: colors.text, opacity: 0.7 }}>
            This card uses your configured border radius and spacing tokens.
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: `${unit * 4}px` }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: typography.fontWeightBold, marginBottom: `${unit}px`, opacity: 0.7 }}>
            Sample Input
          </label>
          <input
            type="text"
            placeholder="Type something..."
            readOnly
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: `${unit * 2}px ${unit * 3}px`,
              borderRadius: borderRadius.input,
              border: `1px solid ${colors.border}`,
              fontSize: '13px',
              fontFamily: typography.fontFamily,
              color: colors.text,
              background: colors.background,
              outline: 'none',
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: `${unit * 3}px` }}>
          <button
            type="button"
            style={{
              padding: `${unit * 2}px ${unit * 5}px`,
              borderRadius: btnRadius(brand),
              background: colors.primary,
              color: '#FFFFFF',
              fontWeight: typography.fontWeightBold,
              fontSize: '13px',
              border: 'none',
              cursor: 'default',
            }}
          >
            Primary
          </button>
          <button
            type="button"
            style={{
              padding: `${unit * 2}px ${unit * 5}px`,
              borderRadius: btnRadius(brand),
              background: 'transparent',
              color: colors.secondary,
              fontWeight: typography.fontWeightBold,
              fontSize: '13px',
              border: `1.5px solid ${colors.secondary}`,
              cursor: 'default',
            }}
          >
            Secondary
          </button>
        </div>
      </div>
    </div>
  )
}
