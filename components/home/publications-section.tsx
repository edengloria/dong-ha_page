import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { publications } from "@/content/publications"
import { cn, withBasePath } from "@/lib/utils"

function VenueText({ venue, venueHighlight }: { venue: string; venueHighlight?: string }) {
  if (!venueHighlight || !venue.includes(venueHighlight)) {
    return <span>{venue}</span>
  }

  return (
    <span>
      {venue.split(venueHighlight).map((part, idx, arr) => (
        <span key={`${venueHighlight}-${idx}`}>
          {part}
          {idx < arr.length - 1 && <strong className="font-semibold text-foreground">{venueHighlight}</strong>}
        </span>
      ))}
    </span>
  )
}

export function PublicationsSection({
  title = "Publications",
  titleClassName,
  className,
}: {
  title?: string
  titleClassName?: string
  className?: string
}) {
  return (
    <section className={cn("space-y-5", className)} aria-label={title}>
      <h2 className={cn("page-title", titleClassName)}>{title}</h2>

      <div className="space-y-5">
        {publications.map((pub, index) => (
          <article
            key={pub.title}
            className="glass rounded-2xl p-5 sm:p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${Math.min(index * 70, 240)}ms` }}
          >
            <div className="grid gap-5 lg:grid-cols-[14rem,1fr] lg:items-start">
              <div className="w-full">
                <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-black/10">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={withBasePath(pub.image)}
                      alt={pub.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 14rem"
                    />
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="rounded-full border border-border/50 bg-background/25 px-2 py-0.5 text-foreground/75">
                    {pub.kind}
                  </span>
                  {pub.note ? <span className="truncate">{pub.note}</span> : null}
                </div>

                <h3 className="text-lg sm:text-xl font-medium text-foreground leading-snug">{pub.title}</h3>

                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                  {pub.authors.split("Dong-Ha Shin").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <strong className="font-semibold text-foreground">Dong-Ha Shin</strong>
                      )}
                    </span>
                  ))}
                </p>
                <p className="mt-2 text-sm text-postech-red/90">
                  <VenueText venue={pub.venue} venueHighlight={pub.venueHighlight} />
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {pub.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-chip"
                      aria-label={`${link.label}: ${pub.title}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-primary/90" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
