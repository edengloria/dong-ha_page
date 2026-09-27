import { createHmac } from 'node:crypto'
const eventId = process.env.CMS_EVENT, secret = process.env.DEPLOY_CALLBACK_SECRET
if (!eventId) process.exit(0)
if (!/^[a-f0-9]{64}$/.test(eventId) || !secret) throw new Error('Publishing callback configuration is missing')
const body = JSON.stringify({ eventId, status: process.argv[2], runId: process.env.GITHUB_RUN_ID })
for (let attempt = 0; attempt < 12; attempt++) {
  const now = Date.now(), signature = `t=${now},v1=${createHmac('sha256', secret).update(`${now}.${body}`).digest('base64url')}`
  try {
    const response = await fetch('https://studio.dhsh.in/api/deployment-status/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-dhsh-signature': signature }, body, signal: AbortSignal.timeout(15_000) })
    if (response.ok) { console.log(`Publishing status: ${process.argv[2]}`); process.exit(0) }
    if (response.status < 500) throw new Error(`Callback rejected (${response.status})`)
  } catch (error) { if (attempt === 11) throw error }
  await new Promise(resolve => setTimeout(resolve, 10_000))
}
throw new Error('Could not confirm publishing status after deployment')
