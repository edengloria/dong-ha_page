import { publications } from '@/content/publications'
import { projects } from '@/content/projects'
import { withBasePath } from '@/lib/paths'
import { postPath, type Post } from '@/lib/publishing/types'

export function ProjectsIndex({ posts = [] }: { posts?: Post[] }) {
  const related = (id?: string) => {
    const articles = id ? posts.filter(post => post.projects?.includes(id)) : []
    return articles.length > 0 && <div className="mt-4"><h3 className="font-bold text-sm">Related writing</h3><ul>{articles.map(post => <li key={post._id}><a className="meta-link" href={withBasePath(postPath(post))}>{post.title}</a> <span lang={post.language}>({post.language})</span></li>)}</ul></div>
  }
  return <section><h1 className="page-title">Projects</h1>
    {publications.filter(item => item.kind === 'Open-source').map(project => <article id={project.projectSlug} key={project.title} className="mb-8"><h2 className="font-bold text-xl mb-2">{project.title}</h2><p className="mb-2 text-sm">Open-source · {project.venue}</p><div className="flex gap-4">{project.links.map(link => <a key={link.href} href={link.href} className="meta-link" target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div>{related(project.projectSlug)}</article>)}
    {projects.filter(project => project.status === 'published').map(project => <article key={project.slug} className="mb-8"><h2><a className="meta-link" href={withBasePath(`/projects/${project.slug}/`)}>{project.title}</a></h2><p>{project.summary}</p>{related(project.slug)}</article>)}
  </section>
}
