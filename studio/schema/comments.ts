import { defineField, defineType } from 'sanity'

// Server-created dot-path IDs stay private. Studio only moderates existing records.
export const blogComment = defineType({
  name: 'blogComment', title: 'Comments & Guestbook', type: 'document', readOnly: true,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'message', title: 'Message', type: 'text' }),
    defineField({ name: 'thread', title: 'Thread', type: 'string' }),
    defineField({ name: 'createdAt', title: 'Written', type: 'datetime' }),
    ...['salt', 'passwordHash', 'deletedAt'].map(name => defineField({ name, type: 'string', hidden: true })),
  ],
  preview: { select: { title: 'name', subtitle: 'message' } },
  orderings: [{ name: 'newest', title: 'Newest first', by: [{ field: 'createdAt', direction: 'desc' }] }],
})
