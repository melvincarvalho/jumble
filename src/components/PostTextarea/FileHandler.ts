import mediaUpload from '@/services/media-upload.service'
import { Extension } from '@tiptap/core'
import { EditorView } from '@tiptap/pm/view'
import { Plugin, TextSelection } from 'prosemirror-state'

const DRAGOVER_CLASS_LIST = [
  'outline-2',
  'outline-offset-4',
  'outline-dashed',
  'outline-border',
  'rounded-md'
]

export const FileHandler = Extension.create({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            dragover(view, event) {
              event.preventDefault()
              view.dom.classList.add(...DRAGOVER_CLASS_LIST)
              return false
            },
            dragleave(view) {
              view.dom.classList.remove(...DRAGOVER_CLASS_LIST)
              return false
            },
            drop(view, event) {
              event.preventDefault()
              view.dom.classList.remove(...DRAGOVER_CLASS_LIST)

              const items = Array.from(event.dataTransfer?.files ?? [])
              const mediaFile = items.find(
                (item) => item.type.includes('image') || item.type.includes('video')
              )
              if (!mediaFile) return false

              uploadFile(view, mediaFile)

              return true
            }
          },
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items ?? [])
            const mediaItem = items.find(
              (item) => item.type.includes('image') || item.type.includes('video')
            )
            if (!mediaItem) return false

            const file = mediaItem.getAsFile()
            if (!file) return false

            uploadFile(view, file)

            return true
          }
        }
      })
    ]
  }
})

async function uploadFile(view: EditorView, file: File) {
  const name = file.name

  const placeholder = `[Uploading "${name}"...]`
  const uploadingNode = view.state.schema.text(placeholder)
  const tr = view.state.tr.replaceSelectionWith(uploadingNode)
  view.dispatch(tr)

  mediaUpload
    .upload(file)
    .then((result) => {
      const urlNode = view.state.schema.text(result.url)

      const tr = view.state.tr
      let didReplace = false

      view.state.doc.descendants((node, pos) => {
        if (node.isText && node.text && node.text.includes(placeholder) && !didReplace) {
          const startPos = node.text.indexOf(placeholder)
          const from = pos + startPos
          const to = from + placeholder.length
          tr.replaceWith(from, to, urlNode)
          didReplace = true
          return false
        }
        return true
      })

      if (didReplace) {
        view.dispatch(tr)
      } else {
        const endPos = view.state.doc.content.size

        const paragraphNode = view.state.schema.nodes.paragraph.create(
          null,
          view.state.schema.text(result.url)
        )

        const insertTr = view.state.tr.insert(endPos, paragraphNode)
        const newPos = endPos + 1 + result.url.length
        insertTr.setSelection(TextSelection.near(insertTr.doc.resolve(newPos)))
        view.dispatch(insertTr)
      }
    })
    .catch((error) => {
      console.error('Upload failed:', error)

      const tr = view.state.tr
      let didReplace = false

      view.state.doc.descendants((node, pos) => {
        if (node.isText && node.text && node.text.includes(placeholder) && !didReplace) {
          const startPos = node.text.indexOf(placeholder)
          const from = pos + startPos
          const to = from + placeholder.length
          const errorNode = view.state.schema.text(`[Error uploading "${name}"]`)
          tr.replaceWith(from, to, errorNode)
          didReplace = true
          return false
        }
        return true
      })

      if (didReplace) {
        view.dispatch(tr)
      }

      throw error
    })
}
