import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import SecondaryPageLayout from '@/layouts/SecondaryPageLayout'
import { useTranslationService } from '@/providers/TranslationServiceProvider'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { JumbleTranslate } from './JumbleTranslate'
import LibreTranslate from './LibreTranslate'

const TranslationPage = forwardRef(({ index }: { index?: number }, ref) => {
  const { t } = useTranslation()
  const { config, updateConfig } = useTranslationService()

  return (
    <SecondaryPageLayout ref={ref} index={index} title={t('Translation')}>
      <div className="px-4 pt-2 space-y-4">
        <div>
          <div className="font-medium">{t('Service')}</div>
          <Select
            value={config.service}
            onValueChange={(newService) => {
              updateConfig({ service: newService as 'jumble' | 'libre_translate' })
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('Select Translation Service')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jumble">Jumble</SelectItem>
              <SelectItem value="libre_translate">LibreTranslate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {config.service === 'jumble' ? <JumbleTranslate /> : <LibreTranslate />}
      </div>
    </SecondaryPageLayout>
  )
})
TranslationPage.displayName = 'TranslationPage'
export default TranslationPage
