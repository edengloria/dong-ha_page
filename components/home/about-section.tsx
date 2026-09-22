import Link from "next/link"
import { profile } from "@/content/profile"
import { publications } from "@/content/publications"
import { RichText } from "@/components/content/rich-text"
import { SceneSlot } from "@/components/scene/scene-slot"

export function AboutSection() {
  return (
    <section>
      <header className="intro-note">
        <SceneSlot anchor="intro" />
        <h1 className="page-title">Dong-Ha Shin</h1>
        {profile.about.map((paragraph, index) => <p key={index} className="copy-paragraph"><RichText blocks={paragraph} /></p>)}
      </header>
      <nav className="room-grid" aria-label="Explore">
        <div className="room-region room-research"><SceneSlot anchor="research" /><Link href="/publications" className="room"><span className="room-number">01</span><h2>Research desk ↗</h2></Link></div>
        <div className="room-region room-photos"><SceneSlot anchor="photos" /><Link href="/gallery/photos" className="room"><span className="room-number">02</span><h2>Photo diary ↗</h2></Link></div>
        <div className="room-region room-records"><SceneSlot anchor="records" /><Link href="/gallery/vinyl" className="room"><span className="room-number">03</span><h2>Record room ↗</h2></Link></div>
      </nav>
      <section className="section-divider pt-5" aria-label="On the research desk">
        <SceneSlot anchor="publications" />
        <div className="flex flex-wrap justify-between gap-2 mb-4"><h2 className="font-bold text-lg">On the research desk</h2><Link href="/publications" className="meta-link text-xs">All publications ↗</Link></div>
        {publications.slice(0, 4).map((pub) => <p key={pub.title} className="mb-3 text-sm"><span className="text-primary mr-2" aria-hidden="true">↳</span><a className="meta-link" href={pub.links[0].href} target="_blank" rel="noopener noreferrer">{pub.title}</a><span className="block text-xs text-muted-foreground ml-5">{pub.kind === "Open-source" ? "Open-source · " : ""}{pub.venue}</span></p>)}
      </section>
    </section>
  )
}
