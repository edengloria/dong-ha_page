"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import type { GalleryItem } from "@/lib/gallery"
import { mountPhotos } from "@/lib/native/photos"
import { withBasePath } from "@/lib/utils"

const pagePath = (page: number) => withBasePath(page === 1 ? "/gallery/photos/" : `/gallery/photos/page/${page}/`)
export function PhotoGallery({ galleryItems, page, pages, total }: {
  galleryItems: GalleryItem[]; page: number; pages: number; total: number
}) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => mountPhotos(root.current!), [])
  const paging = <nav className="page-index" aria-label="Photo pages">
    {page > 1 && <a href={pagePath(page - 1)} rel="prev">&lt; Previous</a>}
    {Array.from({ length: pages }, (_, i) => <a key={i} href={pagePath(i + 1)} aria-current={i + 1 === page ? "page" : undefined}>[{i + 1}]</a>)}
    {page < pages && <a href={pagePath(page + 1)} rel="next">Next &gt;</a>}
  </nav>
  return <div ref={root} data-photo-index>
    <p className="document-count">{total} photographs · Page {page} of {pages}</p>
    {paging}
    <div className="photo-index">
      {galleryItems.map((item) => <a key={item.id} href={withBasePath(item.imageUrl)} aria-label={`Open photo ${item.id}`} className="photo-print" data-image-id={item.id}>
        <Image src={withBasePath(item.imageUrl.replace("/life-images/", "/life-thumbs/") + ".webp")} alt={`Photo ${item.id}`} width={item.width} height={item.height} loading="lazy" unoptimized />
        <span>Photo {String(item.id).padStart(2, "0")}</span>
      </a>)}
    </div>
    {paging}
  </div>
}
