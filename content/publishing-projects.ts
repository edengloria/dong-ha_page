import { publications } from './publications'
import { projects } from './projects'

/** Stable project keys shared by Studio selections and both public link directions. */
export const publishingProjects = [
  ...publications.filter(item => item.kind === 'Open-source' && item.projectSlug).map(item => ({
    id: item.projectSlug!, title: item.title, href: `/projects/#${item.projectSlug}`,
  })),
  ...projects.filter(item => item.status === 'published').map(item => ({
    id: item.slug, title: item.title, href: `/projects/${item.slug}/`,
  })),
]
