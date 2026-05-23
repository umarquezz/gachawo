import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Uso das Contas | Gacha World',
  description: 'Regras, responsabilidades e condições relacionadas à utilização das contas digitais adquiridas na Gacha World.',
}

export default function UsoDasContasPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/5 rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-primary rounded-full"></span>
          Política de Uso das Contas
        </h1>
        
        <div className="space-y-8 text-white/70 leading-relaxed">
          <p>
            Esta Política de Uso das Contas tem como objetivo esclarecer as regras, responsabilidades e condições relacionadas à utilização das contas digitais adquiridas em nossa loja (Gacha World). Ao realizar uma compra, o cliente declara estar ciente e de acordo com todos os termos abaixo.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Natureza do Produto</h2>
            <p>
              As contas comercializadas são contas digitais de jogos gacha, entregues de forma eletrônica, geralmente por e-mail, após a confirmação do pagamento.
              Trata-se de um produto digital, intangível e de uso pessoal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Uso da Conta</h2>
            <p className="mb-4">
              Após o recebimento da conta, o cliente passa a ser totalmente responsável pelo uso, gerenciamento e segurança da mesma. Recomendamos fortemente que o cliente:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Altere imediatamente a senha da conta</li>
              <li>Atualize e-mails e dados de recuperação, quando possível</li>
              <li>Não compartilhe os dados da conta com terceiros</li>
            </ul>
            <p className="mt-4">
              A loja não se responsabiliza por perdas decorrentes de mau uso, compartilhamento ou negligência do cliente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Vinculação a Plataformas</h2>
            <p>
              Algumas contas podem estar vinculadas a plataformas externas (como Google, Apple ID ou similares). A responsabilidade por manter, desvincular ou gerenciar essas plataformas passa a ser do cliente após a entrega. Não garantimos a possibilidade de migração entre plataformas, pois isso depende exclusivamente das regras do jogo e do desenvolvedor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Atualizações, Banimentos e Alterações</h2>
            <p className="mb-4">
              A Gacha World não possui controle sobre atualizações, mudanças de regras, políticas internas ou penalizações aplicadas pelos desenvolvedores dos jogos. Não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Banimentos</li>
              <li>Suspensões</li>
              <li>Reset de progresso</li>
              <li>Alterações nas mecânicas do jogo</li>
            </ul>
            <p className="mt-4">
              Decisões tomadas pelos desenvolvedores são independentes da loja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Reembolsos e Trocas</h2>
            <p>
              Por se tratar de um produto digital entregue automaticamente, não realizamos reembolso ou troca após o envio da conta, exceto nos casos previstos em lei ou quando houver: conta inválida, dados incorretos ou falha comprovada na entrega. Nestes casos, o cliente deve entrar em contato com o suporte dentro do prazo informado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Suporte ao Cliente</h2>
            <p className="mb-4">Nosso suporte está disponível para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Problemas de acesso no momento da entrega</li>
              <li>Dúvidas relacionadas ao recebimento</li>
              <li>Erros técnicos comprovados</li>
            </ul>
            <p className="mt-4">
              O suporte não cobre problemas causados após o uso da conta, alterações feitas pelo cliente ou ações externas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Responsabilidade do Cliente</h2>
            <p className="mb-4">Ao adquirir uma conta, o cliente declara que:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Está ciente dos riscos envolvidos no uso de contas digitais</li>
              <li>Utilizará a conta de forma responsável</li>
              <li>Não responsabilizará a loja por decisões tomadas dentro do jogo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Aceitação dos Termos</h2>
            <p>
              Ao finalizar a compra, o cliente confirma que leu, compreendeu e aceitou integralmente esta Política de Uso das Contas. A Gacha World se reserva o direito de alterar este documento a qualquer momento, sem aviso prévio, visando melhorias e adequações legais.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
