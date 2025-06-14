import { useToast } from '@/hooks'
import { isSupportedKind } from '@/lib/event'
import { useTranslationService } from '@/providers/TranslationServiceProvider'
import { Languages, Loader } from 'lucide-react'
import { Event } from 'nostr-tools'
import { useMemo, useState } from 'react'

export default function TranslateButton({
  event,
  setTranslatedEvent
}: {
  event: Event
  setTranslatedEvent: (event: Event | null) => void
}) {
  const { toast } = useToast()
  const { translate } = useTranslationService()
  const [translating, setTranslating] = useState(false)
  const supported = useMemo(() => isSupportedKind(event.kind), [event])

  if (!supported) {
    return null
  }

  const handleTranslate = async () => {
    if (translating) return

    setTranslating(true)
    await translate(event.content)
      .then(async (translatedText) => {
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
        handleTranslate()
      }}
    >
      {translating ? <Loader className="animate-spin size-4" /> : <Languages className="size-4" />}
    </button>
  )
}
