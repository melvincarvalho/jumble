import { useToast } from '@/hooks'
import { isSupportedKind } from '@/lib/event'
import { Languages, Loader } from 'lucide-react'
import { Event } from 'nostr-tools'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function TranslateButton({
  event,
  setTranslatedEvent
}: {
  event: Event
  setTranslatedEvent: (event: Event | null) => void
}) {
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const [translating, setTranslating] = useState(false)
  const supported = useMemo(() => isSupportedKind(event.kind), [event])

  if (!supported) {
    return null
  }

  const translate = async () => {
    if (translating) return

    setTranslating(true)
    await fetch('http://localhost:3000/translation/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: event.content, target: i18n.language, api_key: 'test' })
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error)
        }
        const translatedText = data.translatedText
        if (translatedText) {
          const translatedEvent = { ...event, content: translatedText }
          setTranslatedEvent(translatedEvent)
        }
      })
      .catch((error) => {
        toast({
          title: 'Translation failed',
          description: error.message || 'An error occurred while translating the note.',
          variant: 'destructive'
        })
      })
      .finally(() => {
        setTranslating(false)
      })
  }

  return (
    <button
      className="flex items-center text-muted-foreground hover:text-foreground pl-3 h-full"
      disabled={translating}
      onClick={(e) => {
        e.stopPropagation()
        translate()
      }}
    >
      {translating ? <Loader className="animate-spin size-4" /> : <Languages className="size-4" />}
    </button>
  )
}
