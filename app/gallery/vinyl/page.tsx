import LPCollection, { type StaticRelease, type TrackPreferences } from "@/components/lp-collection"
import discogsDataRaw from "@/data/discogs-collection.json"
import prefsRaw from "@/data/track-preferences.json"

export default function VinylPage() {
  const discogsData = discogsDataRaw as { releases?: StaticRelease[] }
  const releases = discogsData.releases ?? []
  const prefs = (prefsRaw as TrackPreferences) ?? {}

  return (
    <div>
      <LPCollection releases={releases} prefs={prefs} />
    </div>
  )
}
