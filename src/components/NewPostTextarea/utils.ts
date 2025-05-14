import { JSONContent } from '@tiptap/react'
import { nip19 } from 'nostr-tools'

export function parseEditorJsonToText(node: JSONContent): string {
  if (!node) return ''

  if (typeof node === 'string') return node

  if (node.type === 'text') {
    return node.text || ''
  }

  if (Array.isArray(node.content)) {
    return (
      node.content.map(parseEditorJsonToText).join('') + (node.type === 'paragraph' ? '\n' : '')
    )
  }

  switch (node.type) {
    case 'paragraph':
      return '\n'
    case 'mention':
      return `@${node.attrs?.id}`
    // case 'hardBreak':
    //   return '\n';
    // case 'heading':
    //   return '#'.repeat(node.attrs?.level || 1) + ' ' + parseTiptapJsonToText(node) + '\n';
    // case 'bulletList':
    // case 'orderedList':
    //   return parseTiptapJsonToText(node);
    // case 'listItem':
    //   return '- ' + parseTiptapJsonToText(node) + '\n';
    default:
      return ''
  }
}

export function preprocessContent(content: string) {
  const regex = /(?<=^|\s)(nevent|naddr|nprofile|npub)[a-zA-Z0-9]+/g
  return content.replace(regex, (match) => {
    try {
      nip19.decode(match)
      return `nostr:${match}`
    } catch {
      return match
    }
  })
}
