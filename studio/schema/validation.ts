type ImageValue = { asset?: { _ref?: string }; caption?: unknown; alt?: unknown; credit?: unknown; creditUrl?: unknown }

export function validateFigurePresence(value: ImageValue | undefined, context: { path?: readonly unknown[] }) {
  if (!value || value.asset?._ref) return true
  // Sanity materializes field defaults even for an untouched optional cover.
  const optionalCover = context.path?.some(part => part === 'heroImage' || part === 'socialImage')
  if (optionalCover && !value.caption && !value.alt && !value.credit && !value.creditUrl) return true
  return 'Add an image or remove this empty figure.'
}

export function validateFigureAlt(value: string | undefined, context: { parent?: unknown }) {
  return !(context.parent as ImageValue | undefined)?.asset?._ref || value?.trim()
    ? true : 'Describe this image with alt text.'
}
