import { JSONContent } from '@tiptap/react'
import { nip19 } from 'nostr-tools'

export function parseEditorJsonToText(node?: JSONContent) {
  const text = _parseEditorJsonToText(node).trim()
  const regex = /(?<=^|\s)(nevent|naddr|nprofile|npub)[a-zA-Z0-9]+/g
  return text.replace(regex, (match) => {
    try {
      nip19.decode(match)
      return `nostr:${match}`
    } catch {
      return match
    }
  })
}

function _parseEditorJsonToText(node?: JSONContent): string {
  if (!node) return ''

  if (typeof node === 'string') return node

  if (node.type === 'text') {
    return node.text || ''
  }

  if (Array.isArray(node.content)) {
    return (
      node.content.map(_parseEditorJsonToText).join('') + (node.type === 'paragraph' ? '\n' : '')
    )
  }

  switch (node.type) {
    case 'paragraph':
      return '\n'
    case 'mention':
      return node.attrs ? `nostr:${node.attrs.id}` : ''
    default:
      return ''
  }
}
