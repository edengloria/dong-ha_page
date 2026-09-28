import { useState } from 'react'
import { useDocumentOperation, type DocumentActionComponent } from 'sanity'

/** Keep metadata in Studio's mutation queue so typing then publishing cannot race it. */
export function withPublicationMetadata(Publish: DocumentActionComponent): DocumentActionComponent {
  const Action: DocumentActionComponent = props => {
    const original = Publish(props)
    const { patch } = useDocumentOperation(props.id, props.type)
    const [error, setError] = useState<string>()
    if (!original) return null
    return {
      ...original,
      dialog: error ? { type: 'dialog', header: 'Could not publish', content: <p>{error}</p>, onClose: () => setError(undefined) } : original.dialog,
      onHandle: () => {
        setError(undefined)
        try {
          const draft = props.draft
          if (!draft) throw new Error('There is no draft to publish yet.')
          const slug = (draft.slug as { current?: string } | undefined)?.current
          if (!slug || !draft.language) throw new Error('Choose a title, URL name, and language first.')
          if ((draft.canonicalSlug && draft.canonicalSlug !== slug) || (draft.canonicalLanguage && draft.canonicalLanguage !== draft.language)) throw new Error('This article already has a permanent URL. Restore its original URL name and language before publishing.')
          const now = new Date().toISOString()
          patch.execute([{ set: { updatedAt: now } }, { setIfMissing: { publishedAt: now, canonicalSlug: slug, canonicalLanguage: draft.language } }])
          original.onHandle?.()
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Publishing could not start. Return to Write to check the save status.') }
      },
    }
  }
  Action.action = 'publish'
  return Action
}
