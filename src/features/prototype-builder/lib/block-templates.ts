// ---------------------------------------------------------------------------
// Block Templates — HTML rendering templates for approved blocks.
//
// Pure functions. No React, no DOM APIs.
//
// Each template function takes brand tokens + slot values and returns a raw
// HTML string with inline styles using brand tokens. These are used by:
//   1. Stub provider — to generate block-structured pages without an LLM
//   2. Visual editor — to re-render a block after slot edits
//   3. Block insertion — to add a new approved block to an existing page
//
// Templates produce sections with data-block attributes so the parser
// can identify them in generated HTML.
// ---------------------------------------------------------------------------

import type { ApprovedBlock } from './block-registry'

// ---------------------------------------------------------------------------
// Brand tokens type (subset needed for rendering)
// ---------------------------------------------------------------------------

export interface BrandTokens {
  primary: string
  secondary: string
  background: string
  text: string
  border: string
  fontFamily: string
  company: string
  btnRadius: string
  cardRadius: string
  inputRadius: string
}

// ---------------------------------------------------------------------------
// Template renderer type
// ---------------------------------------------------------------------------

export type BlockRenderer = (tokens: BrandTokens, slots: Record<string, string>) => string

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

const templates: Record<string, BlockRenderer> = {
  'header-nav': renderHeaderNav,
  'hero-section': renderHeroSection,
  'two-col-content': renderTwoColContent,
  'card-grid': renderCardGrid,
  'cta-section': renderCtaSection,
  'form-section': renderFormSection,
  'footer': renderFooter,
}

/**
 * Render a single approved block to HTML.
 * Returns empty string if the block id has no template.
 */
export function renderBlock(
  blockId: string,
  tokens: BrandTokens,
  slots: Record<string, string>,
): string {
  const renderer = templates[blockId]
  if (!renderer) return ''
  return renderer(tokens, slots)
}

/**
 * Check if a block id has a registered template.
 */
export function hasTemplate(blockId: string): boolean {
  return blockId in templates
}

// ---------------------------------------------------------------------------
// Individual block templates
// ---------------------------------------------------------------------------

function renderHeaderNav(t: BrandTokens, s: Record<string, string>): string {
  const brand = s.brand || t.company
  const links = (s.links || 'Home, Features, Pricing, Contact').split(',').map((l) => l.trim())
  const cta = s.cta || 'Get Started'

  const linkHtml = links
    .map((l) => `<a href="#" style="font-size: 14px; color: ${t.text}; text-decoration: none;">${l}</a>`)
    .join('\n        ')

  return `  <nav data-block="header-nav" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid ${t.border}; background: ${t.background};">
    <div style="font-size: 18px; font-weight: 700; color: ${t.primary};">${brand}</div>
    <div style="display: flex; gap: 24px; align-items: center;">
      ${linkHtml}
      <a href="#" style="display: inline-block; padding: 8px 20px; background: ${t.primary}; color: ${t.background}; font-size: 13px; font-weight: 700; border-radius: ${t.btnRadius}; text-decoration: none;">${cta}</a>
    </div>
  </nav>`
}

function renderHeroSection(t: BrandTokens, s: Record<string, string>): string {
  const headline = s.headline || 'Transform Your Workflow'
  const subtitle = s.subtitle || 'AI-powered tools that help your team move faster.'
  const primaryCta = s.primaryCta || 'Start Free Trial'
  const secondaryCta = s.secondaryCta || 'Learn More'

  return `  <section data-block="hero-section" style="padding: 80px 32px; text-align: center; background: linear-gradient(135deg, ${t.primary} 0%, ${t.secondary} 100%);">
    <h1 style="font-size: 48px; font-weight: 700; color: ${t.background}; margin-bottom: 16px; font-family: ${t.fontFamily};">${headline}</h1>
    <p style="font-size: 20px; color: ${t.background}; opacity: 0.9; max-width: 600px; margin: 0 auto 32px; font-family: ${t.fontFamily};">${subtitle}</p>
    <div style="display: flex; gap: 16px; justify-content: center;">
      <a href="#" style="display: inline-block; padding: 14px 32px; background: ${t.background}; color: ${t.primary}; font-size: 15px; font-weight: 700; border-radius: ${t.btnRadius}; text-decoration: none;">${primaryCta}</a>
      <a href="#" style="display: inline-block; padding: 14px 32px; background: transparent; color: ${t.background}; font-size: 15px; font-weight: 700; border: 2px solid ${t.background}; border-radius: ${t.btnRadius}; text-decoration: none;">${secondaryCta}</a>
    </div>
  </section>`
}

function renderTwoColContent(t: BrandTokens, s: Record<string, string>): string {
  const heading = s.heading || 'Why Choose Us'
  const body = s.body || 'Our platform combines cutting-edge AI with enterprise-grade reliability.'
  const cta = s.cta || 'Learn More'

  return `  <section data-block="two-col-content" style="padding: 64px 32px; background: ${t.background};">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; max-width: 1100px; margin: 0 auto; align-items: center;">
      <div>
        <h2 style="font-size: 32px; font-weight: 700; color: ${t.text}; margin-bottom: 16px; font-family: ${t.fontFamily};">${heading}</h2>
        <p style="font-size: 16px; color: ${t.text}; opacity: 0.8; line-height: 1.6; margin-bottom: 24px; font-family: ${t.fontFamily};">${body}</p>
        <a href="#" style="display: inline-block; padding: 12px 28px; background: ${t.primary}; color: ${t.background}; font-size: 14px; font-weight: 700; border-radius: ${t.btnRadius}; text-decoration: none;">${cta}</a>
      </div>
      <div style="background: ${t.border}; border-radius: ${t.cardRadius}; height: 300px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 14px; color: ${t.text}; opacity: 0.4;">Image Placeholder</span>
      </div>
    </div>
  </section>`
}

function renderCardGrid(t: BrandTokens, s: Record<string, string>): string {
  const sectionTitle = s.sectionTitle || 'Our Features'
  const sectionSubtitle = s.sectionSubtitle || 'Everything you need to succeed.'
  const cards = (s.cards || 'Analytics, Automation, Security, Integrations').split(',').map((c) => c.trim())

  const cardHtml = cards
    .map(
      (title) => `      <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 32px 24px; text-align: center;">
        <div style="width: 48px; height: 48px; background: ${t.primary}; opacity: 0.1; border-radius: 12px; margin: 0 auto 16px;"></div>
        <h3 style="font-size: 18px; font-weight: 700; color: ${t.text}; margin-bottom: 8px; font-family: ${t.fontFamily};">${title}</h3>
        <p style="font-size: 14px; color: ${t.text}; opacity: 0.7; line-height: 1.5; font-family: ${t.fontFamily};">Powerful ${title.toLowerCase()} capabilities designed for enterprise teams.</p>
      </div>`,
    )
    .join('\n')

  return `  <section data-block="card-grid" style="padding: 64px 32px; background: ${t.background};">
    <div style="text-align: center; margin-bottom: 40px;">
      <h2 style="font-size: 32px; font-weight: 700; color: ${t.text}; margin-bottom: 12px; font-family: ${t.fontFamily};">${sectionTitle}</h2>
      <p style="font-size: 16px; color: ${t.text}; opacity: 0.7; font-family: ${t.fontFamily};">${sectionSubtitle}</p>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto;">
${cardHtml}
    </div>
  </section>`
}

function renderCtaSection(t: BrandTokens, s: Record<string, string>): string {
  const headline = s.headline || 'Ready to Get Started?'
  const subtitle = s.subtitle || 'Join thousands of teams already using our platform.'
  const buttonLabel = s.buttonLabel || 'Start Free Trial'

  return `  <section data-block="cta-section" style="padding: 64px 32px; text-align: center; background: ${t.primary};">
    <h2 style="font-size: 32px; font-weight: 700; color: ${t.background}; margin-bottom: 12px; font-family: ${t.fontFamily};">${headline}</h2>
    <p style="font-size: 16px; color: ${t.background}; opacity: 0.9; margin-bottom: 28px; font-family: ${t.fontFamily};">${subtitle}</p>
    <a href="#" style="display: inline-block; padding: 14px 36px; background: ${t.background}; color: ${t.primary}; font-size: 15px; font-weight: 700; border-radius: ${t.btnRadius}; text-decoration: none;">${buttonLabel}</a>
  </section>`
}

function renderFormSection(t: BrandTokens, s: Record<string, string>): string {
  const heading = s.heading || 'Get in Touch'
  const subtitle = s.subtitle || "We'd love to hear from you."
  const fields = (s.fields || 'Name, Email, Message').split(',').map((f) => f.trim())
  const submitLabel = s.submitLabel || 'Send Message'

  const fieldHtml = fields
    .map((field) => {
      const isTextarea = field.toLowerCase() === 'message' || field.toLowerCase() === 'description'
      const inputEl = isTextarea
        ? `<textarea placeholder="${field}" rows="4" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; resize: vertical;"></textarea>`
        : `<input type="${field.toLowerCase().includes('email') ? 'email' : 'text'}" placeholder="${field}" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily};" />`
      return `        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">${field}</label>
          ${inputEl}
        </div>`
    })
    .join('\n')

  return `  <section data-block="form-section" style="padding: 64px 32px; background: ${t.background};">
    <div style="max-width: 560px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="font-size: 28px; font-weight: 700; color: ${t.text}; margin-bottom: 8px; font-family: ${t.fontFamily};">${heading}</h2>
        <p style="font-size: 15px; color: ${t.text}; opacity: 0.7; font-family: ${t.fontFamily};">${subtitle}</p>
      </div>
      <form onsubmit="return false">
${fieldHtml}
        <button type="submit" style="width: 100%; padding: 14px; background: ${t.primary}; color: ${t.background}; font-size: 15px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">${submitLabel}</button>
      </form>
    </div>
  </section>`
}

function renderFooter(t: BrandTokens, s: Record<string, string>): string {
  const copyright = (s.copyright || `© ${new Date().getFullYear()} ${t.company}. All rights reserved.`)
    .replace('{year}', String(new Date().getFullYear()))
    .replace('{companyName}', t.company)
  const links = (s.links || 'Privacy Policy, Terms of Service, Contact').split(',').map((l) => l.trim())

  const linkHtml = links
    .map((l) => `<a href="#" style="color: ${t.text}; opacity: 0.5; text-decoration: none; font-size: 12px;">${l}</a>`)
    .join('\n        ')

  return `  <footer data-block="footer" style="padding: 24px 32px; border-top: 1px solid ${t.border}; background: ${t.background}; text-align: center;">
    <div style="display: flex; gap: 24px; justify-content: center; margin-bottom: 12px;">
      ${linkHtml}
    </div>
    <p style="font-size: 12px; color: ${t.text}; opacity: 0.5;">${copyright}</p>
  </footer>`
}
