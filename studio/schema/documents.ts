import { defineType, defineField, defineArrayMember, type SlugValidationContext } from 'sanity'
import { articleTypes, apiVersion } from '../../lib/publishing/types'
import { slugify } from '../components/slug-input'
import { PostInput } from '../components/post-input'
import { BodyInput } from '../components/body-input'

const slug = defineField({ name: 'slug', title: 'URL name', type: 'slug', options: { source: 'title', slugify }, validation: rule => rule.required().custom(value => !value?.current || /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(value.current) ? true : 'Start with a letter or number. Use letters, numbers, hyphens or underscores; no spaces or slashes.') })
const url = (name: string, title: string) => defineField({ name, title, type: 'url', validation: rule => rule.uri({ scheme: ['http', 'https'] }) })
async function uniquePostSlug(value: string, { document, getClient }: SlugValidationContext) {
  const id = String(document?._id || '').replace(/^drafts\./, '')
  return getClient({ apiVersion }).fetch<boolean>(
    '!defined(*[_type == "post" && language == $language && slug.current == $slug && !(_id in [$id, $draft])][0]._id)',
    { language: document?.language || 'ko', slug: value, id, draft: `drafts.${id}` },
    { perspective: 'raw' },
  )
}

export const documents = [
  defineType({
    name: 'post', title: 'Post', type: 'document',
    components: { input: PostInput },
    groups: [{ name: 'write', title: 'Write', default: true }, { name: 'organize', title: 'Organize' }, { name: 'settings', title: 'Settings' }],
    fieldsets: [{ name: 'seo', title: 'Advanced SEO', options: { collapsible: true, collapsed: true } }, { name: 'dates', title: 'Publication details', options: { collapsible: true, collapsed: true } }],
    initialValue: { language: 'ko', articleType: 'research-note', authors: [{ _type: 'reference', _ref: 'author-dong-ha-shin', _key: 'dongha' }] },
    fields: [
      defineField({ name: 'title', title: 'Title', type: 'string', group: 'write', validation: rule => rule.required().max(180) }),
      defineField({ name: 'excerpt', title: 'Short introduction', description: 'Shown below the title and in search results.', type: 'text', rows: 3, group: 'write', validation: rule => rule.required().max(500) }),
      defineField({ name: 'body', title: 'Article', type: 'body', group: 'write', components: { input: BodyInput }, validation: rule => rule.required().min(1) }),
      defineField({ name: 'language', title: 'Language', type: 'string', group: 'organize', options: { list: [{ title: '한국어', value: 'ko' }, { title: 'English', value: 'en' }], layout: 'radio' }, readOnly: ({ document }) => Boolean(document?.publishedAt), validation: rule => rule.required() }),
      defineField({ name: 'articleType', title: 'Article type', type: 'string', group: 'organize', options: { list: [...articleTypes] }, validation: rule => rule.required() }),
      defineField({ name: 'topics', title: 'Topics', type: 'array', group: 'organize', of: [defineArrayMember({ type: 'reference', to: [{ type: 'topic' }], options: { filter: '!defined(migratedTo)' } })], validation: rule => rule.unique() }),
      defineField({ name: 'tags', title: 'Tags', type: 'array', group: 'organize', of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }], options: { filter: '!defined(migratedTo)' } })], validation: rule => rule.unique() }),
      defineField({ name: 'series', title: 'Series', type: 'reference', group: 'organize', to: [{ type: 'series' }], options: { filter: '!defined(migratedTo)' } }),
      defineField({ name: 'seriesOrder', title: 'Part number', type: 'number', group: 'organize', hidden: ({ document }) => !document?.series, validation: rule => rule.integer().positive() }),
      defineField({ name: 'references', title: 'References', type: 'array', group: 'organize', of: [defineArrayMember({ type: 'reference', to: [{ type: 'referenceRecord' }], options: { filter: '!defined(migratedTo)' } })], validation: rule => rule.unique() }),
      defineField({ name: 'translationOf', title: 'Translation of', type: 'reference', group: 'organize', to: [{ type: 'post' }], options: { filter: ({ document }) => ({ filter: 'language != $language && _id != $id', params: { language: document.language || 'ko', id: document._id.replace(/^drafts\./, '') } }) } }),
      defineField({ ...slug, options: { ...slug.options, isUnique: uniquePostSlug }, group: 'settings', readOnly: ({ document }) => Boolean(document?.publishedAt), description: 'Generated from the title before first publication. Locked after publication to keep links stable.' }),
      defineField({ name: 'authors', title: 'Authors', type: 'array', group: 'settings', of: [defineArrayMember({ type: 'reference', to: [{ type: 'author' }], options: { filter: '!defined(migratedTo)' } })], validation: rule => rule.required().min(1) }),
      defineField({ name: 'heroImage', title: 'Cover image (optional)', type: 'figure', group: 'settings', options: { collapsible: true, collapsed: true } }),
      defineField({ name: 'publishedAt', title: 'First published', type: 'datetime', group: 'settings', fieldset: 'dates', readOnly: true }),
      defineField({ name: 'updatedAt', title: 'Last published update', type: 'datetime', group: 'settings', fieldset: 'dates', readOnly: true }),
      defineField({ name: 'canonicalSlug', type: 'string', hidden: true, readOnly: true }),
      defineField({ name: 'generatedSlug', type: 'string', hidden: true, readOnly: true }),
      defineField({ name: 'canonicalLanguage', type: 'string', hidden: true, readOnly: true }),
      defineField({ name: 'seo', title: 'Search and social', type: 'object', group: 'settings', fieldset: 'seo', fields: [
        defineField({ name: 'title', title: 'SEO title override', type: 'string', validation: rule => rule.max(180) }),
        defineField({ name: 'description', title: 'Description override', type: 'text', rows: 3, validation: rule => rule.max(300) }),
        defineField({ name: 'socialImage', title: 'Social image override', type: 'figure' }),
        defineField({ name: 'noindex', title: 'Exclude this published article from search engines', type: 'boolean', initialValue: false }),
      ] }),
    ],
    preview: { select: { title: 'title', language: 'language', type: 'articleType', media: 'heroImage' }, prepare: ({ title, language, type, media }) => ({ title: title || 'Untitled post', subtitle: `${String(language || '').toUpperCase()} · ${type || 'Research Note'}`, media }) },
    orderings: [{ title: 'Recently edited', name: 'updated', by: [{ field: '_updatedAt', direction: 'desc' }] }],
  }),
  ...['topic', 'tag', 'series'].map(name => defineType({
    name, title: name[0].toUpperCase() + name.slice(1), type: 'document',
    fields: [defineField({ name: 'title', title: 'Name', type: 'string', validation: rule => rule.required() }), slug, defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 })],
  })),
  defineType({ name: 'author', title: 'Author', type: 'document', fields: [defineField({ name: 'name', title: 'Name', type: 'string', validation: rule => rule.required() }), url('url', 'Profile URL')] }),
  defineType({ name: 'referenceRecord', title: 'Reference', type: 'document', fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'authors', title: 'Authors', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'venue', title: 'Venue', type: 'string' }), defineField({ name: 'year', title: 'Year', type: 'number', validation: rule => rule.integer().min(1600).max(2200) }),
    defineField({ name: 'doi', title: 'DOI', type: 'string', description: 'For example: 10.1364/OE.17.019662' }),
    url('url', 'Paper / source URL'), url('projectUrl', 'Project URL'), url('codeUrl', 'Code URL'),
    defineField({ name: 'bibtex', title: 'BibTeX (optional)', type: 'text', rows: 5 }),
  ], preview: { select: { title: 'title', subtitle: 'venue' } } }),
  defineType({ name: 'siteSettings', title: 'Site Settings', type: 'document', fields: [
    defineField({ name: 'blogTitle', title: 'Blog title', type: 'string', initialValue: 'Research & Engineering Notes' }),
    defineField({ name: 'blogDescription', title: 'Blog description', type: 'text', rows: 3 }),
  ] }),
]
