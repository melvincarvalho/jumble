import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks'
import { cn } from '@/lib/utils'
import translation from '@/services/translation.service'
import { launchPaymentModal } from '@getalby/bitcoin-connect-react'
import { Check, Copy, Eye, EyeOff, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'

type JumbleTranslationAccount = {
  pubkey: string
  apiKey: string
  balance: number
}

export function JumbleTranslation() {
  const { toast } = useToast()
  const [account, setAccount] = useState<JumbleTranslationAccount | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [recharging, setRecharging] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const accountData = await translation.getAccount()
        setAccount({
          pubkey: accountData.pubkey,
          apiKey: accountData.api_key,
          balance: accountData.balance
        })
        setError(null)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch account information')
        setAccount(null)
      }
    }
    init()
  }, [])

  const [rechargeAmount, setRechargeAmount] = useState('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)

  const presetAmounts = [1000, 10000, 100000, 1000000]
  const charactersPerUnit = 100 // 1 unit = 100 characters

  const calculateCharacters = (amount: number) => {
    return amount * charactersPerUnit
  }

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount)
    setRechargeAmount(amount.toString())
  }

  const handleInputChange = (value: string) => {
    const numValue = parseInt(value) || 0
    setRechargeAmount(value)
    setSelectedAmount(numValue >= 1000 ? numValue : null)
  }

  const handleRecharge = async (amount: number | null) => {
    if (recharging || !account || !amount || amount < 1000) return

    setRecharging(true)
    try {
      const { transactionId, invoiceId } = await translation.createTransaction(
        account.pubkey,
        amount
      )

      let checkPaymentInterval: ReturnType<typeof setInterval> | undefined = undefined
      const { setPaid } = launchPaymentModal({
        invoice: invoiceId,
        onCancelled: () => {
          clearInterval(checkPaymentInterval)
          setRecharging(false)
        }
      })

      let failedCount = 0
      checkPaymentInterval = setInterval(async () => {
        try {
          const { state } = await translation.checkTransaction(transactionId)
          if (state === 'settled') {
            clearInterval(checkPaymentInterval)
            setRecharging(false)
            setPaid({ preimage: '' }) // Preimage is not returned, but we can assume payment is successful
          }
          failedCount = 0 // Reset failed count on successful check
        } catch (err) {
          failedCount++
          if (failedCount <= 3) return

          clearInterval(checkPaymentInterval)
          setRecharging(false)
          toast({
            title: 'Recharge Failed',
            description: err instanceof Error ? err.message : 'An error occurred while recharging',
            variant: 'destructive'
          })
        }
      }, 2000)
    } catch (err) {
      setRecharging(false)
      toast({
        title: 'Recharge Failed',
        description: err instanceof Error ? err.message : 'An error occurred while recharging',
        variant: 'destructive'
      })
    }
  }

  if (error) {
    return <div className="text-center w-full">{error}</div>
  }

  if (!account) {
    return <div className="text-center w-full">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* Balance display in characters */}
      <div className="space-y-2">
        <p className="font-medium">Balance</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">{account.balance.toLocaleString()}</p>
          <p className="text-muted-foreground">characters</p>
        </div>
      </div>

      {/* API Key section with visibility toggle and copy functionality */}
      <div className="space-y-2">
        <p className="font-medium">API Key</p>
        <div className="flex items-center gap-2">
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={account.apiKey}
            readOnly
            className="font-mono w-fit"
          />
          <Button variant="outline" onClick={() => setShowApiKey(!showApiKey)}>
            {showApiKey ? <EyeOff /> : <Eye />}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(account.apiKey)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground select-text">
          This API is compatible with LibreTranslate. Service URL: https://api.jumble.social
        </p>
      </div>

      {/* Recharge section */}
      <div className="space-y-4">
        <p className="font-medium">Recharge</p>

        {/* Preset amounts */}
        <div className="grid grid-cols-2 gap-2">
          {presetAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              onClick={() => handlePresetClick(amount)}
              className={cn(
                'flex flex-col h-auto py-3',
                selectedAmount === amount && 'border border-primary bg-primary/10'
              )}
            >
              <span className="font-semibold">{amount.toLocaleString()} sats</span>
              <span className="text-xs opacity-75">
                {calculateCharacters(amount).toLocaleString()} characters
              </span>
            </Button>
          ))}
        </div>

        {/* Custom amount input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Custom amount"
              value={rechargeAmount}
              onChange={(e) => handleInputChange(e.target.value)}
              min={1000}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">sats</span>
          </div>
          {selectedAmount && selectedAmount >= 1000 && (
            <p className="text-sm text-muted-foreground">
              Will receive: {calculateCharacters(selectedAmount).toLocaleString()} characters
            </p>
          )}
        </div>

        <Button
          className="w-full"
          disabled={recharging || !selectedAmount || selectedAmount < 1000}
          onClick={() => handleRecharge(selectedAmount)}
        >
          {recharging && <Loader className="animate-spin" />}
          {selectedAmount && selectedAmount >= 1000
            ? 'Recharge ' + selectedAmount.toLocaleString() + ' sats'
            : `Minimum recharge is 1,000 sats`}
        </Button>
      </div>
    </div>
  )
}
