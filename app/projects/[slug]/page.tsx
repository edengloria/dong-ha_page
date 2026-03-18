import { notFound } from "next/navigation"
import { projects } from "@/content/projects"
import { createMetadata } from "@/lib/metadata"

type ProjectPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = projects.find((entry) => entry.slug === slug)

  if (!project) {
    return createMetadata({
      title: "Projects",
      description: "Project archive for Dong-Ha Shin.",
      path: "/projects",
    })
  }

  return createMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
  })
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = projects.find((entry) => entry.slug === slug)

  if (!project || project.status !== "published") {
    notFound()
  }

  return (
    <article className="content-stack">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground/75">
          Project
        </p>
        <div className="space-y-2">
          <h1 className="page-title">{project.title}</h1>
          <p className="copy-paragraph max-w-3xl">{project.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/50 bg-background/20 px-3 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section className="copy-stack">
        {project.description.map((paragraph) => (
          <p key={paragraph} className="copy-paragraph">
            {paragraph}
          </p>
        ))}
      </section>
    </article>
  )
}
