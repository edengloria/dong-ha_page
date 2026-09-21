import Image from "next/image"
import Link from "next/link"
import { profile } from "@/content/profile"
import { publications } from "@/content/publications"
import { RichText } from "@/components/content/rich-text"
import { withBasePath } from "@/lib/utils"

export function AboutSection({ lifeImages }: { lifeImages: string[] }) {
  const photo = lifeImages.includes("withbear.jpg") ? "withbear.jpg" : lifeImages[0]
  return (
    <section>
      <header className="masthead">
        <div className="eyebrow">A personal corner of the world wide web</div>
        <h1 className="home-title">Dong-ha’s<br /><em>little universe.</em></h1>
        <p>신동하 / Researcher, image maker, record collector.<br />Somewhere between light, pictures &amp; sound.</p>
        <span className="star-stamp" aria-hidden="true">✷</span>
      </header>
      <div className="welcome-note"><strong>Hello, you found my room!</strong><span>Pick a door ↓</span></div>
      <div className="room-grid">
        <Link href="/publications" className="room room-research">
          <div className="room-number"><span>01 / THE LAB</span><span aria-hidden="true">✧</span></div>
          <div className="room-image"><Image src={withBasePath("/asset/CVHNerF.webp")} alt="Holographic radiance field research" fill className="object-cover" sizes="(max-width: 560px) 85vw, 250px" priority /></div>
          <h2>Research desk ↗</h2><p>Optics, vision, graphics &amp; AI.<br />Papers and experiments with light.</p>
        </Link>
        <Link href="/gallery/photos" className="room room-photos">
          <div className="room-number"><span>02 / LIFE LATELY</span><span aria-hidden="true">▧</span></div>
          <div className="room-image">{photo && <Image src={withBasePath(`/asset/life-thumbs/${photo}.webp`)} alt="A moment from my photo album" fill className="object-cover" sizes="(max-width: 560px) 85vw, 250px" />}</div>
          <h2>Photo diary ↗</h2><p>People, places &amp; ordinary days.<br />Little things worth keeping.</p>
        </Link>
        <Link href="/gallery/vinyl" className="room room-records">
          <div className="room-number"><span>03 / SIDE A</span><span aria-hidden="true">♫</span></div>
          <div className="room-image"><div className="record-art" aria-hidden="true"><span><b>33⅓</b></span></div></div>
          <h2>Record room ↗</h2><p>My actual vinyl collection.<br />Come in and listen to a preview.</p>
        </Link>
      </div>
      <details className="desk-note">
        <summary>A note about me / 소개</summary>
        <div className="copy-stack">{profile.about.map((paragraph, index) => <p key={index} className="copy-paragraph"><RichText blocks={paragraph} /></p>)}</div>
      </details>
      <section className="section-divider pt-5" aria-label="On the research desk">
        <div className="flex flex-wrap justify-between gap-2 mb-4"><h2 className="font-bold text-lg">On the research desk</h2><Link href="/publications" className="meta-link text-xs">All publications ↗</Link></div>
        {publications.slice(0, 3).map((pub) => <p key={pub.title} className="mb-3 text-sm"><span className="text-primary mr-2" aria-hidden="true">↳</span><a className="meta-link" href={pub.links[0].href} target="_blank" rel="noopener noreferrer">{pub.title}</a><span className="block text-xs text-muted-foreground ml-5">{pub.venue}</span></p>)}
      </section>
      <div className="web-badges"><span>PERSONAL WEB</span><span>MADE OF LIGHT</span><span>PLEASE LOOK AROUND</span></div>
    </section>
  )
}
