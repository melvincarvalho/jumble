import { JUMBLE_API_BASE_URL } from '@/constants'
import { Event } from 'nostr-tools'
import { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNostr } from './NostrProvider'

const translatedEventCache: Record<string, Event> = {}

type TTranslationAccount = {
  pubkey: string
  api_key: string
  balance: number
}

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
    const url = new URL('/v1/translation/account', JUMBLE_API_BASE_URL).toString()

    let auth: string
    if (account?.api_key && canAuthWithApiKey) {
      auth = `Bearer ${account.api_key}`
    } else {
      auth = await signHttpAuth(url, 'get')
    }

    const response = await fetch(url, {
      headers: { Authorization: auth }
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to fetch account information')
    }
    setAccount(data)
    return data
  }

  const regenerateApiKey = async (): Promise<void> => {
    let api_key = account?.api_key
    if (!api_key) {
      const act = await getAccount()
      if (!act) return

      api_key = act.api_key
    }
    const url = new URL('/v1/translation/regenerate-api-key', JUMBLE_API_BASE_URL).toString()
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api_key}` }
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to regenerate API key')
    }
    if (data.api_key) {
      setAccount((prev) => {
        if (prev) {
          return { ...prev, api_key: data.api_key }
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

    let api_key = account?.api_key
    if (!api_key) {
      const act = await getAccount()
      if (!act) return

      api_key = act.api_key
    }
    const url = new URL('/v1/translation/translate', JUMBLE_API_BASE_URL).toString()
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api_key}` },
      body: JSON.stringify({ q: event.content, target })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to translate')
    }
    const translatedText = data.translatedText
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
