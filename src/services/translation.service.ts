import client from './client.service'

const API_BASE_URL = 'https://api.jumble.social'

class TranslationService {
  static instance: TranslationService

  constructor() {
    if (!TranslationService.instance) {
      TranslationService.instance = this
    }
    return TranslationService.instance
  }

  async getAccount() {
    const url = API_BASE_URL + '/v1/translation/account'
    const auth = await client.signHttpAuth(url, 'get')
    const response = await fetch(url, {
      headers: { Authorization: auth }
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to fetch account information')
    }
    return data
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

const instance = new TranslationService()
export default instance
