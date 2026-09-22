"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import type { DiscogsRelease, TrackPreferences } from "@/lib/discogs"
import { resolvePreferredPreviewQuery } from "@/lib/music-preview"
import { mountRecords } from "@/lib/native/records"
import { withBasePath } from "@/lib/utils"

export default function LPCollection({ releases, prefs }: { releases: DiscogsRelease[]; prefs: TrackPreferences }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => mountRecords(root.current!), [])
  return <div ref={root}>
    <p className="document-count">{releases.length} records · <span className="preview-help">Hover or press Play to listen. </span>Select an album title for the track list.</p>
    <div className="record-index">
      {releases.map((release) => {
        const { customQuery, preferredQuery } = resolvePreferredPreviewQuery({ album: release.title, artist: release.artist, prefs, releaseId: release.id })
        const href = withBasePath(`/gallery/vinyl/${release.instance_id}/`)
        return <div key={release.instance_id} className="group cursor-pointer record-card" data-record={release.id} data-album={release.title} data-artist={release.artist} data-query={preferredQuery} data-custom-query={customQuery}>
          <a className="record-cover aspect-square" href={href} aria-label={`${release.title} — ${release.artist}`}>
            <Image src={release.cover_image || withBasePath("/placeholder.svg")} alt={`${release.title} cover`} width={300} height={300} loading="lazy" unoptimized />
          </a>
          <h2><a href={href}>{release.title}</a></h2>
          <p>{release.artist}<br />{release.year || ""}</p>
          <button type="button" className="document-button" data-preview-button aria-label="Play preview" hidden>Play</button>
          <span className="preview-status" data-preview-status role="status" />
        </div>
      })}
    </div>
  </div>
}
