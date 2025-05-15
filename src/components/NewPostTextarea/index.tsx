import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Document from '@tiptap/extension-document'
import Mention from '@tiptap/extension-mention'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Preview from './Preview'
import suggestion from './suggestion'
import { parseEditorJsonToText, preprocessContent } from './utils'

export default function NewPostTextarea() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({
        HTMLAttributes: {
          class: 'text-primary bg-primary/10 rounded-md px-1'
        },
        suggestion
      })
    ],
    editorProps: {
      attributes: {
        class: 'border rounded-lg p-3 h-52'
      }
    },
    content: '',
    onUpdate(props) {
      setText(parseEditorJsonToText(props.editor.getJSON()))
    }
  })
  const processedContent = useMemo(() => preprocessContent(text), [text])

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
        <EditorContent editor={editor} />
      </TabsContent>
      <TabsContent value="preview">
        <Preview content={processedContent} />
      </TabsContent>
    </Tabs>
  )
}
