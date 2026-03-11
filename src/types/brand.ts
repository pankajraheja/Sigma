// ---------------------------------------------------------------------------
// BrandConfig — strict type for admin-configured brand tokens.
//
// Extensible by design: future phases can add component rules, taxonomy
// constraints, and admin-managed token overrides without breaking this shape.
// ---------------------------------------------------------------------------

export interface BrandColors {
  primary: string
  secondary: string
  background: string
  text: string
  border: string
}

export interface BrandTypography {
  fontFamily: string
  fontWeightRegular: number
  fontWeightBold: number
  baseSizePx: number
}

export interface BrandBorderRadius {
  button: string
  card: string
  input: string
}

export interface BrandSpacing {
  unit: number
  scale: number[]
}

export type ButtonStyle = 'pill' | 'rounded' | 'square'

export interface BrandConfig {
  colors: BrandColors
  typography: BrandTypography
  borderRadius: BrandBorderRadius
  spacing: BrandSpacing
  logoUrl: string
  companyName: string
  buttonStyle: ButtonStyle
}
