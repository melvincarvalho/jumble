import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { pubkeyToNpub } from '@/lib/pubkey'
import { useMuteList } from '@/providers/MuteListProvider'
import { useNostr } from '@/providers/NostrProvider'
import { Bell, BellOff, Copy, Ellipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ProfileOptions({ pubkey }: { pubkey: string }) {
  const { t } = useTranslation()
  const { pubkey: accountPubkey } = useNostr()
  const { mutePubkeys, mutePubkeyPrivately, mutePubkeyPublicly, unmutePubkey } = useMuteList()

  if (pubkey === accountPubkey) return null

  const isMuted = mutePubkeys.includes(pubkey)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText('nostr:' + pubkeyToNpub(pubkey))}
        >
          <Copy />
          {t('Copy user ID')}
        </DropdownMenuItem>
        {isMuted ? (
          <DropdownMenuItem
            onClick={() => unmutePubkey(pubkey)}
            className="text-destructive focus:text-destructive"
          >
            <Bell />
            {t('Unmute user')}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => mutePubkeyPrivately(pubkey)}
              className="text-destructive focus:text-destructive"
            >
              <BellOff />
              {t('Mute user privately')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => mutePubkeyPublicly(pubkey)}
              className="text-destructive focus:text-destructive"
            >
              <BellOff />
              {t('Mute user publicly')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
