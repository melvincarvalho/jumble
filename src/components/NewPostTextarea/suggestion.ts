import client from '@/services/client.service'
import type { Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { SuggestionKeyDownProps } from '@tiptap/suggestion'
import tippy, { GetReferenceClientRect, Instance, Props } from 'tippy.js'
import MentionList, { MentionListHandle, MentionListProps } from './MentionList'

const suggestion = {
  items: async ({ query }: { query: string }) => {
    return await client.searchProfilesFromIndex(query, 20)
  },

  render: () => {
    let component: ReactRenderer<MentionListHandle, MentionListProps>
    let popup: Instance[]

    return {
      onStart: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as GetReferenceClientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start'
        })
      },

      onUpdate(props: { clientRect?: (() => DOMRect | null) | null | undefined }) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect
        } as Partial<Props>)
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }
        return component.ref?.onKeyDown(props) ?? false
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      }
    }
  }
}

export default suggestion
