export function slugify(value: string) {
  return value.normalize('NFKC').toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/[\s-]+/g, '-').slice(0, 100).replace(/-$/, '')
}
