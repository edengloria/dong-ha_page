import { useState } from 'react'
import { useClient, type DocumentActionComponent } from 'sanity'
import { apiVersion } from '../../lib/publishing/types'

/** Metadata is committed before the publish action promotes this exact draft. */
export function withPublicationMetadata(Publish: DocumentActionComponent): DocumentActionComponent {
  const Action: DocumentActionComponent = props => {
    const original = Publish(props)
    const client = useClient({ apiVersion })
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string>()
    if (!original) return null
    return {
      ...original, label: busy ? 'Publishing…' : 'Publish', disabled: original.disabled || busy,
      dialog: error ? { type: 'dialog', header: 'Could not publish', content: <p>{error}</p>, onClose: () => setError(undefined) } : original.dialog,
      onHandle: async () => {
        setBusy(true); setError(undefined)
        try {
          const id = props.id.replace(/^drafts\./, '')
          const draft = await client.getDocument(`drafts.${id}`)
          if (!draft) throw new Error('There is no saved draft yet. Wait for “Saved” and try again.')
          const slug = (draft.slug as { current?: string } | undefined)?.current
          if (!slug || !draft.language) throw new Error('Choose a title, URL name, and language first.')
          if ((draft.canonicalSlug && draft.canonicalSlug !== slug) || (draft.canonicalLanguage && draft.canonicalLanguage !== draft.language)) throw new Error('This article already has a permanent URL. Restore its original URL name and language before publishing.')
          const now = new Date().toISOString()
          await client.patch(draft._id).ifRevisionId(draft._rev).set({ updatedAt: now }).setIfMissing({ publishedAt: now, canonicalSlug: slug, canonicalLanguage: draft.language }).commit()
          await client.action({ actionType: 'sanity.action.document.publish', draftId: draft._id, publishedId: id })
          props.onComplete()
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Publishing failed. Your draft is saved.') }
        finally { setBusy(false) }
      },
    }
  }
  Action.action = 'publish'
  return Action
}
