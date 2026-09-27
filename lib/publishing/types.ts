export type Language = 'ko' | 'en'
export type ArticleType = 'article' | 'research-note' | 'paper-review' | 'devlog' | 'tutorial' | 'short-note'
export const articleTypes = [
  { title: 'Article', value: 'article' },
  { title: 'Research Note', value: 'research-note' },
  { title: 'Paper Review', value: 'paper-review' },
  { title: 'Devlog', value: 'devlog' },
  { title: 'Tutorial', value: 'tutorial' },
  { title: 'Short Note', value: 'short-note' },
] as const

export interface Reference { _ref: string; _type?: 'reference'; _key?: string }
export interface Taxonomy { _id: string; title: string; slug: { current: string }; description?: string }
export interface Author { _id: string; name: string; url?: string }
export interface Paper {
  _id: string; title: string; authors?: string[]; venue?: string; year?: number
  doi?: string; url?: string; projectUrl?: string; codeUrl?: string; bibtex?: string
}
export interface Figure {
  _type: 'figure'; _key: string; asset?: { _ref: string }
  caption?: string; alt?: string; credit?: string; creditUrl?: string
  layout?: 'normal' | 'wide' | 'full'; numbered?: boolean; expandable?: boolean; label?: string
}
export interface Span { _type: 'span'; _key: string; text: string; marks?: string[] }
export interface InlineMath { _type: 'inlineMath'; _key: string; latex: string }
export interface CrossReference { _type: 'crossReference'; _key: string; target: string }
export interface Mark { _key: string; _type: string; href?: string; reference?: Reference }
export interface TextBlock {
  _type: 'block'; _key: string; style?: string; listItem?: string; level?: number
  children: (Span | InlineMath | CrossReference)[]; markDefs?: Mark[]
}
export interface Equation { _type: 'equation'; _key: string; latex: string; numbered?: boolean; label?: string }
export interface CodeBlock {
  _type: 'codeBlock'; _key: string
  source?: { code?: string; language?: string; filename?: string; highlightedLines?: number[] }
  caption?: string
}
export interface Callout { _type: 'callout'; _key: string; tone?: 'note' | 'important' | 'warning' | 'summary'; title?: string; body?: TextBlock[] }
export interface TableBlock { _type: 'table'; _key: string; caption?: string; rows?: { _key: string; cells: string[] }[]; header?: boolean }
export interface PaperBlock { _type: 'paper'; _key: string; reference?: Reference }
export interface GalleryBlock { _type: 'figureGallery'; _key: string; figures?: Figure[]; columns?: number; caption?: string }
export interface DemoBlock { _type: 'demo'; _key: string; kind: 'angular-spectrum'; wavelength?: number; distance?: number }
export type BodyBlock = TextBlock | Figure | Equation | CodeBlock | Callout | TableBlock | PaperBlock | GalleryBlock | DemoBlock | { _type: 'separator'; _key: string }

export interface Post {
  _id: string; _rev?: string; _updatedAt?: string; _createdAt?: string; _type: 'post'
  title: string; slug: { current: string }; language: Language; articleType: ArticleType
  excerpt: string; body: BodyBlock[]; heroImage?: Figure
  topics?: Taxonomy[]; tags?: Taxonomy[]; series?: Taxonomy; seriesOrder?: number
  authors?: Author[]; references?: Paper[]; publishedAt?: string; updatedAt?: string
  translationOf?: Reference; translations?: { language: Language; slug: { current: string } }[]
  seo?: { title?: string; description?: string; socialImage?: Figure; noindex?: boolean }
}

export const projectId = 'f0xserx3'
export const dataset = 'production'
export const apiVersion = '2026-09-27'
export const siteUrl = 'https://dhsh.in'

export function postPath(post: Pick<Post, 'language' | 'slug'>) {
  return `/blog/${post.language}/${encodeURIComponent(post.slug.current)}/`
}
export function plainText(blocks: BodyBlock[] = []): string {
  return blocks.map(block => {
    if (block._type === 'block') return block.children.map(child => child._type === 'span' ? child.text : child._type === 'inlineMath' ? child.latex : '').join('')
    if (block._type === 'callout') return `${block.title || ''} ${plainText(block.body)}`
    if (block._type === 'codeBlock') return block.source?.code || ''
    if (block._type === 'table') return block.rows?.map(row => row.cells.join(' ')).join(' ') || ''
    return 'caption' in block ? block.caption || '' : ''
  }).join('\n')
}
export function readingMinutes(post: Pick<Post, 'body'>) {
  const text = plainText(post.body)
  const korean = (text.match(/[가-힣]/g) || []).length
  const words = text.replace(/[가-힣]/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(korean / 500 + words / 220))
}
