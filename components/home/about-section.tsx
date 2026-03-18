import { profile } from "@/content/profile"
import { RichText } from "@/components/content/rich-text"
import { AboutPortrait } from "@/components/home/about-portrait"
import { PublicationsSection } from "@/components/home/publications-section"

export function AboutSection({ lifeImages }: { lifeImages: string[] }) {
  return (
    <section className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
      <header
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "150ms" }}
      >
        <h1 className="page-title mb-6">About Me</h1>
      </header>

      <div
        className="content-stack animate-in fade-in-0 duration-500"
        style={{ animationDelay: "250ms" }}
      >
        <div className="grid items-start gap-8 md:grid-cols-3">
          <div className="copy-stack md:col-span-2">
            {profile.about.map((paragraph, index) => (
              <p
                key={index}
                className="copy-paragraph animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${300 + index * 60}ms` }}
              >
                <RichText blocks={paragraph} />
              </p>
            ))}
          </div>

          <AboutPortrait alt={profile.heroAlt} images={lifeImages} />
        </div>

        <div className="section-divider pt-10">
          <PublicationsSection titleClassName="mb-8" />
        </div>
      </div>
    </section>
  )
}
