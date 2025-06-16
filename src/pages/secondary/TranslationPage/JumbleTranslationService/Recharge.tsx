import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks'
import { cn } from '@/lib/utils'
import { useTranslationService } from '@/providers/TranslationServiceProvider'
import transaction from '@/services/transaction.service'
import { closeModal, launchPaymentModal } from '@getalby/bitcoin-connect-react'
import { Loader } from 'lucide-react'
import { useState } from 'react'

export default function Recharge() {
  const { toast } = useToast()
  const { account, getAccount } = useTranslationService()
  const [recharging, setRecharging] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(1000)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000)

  const presetAmounts = [
    { amount: 1_000, text: '1k' },
    { amount: 5_000, text: '5k' },
    { amount: 10_000, text: '10k' },
    { amount: 25_000, text: '25k' },
    { amount: 50_000, text: '50k' },
    { amount: 100_000, text: '100k' }
  ]
  const charactersPerUnit = 100 // 1 unit = 100 characters

  const calculateCharacters = (amount: number) => {
    return amount * charactersPerUnit
  }

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount)
    setRechargeAmount(amount)
  }

  const handleInputChange = (value: string) => {
    const numValue = parseInt(value) || 0
    setRechargeAmount(numValue)
    setSelectedAmount(numValue >= 1000 ? numValue : null)
  }

  const handleRecharge = async (amount: number | null) => {
    if (recharging || !account || !amount || amount < 1000) return

    setRecharging(true)
    try {
      const { transactionId, invoiceId } = await transaction.createTransaction(
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
          const { state } = await transaction.checkTransaction(transactionId)
          if (state === 'pending') return

          clearInterval(checkPaymentInterval)
          setRecharging(false)

          if (state === 'settled') {
            setPaid({ preimage: '' }) // Preimage is not returned, but we can assume payment is successful
            getAccount() // Refresh account balance
          } else {
            closeModal()
            toast({
              title: 'Invoice Expired',
              description: 'The invoice has expired or the payment was not successful.',
              variant: 'destructive'
            })
          }
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

  return (
    <div className="space-y-4">
      <p className="font-medium">Recharge</p>

      {/* Preset amounts */}
      <div className="grid grid-cols-2 gap-2">
        {presetAmounts.map(({ amount, text }) => (
          <Button
            key={amount}
            variant="outline"
            onClick={() => handlePresetClick(amount)}
            className={cn(
              'flex flex-col h-auto py-3 hover:bg-primary/10',
              selectedAmount === amount && 'border border-primary bg-primary/10'
            )}
          >
            <span className="text-lg font-semibold">{text} sats</span>
            <span className="text-sm text-muted-foreground">
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
          : `Minimum recharge is ${new Number(1000).toLocaleString()} sats`}
      </Button>
    </div>
  )
}
