import { useToast } from '@/hooks'
import { isSupportedKind } from '@/lib/event'
import { cn } from '@/lib/utils'
import { useTranslationService } from '@/providers/TranslationServiceProvider'
import { Languages } from 'lucide-react'
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
  const [translated, setTranslated] = useState(false)
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
          setTranslated(true)
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
        if (translated) {
          setTranslatedEvent(null)
          setTranslated(false)
        } else {
          handleTranslate()
        }
      }}
    >
      <Languages
        className={cn(
          'size-4',
          translating
            ? 'text-primary animate-pulse'
            : translated
              ? 'text-primary hover:text-primary/60'
              : ''
        )}
      />
    </button>
  )
}
