const API_BASE_URL = 'https://api.jumble.social'

class TransactionService {
  static instance: TransactionService

  constructor() {
    if (!TransactionService.instance) {
      TransactionService.instance = this
    }
    return TransactionService.instance
  }

  async createTransaction(
    pubkey: string,
    amount: number
  ): Promise<{
    transactionId: string
    invoiceId: string
  }> {
    const url = API_BASE_URL + '/v1/transactions'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pubkey,
        amount,
        description: 'Recharge for Jumble translation service',
        purpose: 'translation'
      })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to create transaction')
    }
    return data
  }

  async checkTransaction(transactionId: string): Promise<{
    state: 'pending' | 'failed' | 'settled'
  }> {
    const url = API_BASE_URL + `/v1/transactions/${transactionId}/check`
    const response = await fetch(url, {
      method: 'POST'
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to complete transaction')
    }
    return data
  }
}

const instance = new TransactionService()
export default instance
