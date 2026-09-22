import Image from "next/image"
import { notFound } from "next/navigation"
import { getDiscogsCollection } from "@/lib/discogs"
import { createMetadata } from "@/lib/metadata"
import { withBasePath } from "@/lib/utils"

const releases = getDiscogsCollection().releases
export function generateStaticParams() { return releases.map((release) => ({ id: String(release.instance_id) })) }
export const dynamicParams = false
type Props = { params: Promise<{ id: string }> }
export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const release = releases.find((r) => String(r.instance_id) === id)
  return createMetadata({ title: release?.title || "Record", description: release ? `${release.title} by ${release.artist}. Track list from Dong-Ha Shin’s record collection.` : undefined, path: `/gallery/vinyl/${id}` })
}
export default async function RecordPage({ params }: Props) {
  const { id } = await params
  const release = releases.find((r) => String(r.instance_id) === id)
  if (!release) notFound()
  return <article className="record-document">
    <p><a href={withBasePath("/gallery/vinyl/")}>&lt; Back to the record collection</a></p>
    <h2>{release.title}</h2>
    <p>{release.artist}{release.year ? ` · ${release.year}` : ""}</p>
    <Image src={release.cover_image || withBasePath("/placeholder.svg")} alt={`${release.title} cover`} width={400} height={400} className="record-document-cover" unoptimized />
    {release.tracks.length ? <table className="track-table"><caption>Track list</caption><thead><tr><th scope="col">Side / No.</th><th scope="col">Title</th><th scope="col">Time</th></tr></thead>
      <tbody>{release.tracks.map((track, i) => <tr key={i}><td>{track.position}</td><td>{track.title}</td><td>{track.duration}</td></tr>)}</tbody>
    </table> : <p>No track list available.</p>}
    <p><a href={`https://www.discogs.com/release/${release.id}`} target="_blank" rel="noopener noreferrer">View this release on Discogs</a></p>
  </article>
}
