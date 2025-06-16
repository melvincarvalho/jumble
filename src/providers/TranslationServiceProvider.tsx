import translation from '@/services/translation.service'
import { TTranslationAccount } from '@/types'
import { Event } from 'nostr-tools'
import { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNostr } from './NostrProvider'

const translatedEventCache: Record<string, Event> = {}

type TTranslationServiceContext = {
  account: TTranslationAccount | null
  translatedEventIdSet: Set<string>
  translate: (event: Event) => Promise<Event | void>
  showOriginalEvent: (eventId: string) => void
  getAccount: (canAuthWithApiKey?: boolean) => Promise<TTranslationAccount | void>
  regenerateApiKey: () => Promise<void>
}

const TranslationServiceContext = createContext<TTranslationServiceContext | undefined>(undefined)

export const useTranslationService = () => {
  const context = useContext(TranslationServiceContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export function TranslationServiceProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const { pubkey, signHttpAuth, startLogin } = useNostr()
  const [account, setAccount] = useState<TTranslationAccount | null>(null)
  const [translatedEventIdSet, setTranslatedEventIdSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    setAccount(null)
  }, [pubkey])

  const getAccount = async (canAuthWithApiKey = true): Promise<TTranslationAccount | void> => {
    if (!pubkey) {
      startLogin()
      return
    }
    const act = await translation.getAccount(
      signHttpAuth,
      canAuthWithApiKey ? account?.api_key : undefined
    )
    setAccount(act)
    return act
  }

  const regenerateApiKey = async (): Promise<void> => {
    if (!pubkey) {
      startLogin()
      return
    }
    const newApiKey = await translation.regenerateApiKey(signHttpAuth, account?.api_key)
    if (newApiKey) {
      setAccount((prev) => {
        if (prev) {
          return { ...prev, api_key: newApiKey }
        }
        return prev
      })
    }
  }

  const translate = async (event: Event): Promise<Event | void> => {
    const target = i18n.language
    const cacheKey = event.id + '_' + target
    if (translatedEventCache[cacheKey]) {
      setTranslatedEventIdSet((prev) => new Set(prev.add(event.id)))
      return translatedEventCache[cacheKey]
    }

    const translatedText = await translation.translate(
      event.content,
      target,
      signHttpAuth,
      account?.api_key
    )
    if (!translatedText) {
      return
    }
    const translatedEvent: Event = { ...event, content: translatedText }
    translatedEventCache[cacheKey] = translatedEvent
    setTranslatedEventIdSet((prev) => new Set(prev.add(event.id)))
    return translatedEvent
  }

  const showOriginalEvent = (eventId: string) => {
    setTranslatedEventIdSet((prev) => {
      const newSet = new Set(prev)
      newSet.delete(eventId)
      return newSet
    })
  }

  return (
    <TranslationServiceContext.Provider
      value={{
        account,
        translatedEventIdSet,
        getAccount,
        regenerateApiKey,
        translate,
        showOriginalEvent
      }}
    >
      {children}
    </TranslationServiceContext.Provider>
  )
}
