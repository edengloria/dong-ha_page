import { SiteShell } from "./site-shell"
import { AboutSection } from "@/components/home/about-section"
import { PublicationsSection } from "@/components/home/publications-section"
import { GalleryTabs } from "@/components/gallery/gallery-tabs"
import { VinylGalleryView } from "@/components/gallery/vinyl-gallery-view"
import { PhotoGallery } from "@/components/gallery/photo-gallery"
import { RecordDocument } from "@/components/gallery/record-document"
import { ProjectDocument } from "@/components/content/project-document"
import { ProjectsIndex } from "@/components/content/projects-index"
import type { GalleryItem } from "@/lib/gallery"
import type { DiscogsRelease } from "@/lib/discogs"
import type { ProjectContent } from "@/content/types"
import type { Post } from "@/lib/publishing/types"

export type PublicPageProps = { path: string } & (
  { kind: "home" | "about" | "publications" | "records" | "not-found" } |
  { kind: "projects"; posts: Post[] } |
  { kind: "photos"; galleryItems: GalleryItem[]; page: number; pages: number; total: number } |
  { kind: "record"; release: DiscogsRelease } |
  { kind: "project"; project: ProjectContent }
)

export default function PublicPage(props: PublicPageProps) {
  let content
  switch (props.kind) {
    case "home": content = <AboutSection />; break
    case "about": content = <AboutSection showOverview={false} />; break
    case "projects": content = <ProjectsIndex posts={props.posts} />; break
    case "publications": content = <div><PublicationsSection className="space-y-6" titleClassName="mb-8" /></div>; break
    case "records": content = <VinylGalleryView />; break
    case "photos": content = <PhotoGallery {...props} />; break
    case "record": content = <RecordDocument release={props.release} />; break
    case "project": content = <ProjectDocument project={props.project} />; break
    case "not-found": content = <div><h1>404</h1><h2>This page could not be found.</h2></div>
  }
  return <SiteShell path={props.path}>{props.path.startsWith("/gallery") ? <section><GalleryTabs />{content}</section> : content}</SiteShell>
}
