import { publications } from '@/content/publications'
import { projects } from '@/content/projects'
import { withBasePath } from '@/lib/paths'

export function ProjectsIndex() {
  return <section><h1 className="page-title">Projects</h1>
    {publications.filter(item => item.kind === 'Open-source').map(project => <article key={project.title} className="mb-8"><h2 className="font-bold text-xl mb-2">{project.title}</h2><p className="mb-2 text-sm">Open-source · {project.venue}</p><div className="flex gap-4">{project.links.map(link => <a key={link.href} href={link.href} className="meta-link" target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div></article>)}
    {projects.filter(project => project.status === 'published').map(project => <article key={project.slug} className="mb-8"><h2><a className="meta-link" href={withBasePath(`/projects/${project.slug}/`)}>{project.title}</a></h2><p>{project.summary}</p></article>)}
  </section>
}
