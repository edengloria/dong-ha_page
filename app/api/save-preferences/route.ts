import fs from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

type TrackPreferences = Record<
  string,
  {
    selectedTrackIndex: number
    selectedTrackTitle: string
    customSearchQuery?: string
  }
>

type SavePreferencesBody = {
  releaseId: string
  selectedTrackIndex: number
  selectedTrackTitle: string
  customSearchQuery?: string
}

function isDevWritable() {
  // GitHub Pages (next export) doesn't run this route anyway, but keep it safe.
  return process.env.NODE_ENV !== "production"
}

function isSavePreferencesBody(body: unknown): body is SavePreferencesBody {
  if (!body || typeof body !== "object") return false
  const b = body as Record<string, unknown>
  if (typeof b.releaseId !== "string") return false
  if (typeof b.selectedTrackIndex !== "number") return false
  if (typeof b.selectedTrackTitle !== "string") return false
  if (typeof b.customSearchQuery !== "undefined" && typeof b.customSearchQuery !== "string") {
    return false
  }
  return true
}

export async function POST(req: Request) {
  if (!isDevWritable()) {
    return NextResponse.json(
      { ok: false, error: "This endpoint is disabled in production." },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 })
  }

  if (!isSavePreferencesBody(body)) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 }
    )
  }

  const releaseId = body.releaseId.trim()
  const selectedTrackIndex = body.selectedTrackIndex
  const selectedTrackTitle = body.selectedTrackTitle.trim()
  const customSearchQueryRaw = body.customSearchQuery

  if (!Number.isFinite(selectedTrackIndex) || selectedTrackIndex < -1) {
    return NextResponse.json({ ok: false, error: "Invalid selectedTrackIndex." }, { status: 400 })
  }
  if (!releaseId) {
    return NextResponse.json({ ok: false, error: "Invalid releaseId." }, { status: 400 })
  }
  if (!selectedTrackTitle) {
    return NextResponse.json(
      { ok: false, error: "Invalid selectedTrackTitle." },
      { status: 400 }
    )
  }

  const customSearchQuery =
    typeof customSearchQueryRaw === "string" && customSearchQueryRaw.trim().length > 0
      ? customSearchQueryRaw.trim()
      : undefined

  const prefsPath = path.join(process.cwd(), "data", "track-preferences.json")

  let prefs: TrackPreferences = {}
  try {
    const existing = await fs.readFile(prefsPath, "utf8")
    prefs = (JSON.parse(existing || "{}") as TrackPreferences) || {}
  } catch {
    prefs = {}
  }

  prefs[releaseId] = {
    selectedTrackIndex,
    selectedTrackTitle,
    ...(customSearchQuery ? { customSearchQuery } : {}),
  }

  await fs.writeFile(prefsPath, JSON.stringify(prefs, null, 2), "utf8")

  return NextResponse.json({ ok: true })
}

