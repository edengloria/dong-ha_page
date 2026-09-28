import { defineConfig } from 'sanity'
import { structureTool, type StructureResolver } from 'sanity/structure'
import { codeInput } from '@sanity/code-input'
import { blocks } from './schema/blocks'
import { documents } from './schema/documents'
import { blogComment } from './schema/comments'
import { withPublicationMetadata } from './actions/publish'
import { ArticlePreview } from './components/preview'
import { projectId, dataset, apiVersion } from '../lib/publishing/types'

const structure: StructureResolver = S => S.list().title('dhsh.in').items([
  S.documentTypeListItem('post').title('Posts'),
  S.listItem().title('Drafts').child(S.documentList().apiVersion(apiVersion).title('Drafts').filter('_type == "post" && _id in path("drafts.**")')),
  S.listItem().title('Korean').child(S.documentList().apiVersion(apiVersion).title('Korean posts').filter('_type == "post" && language == "ko"')),
  S.listItem().title('English').child(S.documentList().apiVersion(apiVersion).title('English posts').filter('_type == "post" && language == "en"')),
  S.divider(),
  S.listItem().title('Comments & Guestbook').child(S.documentList().apiVersion(apiVersion).title('Comments & Guestbook').filter('_type == "blogComment" && _id in path("blogComment.*") && !defined(deletedAt)').defaultOrdering([{ field: 'createdAt', direction: 'desc' }]).canHandleIntent(() => false)),
  ...[['series', 'Series'], ['referenceRecord', 'References'], ['topic', 'Topics'], ['tag', 'Tags']].map(([type, title]) => S.listItem().title(title).child(S.documentList().apiVersion(apiVersion).title(title).filter('_type == $type && !defined(migratedTo)').params({ type }))),
  S.divider(),
  S.listItem().title('Media').child(S.documentList().apiVersion(apiVersion).title('Uploaded images').filter('_type == "sanity.imageAsset"')),
  S.listItem().title('Authors').child(S.documentList().apiVersion(apiVersion).title('Authors').filter('_type == "author" && !defined(migratedTo)')),
  S.listItem().title('Site Settings').child(S.document().schemaType('siteSettings').documentId('site-settings')),
])

export default defineConfig({
  name: 'dhsh', title: 'dhsh.in · Research & Engineering', projectId, dataset,
  // The CLI deployment base already prefixes workspace routes with /studio.
  basePath: '/',
  releases: { enabled: false }, tasks: { enabled: false }, scheduledDrafts: { enabled: false },
  plugins: [codeInput(), structureTool({ structure, defaultDocumentNode: (S, { schemaType }) => schemaType === 'post' ? S.document().views([S.view.form().title('Write'), S.view.component(ArticlePreview).title('Preview')]) : S.document().views([S.view.form()]) })],
  schema: { types: [...blocks, ...documents, blogComment], templates: templates => templates.filter(template => template.schemaType !== 'blogComment') },
  document: { actions: (actions, context) => context.schemaType === 'blogComment' ? actions.filter(action => action.action === 'delete') : context.schemaType === 'post' ? actions.map(action => action.action === 'publish' ? withPublicationMetadata(action) : action) : actions },
})
