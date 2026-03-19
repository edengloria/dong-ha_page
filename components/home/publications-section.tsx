import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { publications } from "@/content/publications"
import { cn, withBasePath } from "@/lib/utils"

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
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-border/50 bg-black/10">
                  <Image
                    src={withBasePath(pub.image)}
                    alt={pub.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 14rem"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="rounded-full border border-border/50 bg-background/20 px-2 py-0.5">
                    {pub.kind}
                  </span>
                  {pub.note ? <span className="truncate">{pub.note}</span> : null}
                </div>

                <h3 className="text-lg sm:text-xl font-medium text-foreground leading-snug">{pub.title}</h3>

                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                  {pub.authors.split("Dong-Ha Shin").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && <strong className="font-semibold text-foreground">Dong-Ha Shin</strong>}
                    </span>
                  ))}
                </p>
                <p className="mt-2 text-sm text-postech-red/90">
                  {pub.venue.split("SIGGRAPH 2026").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && <strong className="font-bold">SIGGRAPH 2026</strong>}
                    </span>
                  ))}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {pub.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/20 px-3 py-1 text-xs text-foreground/90 hover:bg-postech-red/10 hover:border-postech-red/30 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-postech-red/90" />
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
