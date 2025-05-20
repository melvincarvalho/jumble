import client from '@/services/client.service'
import type { Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { SuggestionKeyDownProps } from '@tiptap/suggestion'
import tippy, { GetReferenceClientRect, Instance, Props } from 'tippy.js'
import MentionList, { MentionListHandle, MentionListProps } from './MentionList'

const suggestion = {
  items: async ({ query }: { query: string }) => {
    return await client.searchNpubs(query, 20)
  },

  render: () => {
    let component: ReactRenderer<MentionListHandle, MentionListProps>
    let popup: Instance[]
    let isPopupVisible = false
    const escapeListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPopupVisible) {
        e.preventDefault()
        e.stopPropagation()

        if (popup && popup[0]) {
          popup[0].hide()
        }

        return false
      }
    }
    document.addEventListener('keydown', escapeListener, true)

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
          placement: 'bottom-start',
          onShow() {
            isPopupVisible = true
          },
          onHide() {
            isPopupVisible = false
          }
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
        isPopupVisible = false
        popup[0].destroy()
        component.destroy()
      }
    }
  }
}

export default suggestion
