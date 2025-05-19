import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseEditorJsonToText } from '@/lib/tiptap'
import postContentCache from '@/services/post-content-cache.service'
import Document from '@tiptap/extension-document'
import History from '@tiptap/extension-history'
import Paragraph from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import Text from '@tiptap/extension-text'
import { TextSelection } from '@tiptap/pm/state'
import { EditorContent, useEditor } from '@tiptap/react'
import { Event } from 'nostr-tools'
import { Dispatch, forwardRef, SetStateAction, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import CustomMention from './CustomMention'
import { FileHandler } from './FileHandler'
import Preview from './Preview'
import suggestion from './suggestion'

export type TNewPostTextareaHandle = {
  appendText: (text: string) => void
}

const NewPostTextarea = forwardRef<
  TNewPostTextareaHandle,
  {
    text: string
    setText: Dispatch<SetStateAction<string>>
    defaultContent?: string
    parentEvent?: Event
  }
>(({ text = '', setText, defaultContent, parentEvent }, ref) => {
  const { t } = useTranslation()
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      History,
      Placeholder.configure({
        placeholder: t('Write something...') + ' (' + t('Paste or drop media files to upload') + ')'
      }),
      CustomMention.configure({
        suggestion
      }),
      FileHandler
    ],
    editorProps: {
      attributes: {
        class:
          'border rounded-lg p-3 min-h-52 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
      }
    },
    content: postContentCache.getPostCache({ defaultContent, parentEvent }),
    onUpdate(props) {
      setText(parseEditorJsonToText(props.editor.getJSON()))
      postContentCache.setPostCache({ defaultContent, parentEvent }, props.editor.getJSON())
    },
    onCreate(props) {
      setText(parseEditorJsonToText(props.editor.getJSON()))
    }
  })

  useImperativeHandle(ref, () => ({
    appendText: (text: string) => {
      if (editor) {
        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              const endPos = tr.doc.content.size
              const selection = TextSelection.create(tr.doc, endPos)
              tr.setSelection(selection)
              dispatch(tr)
            }
            return true
          })
          .insertContent(text)
          .run()
      }
    }
  }))

  if (!editor) {
    return null
  }

  return (
    <Tabs defaultValue="edit" className="space-y-4">
      <TabsList>
        <TabsTrigger value="edit">{t('Edit')}</TabsTrigger>
        <TabsTrigger value="preview">{t('Preview')}</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <EditorContent className="tiptap" editor={editor} />
      </TabsContent>
      <TabsContent value="preview">
        <Preview content={text} />
      </TabsContent>
    </Tabs>
  )
})
NewPostTextarea.displayName = 'NewPostTextarea'
export default NewPostTextarea
