import { getSiteSettings } from './actions'
import { SettingsForm } from './SettingsForm'
import { PromoPopupForm } from './PromoPopupForm'
import { Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const heroData = await getSiteSettings('hero_banner') || {
    title: 'Explore o Gacha World!',
    highlight: 'Gacha World!',
    description: 'Os melhores preços em contas e itens digitais! Compre agora com PIX e receba na hora.',
    buttonText: 'Ver Ofertas',
    buttonLink: '/#promocoes',
    backgroundImage: ''
  }

  const promoPopupData = await getSiteSettings('promo_popup') || {
    active: false,
    title: 'Desconto de Boas-vindas!',
    description: 'Use o cupom abaixo em sua primeira compra para ganhar 10% de desconto real!',
    couponCode: 'BEMVINDO10',
    buttonText: 'Aproveitar agora',
    imageUrl: ''
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-white">Configurações do Site</h2>
        <p className="text-white/40 text-sm italic">Personalize a aparência e o conteúdo da página inicial.</p>
      </div>

      {/* Hero Banner Section */}
      <div className="bg-[#111118] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          Painel Principal (Hero Banner)
        </h3>
        <SettingsForm initialData={heroData} />
      </div>

      {/* Promo Popup Section */}
      <div className="bg-[#111118] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-accent rounded-full"></div>
          Popup Promocional
        </h3>
        <PromoPopupForm initialData={promoPopupData} />
      </div>

      {/* Webhook Card — link para página dedicada */}
      <div className="bg-[#111118] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
          Pagamento Automático (Efí Bank)
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-white/50 text-sm leading-relaxed max-w-md">
            Configure o webhook da Efí Bank para que as contas sejam entregues automaticamente após o pagamento Pix. Necessário fazer isso toda vez que mudar o domínio.
          </p>
          <Link
            href="/admin/webhook"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition shrink-0 shadow-lg shadow-green-600/20 text-sm"
          >
            <Zap size={16} />
            Configurar Webhook
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

