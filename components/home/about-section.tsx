import Link from "next/link"
import { profile } from "@/content/profile"
import { publications } from "@/content/publications"
import { RichText } from "@/components/content/rich-text"

export function AboutSection() {
  return (
    <section>
      <header className="intro-note">
        <h1 className="page-title">Dong-Ha Shin</h1>
        {profile.about.map((paragraph, index) => <p key={index} className="copy-paragraph"><RichText blocks={paragraph} /></p>)}
      </header>
      <nav className="room-grid" aria-label="Explore">
        <Link href="/publications" className="room room-research"><span className="room-number">01</span><h2>Research desk ↗</h2></Link>
        <Link href="/gallery/photos" className="room room-photos"><span className="room-number">02</span><h2>Photo diary ↗</h2></Link>
        <Link href="/gallery/vinyl" className="room room-records"><span className="room-number">03</span><h2>Record room ↗</h2></Link>
      </nav>
      <section className="section-divider pt-5" aria-label="On the research desk">
        <div className="flex flex-wrap justify-between gap-2 mb-4"><h2 className="font-bold text-lg">On the research desk</h2><Link href="/publications" className="meta-link text-xs">All publications ↗</Link></div>
        {publications.slice(0, 3).map((pub) => <p key={pub.title} className="mb-3 text-sm"><span className="text-primary mr-2" aria-hidden="true">↳</span><a className="meta-link" href={pub.links[0].href} target="_blank" rel="noopener noreferrer">{pub.title}</a><span className="block text-xs text-muted-foreground ml-5">{pub.venue}</span></p>)}
      </section>
    </section>
  )
}
