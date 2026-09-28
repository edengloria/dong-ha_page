// Only public production pages send anonymous pageviews and outbound-link events.
(() => {
  if (location.origin !== 'https://dhsh.in' || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return
  if (document.querySelector('meta[name="robots"]')?.content.includes('noindex')) return
  try { if (localStorage.getItem('umami.disabled')) return } catch { /* Storage may be unavailable. */ }

  const websiteId = document.currentScript?.dataset.websiteId
  if (!websiteId) return
  const cleanReferrer = value => {
    try {
      const url = new URL(value)
      return /^https?:$/.test(url.protocol) ? (url.origin === location.origin ? `${url.origin}${url.pathname}` : url.origin) : ''
    } catch { return '' }
  }
  window.dhshBeforeSend = (type, payload) => {
    if (type !== 'event') return false
    return { ...payload, url: location.pathname, referrer: cleanReferrer(payload.referrer) }
  }

  const trackLink = event => {
    if (event.type === 'auxclick' && event.button !== 1) return
    const link = event.target.closest?.('a[href]')
    if (!link || link.closest('form, [contenteditable], [data-no-analytics]')) return
    let url
    try { url = new URL(link.href, location.href) } catch { return }
    if (!/^https?:$/.test(url.protocol) || url.hostname === 'studio.dhsh.in') return
    const pdf = /\.pdf$/i.test(url.pathname)
    if (url.origin === location.origin && !pdf) return
    const kind = url.hostname === 'github.com' ? 'github'
      : url.hostname === 'scholar.google.com' ? 'scholar'
      : pdf || /^(?:doi\.org|arxiv\.org|opg\.optica\.org|ieeexplore\.ieee\.org|dl\.acm\.org)$/.test(url.hostname) ? 'paper' : 'external'
    void Promise.resolve(window.umami?.track('outbound-link', { kind, destination: `${url.origin}${url.pathname}` })).catch(() => {})
  }
  document.addEventListener('click', trackLink)
  document.addEventListener('auxclick', trackLink)

  const script = document.createElement('script')
  script.src = 'https://cloud.umami.is/script.js'
  script.defer = true
  Object.assign(script.dataset, {
    websiteId, domains: 'dhsh.in', excludeSearch: 'true', excludeHash: 'true',
    doNotTrack: 'true', beforeSend: 'dhshBeforeSend',
  })
  document.head.append(script)
})()
