import discogsCollectionRaw from "@/data/discogs-collection.json"
import trackPreferencesRaw from "@/data/track-preferences.json"

export interface DiscogsTrack {
  position: string
  title: string
  duration: string
}

export interface DiscogsRelease {
  id: number
  instance_id: number
  title: string
  artist: string
  year: number
  cover_image: string
  local_cover_image?: string
  tracks: DiscogsTrack[]
}

export interface DiscogsCollection {
  fetchedAt: string
  releases: DiscogsRelease[]
}

export type TrackPreference = {
  selectedTrackIndex: number
  selectedTrackTitle: string
  customSearchQuery?: string
}

export type TrackPreferences = Record<string, TrackPreference>

export function getDiscogsCollection(): DiscogsCollection {
  return discogsCollectionRaw as DiscogsCollection
}

export function getTrackPreferences(): TrackPreferences {
  return (trackPreferencesRaw as TrackPreferences) ?? {}
}
