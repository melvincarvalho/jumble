import { EMBEDDED_MENTION_REGEX } from '@/constants'
import { formatNpub } from '@/lib/pubkey'
import {
  ExtendedRegExpMatchArray,
  Extension,
  InputRule,
  PasteRule,
  Range,
  SingleCommands
} from '@tiptap/core'

const LEGACY_EMBEDDED_MENTION_REGEX = /(npub1[a-z0-9]{58}|nprofile1[a-z0-9]+)/g

const AutoMention = Extension.create({
  name: 'autoMention',

  addInputRules() {
    return [
      new InputRule({
        find: EMBEDDED_MENTION_REGEX,
        handler: (props) => handler(props)
      }),
      new InputRule({
        find: LEGACY_EMBEDDED_MENTION_REGEX,
        handler: (props) => handler(props, true)
      })
    ]
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: EMBEDDED_MENTION_REGEX,
        handler: (props) => handler(props)
      }),
      new PasteRule({
        find: LEGACY_EMBEDDED_MENTION_REGEX,
        handler: (props) => handler(props, true)
      })
    ]
  }
})

export default AutoMention

function handler(
  {
    range,
    match,
    commands
  }: {
    commands: SingleCommands
    match: ExtendedRegExpMatchArray
    range: Range
  },
  legacy = false
) {
  const npub = match[1]
  if (!npub) return

  const start = Math.max(0, range.to - npub.length - (legacy ? 0 : 6))
  const end = range.to

  commands.deleteRange({ from: start, to: end })
  commands.insertContent({
    type: 'mention',
    attrs: {
      id: npub,
      label: formatNpub(npub)
    }
  })
  commands.insertContent(' ')
}
