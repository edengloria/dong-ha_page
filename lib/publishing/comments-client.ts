import { languageOf, messages } from './language'
interface Entry { _id: string; name: string; message: string; createdAt: string }
const section = document.querySelector<HTMLElement>('[data-comments]')
if (section) {
  const endpoint = section.dataset.endpoint!, thread = section.dataset.thread!
  const language = languageOf(section.dataset.language), t = messages[language]
  const list = section.querySelector<HTMLOListElement>('[data-comment-list]')!
  const status = section.querySelector<HTMLElement>('[data-comment-list-status]')!
  const more = section.querySelector<HTMLButtonElement>('[data-comment-more]')!
  let next: string | null = null, loading = false
  const text = (tag: string, value: string) => { const node = document.createElement(tag); node.textContent = value; return node }
  const hidden = (name: string, value: string) => { const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; return input }
  function render(entry: Entry) {
    const li = document.createElement('li')
    li.id = entry._id.replace('.', '-')
    const date = document.createElement('time'); date.dateTime = entry.createdAt
    date.textContent = new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))
    li.append(text('strong', entry.name), date, text('p', entry.message))
    const details = document.createElement('details'), form = document.createElement('form')
    form.className = 'comment-delete'; form.action = endpoint; form.method = 'post'
    const label = text('label', `${t.password} ${t.passwordHint}`), password = document.createElement('input')
    password.type = 'password'; password.name = 'password'; password.required = true; password.minLength = 4; password.maxLength = 128; password.autocomplete = 'off'
    label.append(password)
    const button = document.createElement('button'); button.type = 'submit'; button.textContent = t.remove
    const feedback = text('p', ''); feedback.setAttribute('role', 'status'); feedback.className = 'comment-status'
    form.append(hidden('action', 'delete'), hidden('thread', thread), hidden('language', language), hidden('id', entry._id), label, button, feedback)
    details.append(text('summary', t.remove), form); li.append(details)
    form.addEventListener('submit', event => {
      event.preventDefault()
      void submit(form, feedback, async () => { li.remove(); if (!list.children.length) await load() })
    })
    return li
  }
  async function load(append = false) {
    if (loading) return
    loading = true; more.disabled = true
    status.textContent = t.loading
    try {
      const url = new URL(endpoint); url.searchParams.set('thread', thread); url.searchParams.set('language', language)
      if (append && next) url.searchParams.set('before', next)
      const response = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(15000) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t.loadFailed)
      if (!append) list.replaceChildren()
      for (const entry of result.entries as Entry[]) list.append(render(entry))
      next = result.next; more.hidden = !next
      status.textContent = list.children.length ? '' : t.emptyComments
    } catch (error) { status.textContent = error instanceof Error ? error.message : t.loadFailed }
    finally { loading = false; more.disabled = false }
  }
  async function submit(form: HTMLFormElement, feedback: HTMLElement, success: () => Promise<void>) {
    const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!
    if (button.disabled) return
    button.disabled = true; feedback.textContent = t.saving
    try {
      const body = new URLSearchParams()
      new FormData(form).forEach((value, key) => { if (typeof value === 'string') body.set(key, value) })
      const response = await fetch(endpoint, { method: 'POST', body, headers: { Accept: 'application/json' }, credentials: 'omit', signal: AbortSignal.timeout(20000) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t.saveFailed)
      form.reset(); feedback.textContent = t.saved
      await success()
    } catch (error) { feedback.textContent = error instanceof Error ? error.message : t.saveFailed }
    finally { button.disabled = false }
  }
  const form = document.querySelector<HTMLFormElement>('[data-comment-form]')
  form?.addEventListener('submit', event => {
    event.preventDefault()
    void submit(form, form.querySelector<HTMLElement>('.comment-status')!, async () => { await load() })
  })
  more.addEventListener('click', () => { void load(true) })
  void load()
}
