import { useEffect } from 'react'
import { set, type ObjectInputProps } from 'sanity'
import { slugify } from './slug-input'
import { DeploymentStatus } from './deployment-status'

export function PostInput(props: ObjectInputProps) {
  const title = String(props.value?.title || '')
  const current = (props.value?.slug as { current?: string } | undefined)?.current
  const generated = props.value?.generatedSlug
  const published = props.value?.publishedAt
  const { onChange } = props
  useEffect(() => {
    if (published || !title || (current && current !== generated)) return
    const slug = slugify(title)
    if (!slug || slug === current) return
    const timeout = setTimeout(() => onChange([set({ _type: 'slug', current: slug }, ['slug']), set(slug, ['generatedSlug'])]), 400)
    return () => clearTimeout(timeout)
  }, [title, current, generated, published, onChange])
  return <>{props.value?._id && <DeploymentStatus id={String(props.value._id)} />}{props.renderDefault(props)}</>
}
