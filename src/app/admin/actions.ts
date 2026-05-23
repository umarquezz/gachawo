'use server'

import { revalidatePath } from 'next/cache'
import EfiPay from 'sdk-node-apis-efi'
import path from 'path'
import { headers } from 'next/headers'

export async function registerEfiWebhook() {
  try {
    const headerList = await headers()
    const host = headerList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const siteUrl = `${protocol}://${host}`

    const certPath = path.join(process.cwd(), 'certificates', 'cert.p12')

    const options = {
      sandbox: process.env.EFI_SANDBOX === 'true',
      client_id: (process.env.EFI_CLIENT_ID || '').trim(),
      client_secret: (process.env.EFI_CLIENT_SECRET || '').trim(),
      certificate: certPath,
      validateMtls: false
    }

    // @ts-ignore
    const efi = new EfiPay(options)
    const pixKey = (process.env.EFI_PIX_KEY || '').trim()

    if (!pixKey) {
      return { error: 'EFI_PIX_KEY não configurada no ambiente.' }
    }

    const params = { chave: pixKey }
    const body = { webhookUrl: `${siteUrl}/api/webhook/efi` }

    // @ts-ignore
    const response = await efi.pixConfigWebhook(params, body)

    console.log('[Admin] Webhook registrado:', response)
    
    revalidatePath('/admin')
    return { success: true, message: 'Webhook registrado com sucesso na Efí!', details: response }
  } catch (error: any) {
    console.error('[Admin] Erro ao registrar webhook:', error)
    return { 
      error: 'Erro ao registrar na Efí.', 
      details: typeof error === 'string' ? error : (error.message || JSON.stringify(error)) 
    }
  }
}
