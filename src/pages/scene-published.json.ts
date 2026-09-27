import layout from "@/data/scene-layout.json"
export function GET() {
  return new Response(JSON.stringify(layout), { headers: { "Content-Type": "application/json" } })
}
