import type { RichTextBlock } from "@/content/types"

export function RichText({ blocks }: { blocks: RichTextBlock }) {
  return (
    <>
      {blocks.map((segment, index) => {
        if (segment.type === "link") {
          return (
            <a
              key={`${segment.href}-${index}`}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/90 underline decoration-primary/45 underline-offset-4 transition-colors hover:text-primary"
            >
              {segment.label}
            </a>
          )
        }

        return <span key={`${segment.value.slice(0, 16)}-${index}`}>{segment.value}</span>
      })}
    </>
  )
}
