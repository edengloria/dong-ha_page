import type { ImgHTMLAttributes } from "react"

type Props = ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }

// Original and pre-generated images stay at stable URLs, with no image server.
export default function Image({ fill, priority, style, loading, ...props }: Props) {
  return <img {...props} decoding="async" loading={priority ? "eager" : loading || "lazy"} fetchPriority={priority ? "high" : undefined}
    style={{ color: "transparent", ...(fill ? { position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0 } as const : {}), ...style }} />
}
