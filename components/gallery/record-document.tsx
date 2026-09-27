import Image from "@/components/content/image"
import type { DiscogsRelease } from "@/lib/discogs"
import { withBasePath } from "@/lib/paths"
export function RecordDocument({ release }: { release: DiscogsRelease }) {
  return <article className="record-document">
    <p><a href={withBasePath("/gallery/vinyl/")}>&lt; Back to the record collection</a></p>
    <h2>{release.title}</h2>
    <p>{release.artist}{release.year ? ` · ${release.year}` : ""}</p>
    <Image src={release.cover_image || withBasePath("/placeholder.svg")} alt={`${release.title} cover`} width={400} height={400} className="record-document-cover" />
    {release.tracks.length ? <table className="track-table"><caption>Track list</caption><thead><tr><th scope="col">Side / No.</th><th scope="col">Title</th><th scope="col">Time</th></tr></thead>
      <tbody>{release.tracks.map((track, i) => <tr key={i}><td>{track.position}</td><td>{track.title}</td><td>{track.duration}</td></tr>)}</tbody>
    </table> : <p>No track list available.</p>}
    <p><a href={`https://www.discogs.com/release/${release.id}`} target="_blank" rel="noopener noreferrer">View this release on Discogs</a></p>
  </article>
}
