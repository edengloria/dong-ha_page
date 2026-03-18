import LPCollection from "@/components/gallery/lp-collection"
import { getDiscogsCollection, getTrackPreferences } from "@/lib/discogs"

export function VinylGalleryView() {
  const releases = getDiscogsCollection().releases
  const prefs = getTrackPreferences()

  return (
    <div>
      <LPCollection releases={releases} prefs={prefs} />
    </div>
  )
}
