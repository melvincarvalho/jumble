import { formatNpub } from '@/lib/pubkey'
import client from '@/services/client.service'
import { ExtendedRegExpMatchArray, InputRule, PasteRule, Range, SingleCommands } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mention: {
      createMention: (id: string) => ReturnType
      updateMention: (id: string, newLabel: string) => ReturnType
    }
  }
}

const MENTION_REGEX = /(nostr:)?(npub1[a-z0-9]{58}|nprofile1[a-z0-9]+)/g

const CustomMention = Mention.extend({
  addCommands() {
    return {
      ...this.parent?.(),

      createMention:
        (npub: string) =>
        ({ chain }) => {
          chain()
            .focus()
            .insertContent([
              {
                type: 'mention',
                attrs: {
                  id: npub,
                  label: formatNpub(npub)
                }
              },
              {
                type: 'text',
                text: ' '
              }
            ])
            .run()

          client.fetchProfile(npub).then((profile) => {
            if (profile) {
              chain().focus().updateMention(npub, profile.username).run()
            }
          })

          return true
        },

      updateMention:
        (id: string, newLabel: string) =>
        ({ editor }) => {
          if (!editor) return false

          return editor.commands.command(({ tr, dispatch }) => {
            if (!dispatch) return false

            const positions: number[] = []
            tr.doc.descendants((node, pos) => {
              if (node.type.name === 'mention' && node.attrs.id === id) {
                positions.push(pos)
              }
              return true
            })

            if (!positions.length) return false

            positions.forEach((pos) => {
              const node = tr.doc.nodeAt(pos)
              if (node) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  label: newLabel
                })
              }
            })

            tr.setMeta('addToHistory', true)

            dispatch(tr)
            return true
          })
        }
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: MENTION_REGEX,
        handler: (props) => handler(props)
      })
    ]
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: MENTION_REGEX,
        handler: (props) => handler(props)
      })
    ]
  }
})
export default CustomMention

function handler({
  range,
  match,
  commands
}: {
  commands: SingleCommands
  match: ExtendedRegExpMatchArray
  range: Range
}) {
  console.log('handler', match[0])
  const mention = match[0]
  if (!mention) return
  const npub = mention.replace('nostr:', '')

  const matchLength = mention.length
  const end = range.to
  const start = Math.max(0, end - matchLength)

  commands.deleteRange({ from: start, to: end })
  commands.createMention(npub)
}
