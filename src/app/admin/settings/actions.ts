'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function getSiteSettings(key: string) {
  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  
  return data?.value || null
}

export async function updateSiteSettings(key: string, value: any) {
  const supabase = supabaseAdmin()
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/')
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function setupEfiWebhook() {
  try {
    const headerList = await headers()
    const host = headerList.get('host')
    const protocol = headerList.get('x-forwarded-proto') || 'https'

    const webhookUrl = `${protocol}://${host}/api/webhook/efi`
    const pixKey = (process.env.EFI_PIX_KEY || '').trim()

    if (!pixKey) return { success: false, error: 'EFI_PIX_KEY não configurada nas variáveis de ambiente.' }
    if (!process.env.EFI_CLIENT_ID) return { success: false, error: 'EFI_CLIENT_ID não configurada.' }
    if (!process.env.EFI_CLIENT_SECRET) return { success: false, error: 'EFI_CLIENT_SECRET não configurada.' }
    if (!process.env.EFI_CERT_BASE64) return { success: false, error: 'EFI_CERT_BASE64 não configurada.' }

    console.log(`[Webhook] Registrando: ${webhookUrl} para chave: ${pixKey}`)

    const getEfiPay = (await import('@/lib/efi')).default
    const efi = getEfiPay()

    // @ts-ignore
    await efi.pixConfigWebhook({ chave: pixKey }, { webhookUrl })

    return { success: true, url: webhookUrl }

  } catch (error: any) {
    console.error('[Webhook] Erro capturado:', error);

    let msg = 'Erro desconhecido';
    if (typeof error === 'string') {
      msg = error;
    } else if (error?.response?.data) {
      const d = error.response.data;
      msg = `Efí API: ${d.mensagem || d.message || d.error || JSON.stringify(d)}`;
    } else if (error?.error_description) {
      msg = `Efí Auth: ${error.error_description}`;
    } else if (error?.message) {
      msg = `Sistema: ${error.message}`;
    } else {
      msg = `Raw: ${JSON.stringify(error)}`;
    }

    return { success: false, error: msg };
  }
}

