import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';

/**
 * Utilitário para integração com a API Pix da Efí Bank (Gerencianet)
 */

let certificatePath = path.join(process.cwd(), 'certificates', 'cert.p12');

// Limpeza de variáveis para evitar espaços em branco invisíveis
const getEfiOptions = () => {
  // Na Vercel, o caminho local às vezes falha. A forma 100% segura é usar Base64 via Variável de Ambiente.
  if (process.env.EFI_CERT_BASE64) {
    certificatePath = '/tmp/cert.p12';
    const cleanBase64 = process.env.EFI_CERT_BASE64.replace(/\s+/g, '').replace(/^["']|["']$/g, '');
    fs.writeFileSync(certificatePath, Buffer.from(cleanBase64, 'base64'));
  }

  return {
    sandbox: false, // Forçar sempre produção
    client_id: 'Client_Id_ea1a0f52e3eacdc5daef1c3a0d9e947b27f76a4f',
    client_secret: 'Client_Secret_b4e1d6af6fa04fa2c1ac35816a1d261bfb5ec4a8',
    certificate: certificatePath,
    validateMtls: true,
  };
};

const getEfiPay = () => {
  const options = getEfiOptions();
  // @ts-ignore
  return new EfiPay(options);
};

export default getEfiPay;

/**
 * Cria uma cobrança Pix imediata
 */
export async function createImmediatePixCharge(orderId: string, amountBrl: number, customerEmail: string) {
  const body = {
    calendario: { expiracao: 3600 },
    valor: { original: (amountBrl / 100).toFixed(2) },
    chave: (process.env.EFI_PIX_KEY || '').trim().replace(/^["']|["']$/g, ''),
    solicitacaoPagador: `Pedido #${orderId}`,
    infoAdicionais: [
      { nome: 'Pedido', valor: orderId },
      { nome: 'Cliente', valor: customerEmail },
    ],
  };

  if (!body.chave) {
    throw new Error('Variável de ambiente EFI_PIX_KEY não configurada.');
  }

  try {
    const efiPay = getEfiPay();
    // @ts-ignore
    const charge = await efiPay.pixCreateImmediateCharge({}, body);

    if (!charge.loc || !charge.loc.id) {
      throw new Error('Falha ao obter location da cobrança Pix');
    }

    // Generate QR Code locally to avoid insufficient_scope error from Efí API
    const qrCodeImage = await QRCode.toDataURL(charge.pixCopiaECola);

    return {
      txid: charge.txid,
      pixCopiaECola: charge.pixCopiaECola,
      qrCodeImage: qrCodeImage,
      qrCodeLink: `https://pix.bcb.gov.br/qr/${charge.loc.location}`, // Optional link, generally not used directly
    };
  } catch (error: any) {
    const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
    console.error('Efí API Raw Error:', errorMessage);
    throw errorMessage;
  }
}
