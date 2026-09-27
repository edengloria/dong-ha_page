import { defineType, defineField, defineArrayMember } from 'sanity'
import { MathInput, MathPreview, InlineMathPreview } from '../components/math-input'
import { TableInput } from '../components/table-input'
import { CodePreview, CalloutPreview } from '../components/block-previews'
import { plainText, type TextBlock, type BodyBlock } from '../../lib/publishing/types'
import { validateFigurePresence, validateFigureAlt } from './validation'
import { CrossReferenceInput } from '../components/cross-reference-input'

const link = defineArrayMember({
  name: 'link', type: 'object', title: 'Link',
  fields: [defineField({ name: 'href', type: 'url', title: 'URL', validation: r => r.required().uri({ scheme: ['http', 'https', 'mailto'], allowRelative: false }) })],
})
export const paragraph = defineArrayMember({
  type: 'block',
  styles: [
    { title: 'Paragraph', value: 'normal' }, { title: 'Heading 2', value: 'h2' },
    { title: 'Heading 3', value: 'h3' }, { title: 'Heading 4', value: 'h4' },
    { title: 'Quote', value: 'blockquote' },
  ],
  lists: [{ title: 'Bullet list', value: 'bullet' }, { title: 'Numbered list', value: 'number' }],
  marks: {
    decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }, { title: 'Inline code', value: 'code' }],
    annotations: [link, defineArrayMember({ name: 'citation', title: 'Cite a reference', type: 'object', fields: [defineField({ name: 'reference', title: 'Reference', type: 'reference', to: [{ type: 'referenceRecord' }], options: { filter: '!defined(migratedTo)' }, validation: r => r.required() })] })],
  },
  of: [defineArrayMember({ type: 'inlineMath' }), defineArrayMember({ type: 'crossReference' })],
})

export const blocks = [
  defineType({ name: 'crossReference', title: 'Figure / equation reference', type: 'object', fields: [
    defineField({ name: 'target', title: 'Refer to', type: 'string', components: { input: CrossReferenceInput }, validation: r => r.required().custom((value, context) => {
      if (!value) return true
      const body = (context.document?.body || []) as BodyBlock[]
      return body.flatMap(block => block._type === 'figureGallery' ? block.figures || [] : [block]).some(block => (block._type === 'figure' || block._type === 'equation') && block._key === value && block.numbered !== false) || 'The selected numbered block was removed. Choose another target.'
    }) }),
  ], preview: { prepare: () => ({ title: 'Figure / equation reference' }) } }),
  defineType({ name: 'figureGallery', title: 'Figure gallery', type: 'object', fields: [
    defineField({ name: 'figures', title: 'Figures', type: 'array', of: [{ type: 'figure' }], validation: r => r.required().min(2).max(12) }),
    defineField({ name: 'columns', title: 'Desktop columns', type: 'number', options: { list: [2, 3], layout: 'radio' }, initialValue: 2 }),
    defineField({ name: 'caption', title: 'Gallery caption (optional)', type: 'string' }),
  ], preview: { select: { title: 'caption', media: 'figures.0.asset' }, prepare: ({ title, media }) => ({ title: title || 'Figure gallery', media }) } }),
  defineType({ name: 'paper', title: 'Paper card', type: 'object', fields: [defineField({ name: 'reference', title: 'Paper from reference library', type: 'reference', to: [{ type: 'referenceRecord' }], options: { filter: '!defined(migratedTo)' }, validation: r => r.required() })], preview: { select: { title: 'reference.title', subtitle: 'reference.venue' } } }),
  defineType({ name: 'demo', title: 'Interactive optical demo', type: 'object', fields: [
    defineField({ name: 'kind', title: 'Registered demo', type: 'string', options: { list: [{ title: '1D Angular Spectrum propagation', value: 'angular-spectrum' }] }, initialValue: 'angular-spectrum', validation: r => r.required() }),
    defineField({ name: 'wavelength', title: 'Initial wavelength (nm)', type: 'number', initialValue: 532, validation: r => r.min(380).max(780) }),
    defineField({ name: 'distance', title: 'Initial distance (mm)', type: 'number', initialValue: 30, validation: r => r.min(0).max(120) }),
  ], preview: { prepare: () => ({ title: 'Angular Spectrum Demo', subtitle: 'Registered component · no CMS scripts' }) } }),
  defineType({
    name: 'figure', title: 'Figure / image', type: 'image',
    options: { hotspot: false, accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif' },
    validation: rule => rule.custom(validateFigurePresence),
    fields: [
      defineField({ name: 'caption', title: 'Caption', type: 'text', rows: 2 }),
      defineField({ name: 'alt', title: 'Alt text', type: 'string', description: 'Describe the figure for readers who cannot see it.', validation: r => r.custom(validateFigureAlt) }),
      defineField({ name: 'credit', title: 'Credit / source', type: 'string' }),
      defineField({ name: 'creditUrl', title: 'Source URL', type: 'url', validation: r => r.uri({ scheme: ['https', 'http'] }) }),
      defineField({ name: 'layout', title: 'Layout', type: 'string', options: { list: [{ title: 'Normal', value: 'normal' }, { title: 'Wide', value: 'wide' }, { title: 'Full width', value: 'full' }], layout: 'radio' }, initialValue: 'normal' }),
      defineField({ name: 'numbered', title: 'Number this figure automatically', type: 'boolean', initialValue: true }),
      defineField({ name: 'expandable', title: 'Click to view original', type: 'boolean', initialValue: true }),
      defineField({ name: 'label', title: 'Short label (optional)', type: 'string' }),
    ],
    preview: { select: { title: 'caption', subtitle: 'alt', media: 'asset' }, prepare: ({ title, subtitle, media }) => ({ title: title || 'Figure', subtitle, media }) },
  }),
  defineType({
    name: 'inlineMath', title: 'Inline equation', type: 'object',
    fields: [defineField({ name: 'latex', title: 'LaTeX', type: 'text', rows: 2, components: { input: MathInput }, validation: r => r.required() })],
    preview: { select: { title: 'latex' } }, components: { preview: InlineMathPreview },
  }),
  defineType({
    name: 'equation', title: 'Equation', type: 'object',
    fields: [
      defineField({ name: 'latex', title: 'LaTeX', type: 'text', rows: 4, components: { input: MathInput }, validation: r => r.required() }),
      defineField({ name: 'numbered', title: 'Number automatically', type: 'boolean', initialValue: true }),
      defineField({ name: 'label', title: 'Label (optional)', type: 'string' }),
    ], preview: { select: { title: 'latex' } }, components: { preview: MathPreview },
  }),
  defineType({
    name: 'codeBlock', title: 'Code', type: 'object',
    fields: [
      defineField({ name: 'source', title: 'Code', type: 'code', options: { withFilename: true, language: 'python', languageAlternatives: [{ title: 'Python', value: 'python' }, { title: 'C++ / CUDA', value: 'cpp' }, { title: 'JavaScript', value: 'javascript' }, { title: 'TypeScript', value: 'typescript' }, { title: 'GLSL', value: 'glsl' }, { title: 'Shell', value: 'bash' }, { title: 'JSON', value: 'json' }, { title: 'Plain text', value: 'text' }] }, validation: r => r.required() }),
      defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
    ], preview: { select: { title: 'source.filename', subtitle: 'source.language', code: 'source.code' }, prepare: ({ title, subtitle, code }) => ({ title: title || 'Code', subtitle, code }) }, components: { preview: CodePreview },
  }),
  defineType({
    name: 'callout', title: 'Callout', type: 'object',
    fields: [
      defineField({ name: 'tone', title: 'Kind', type: 'string', options: { list: ['note', 'important', 'warning', 'summary'] }, initialValue: 'note' }),
      defineField({ name: 'title', title: 'Title (optional)', type: 'string' }),
      defineField({ name: 'body', title: 'Text', type: 'array', of: [paragraph], validation: r => r.required() }),
    ], preview: { select: { title: 'title', subtitle: 'tone', body: 'body' }, prepare: ({ title, subtitle, body }) => ({ title: title || 'Callout', subtitle, text: plainText((body || []) as TextBlock[]) }) }, components: { preview: CalloutPreview },
  }),
  defineType({
    name: 'table', title: 'Table', type: 'object', components: { input: TableInput },
    fields: [
      defineField({ name: 'caption', type: 'string', title: 'Caption' }),
      defineField({ name: 'header', type: 'boolean', title: 'First row is a header', initialValue: true }),
      defineField({ name: 'rows', type: 'array', of: [defineArrayMember({ name: 'tableRow', type: 'object', fields: [defineField({ name: 'cells', type: 'array', of: [{ type: 'string' }] })] })] }),
    ], preview: { select: { title: 'caption' }, prepare: ({ title }) => ({ title: title || 'Table' }) },
  }),
  defineType({ name: 'separator', title: 'Horizontal separator', type: 'object', fields: [defineField({ name: 'style', type: 'string', hidden: true, initialValue: 'rule' })], preview: { prepare: () => ({ title: '────────────' }) } }),
  defineType({ name: 'body', title: 'Article', type: 'array', of: [paragraph, ...['figure', 'equation', 'codeBlock', 'callout', 'table', 'separator', 'figureGallery', 'paper', 'demo'].map(type => defineArrayMember({ type }))] }),
]
