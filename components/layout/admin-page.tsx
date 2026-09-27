import { SiteShell } from "./site-shell"
import { GalleryTabs } from "@/components/gallery/gallery-tabs"
import DiscogsAdmin from "@/components/gallery/discogs-admin"
import { useEffect, useState } from "react"
export default function AdminPage() {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  return <SiteShell path="/gallery/admin/"><section><GalleryTabs />{ready ? <DiscogsAdmin /> : <p role="status">Loading record administration…</p>}</section></SiteShell>
}
