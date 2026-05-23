import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Reembolso | Gacha World',
  description: 'Condições aplicáveis a reembolsos de produtos adquiridos na Gacha World.',
}

export default function ReembolsoPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/5 rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-primary rounded-full"></span>
          Política de Reembolso
        </h1>
        
        <div className="space-y-8 text-white/70 leading-relaxed">
          <p>
            Esta Política de Reembolso tem como objetivo esclarecer, de forma transparente, as condições aplicáveis a reembolsos de produtos adquiridos na Gacha World. Ao realizar uma compra em nossa loja, o cliente declara estar ciente e de acordo com os termos descritos abaixo.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Natureza dos Produtos</h2>
            <p>
              A Gacha World comercializa produtos digitais, incluindo contas e conteúdos de jogos gacha, entregues de forma eletrônica após a confirmação do pagamento. Por se tratarem de produtos digitais e de acesso imediato, aplicam-se regras específicas quanto a reembolsos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Condições para Reembolso</h2>
            <p className="mb-4">
              O reembolso somente será realizado nos seguintes casos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Conta não entregue dentro do prazo informado</li>
              <li>Conta com dados incorretos ou inválidos</li>
              <li>Falha técnica comprovada no sistema de entrega</li>
            </ul>
            <p className="mt-4">
              Nestes casos, o cliente deverá entrar em contato com o suporte para análise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Casos em que NÃO há Reembolso</h2>
            <p className="mb-4">
              Não realizamos reembolso quando:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A conta já foi entregue e acessada</li>
              <li>O cliente alterou dados da conta após o recebimento</li>
              <li>Houve banimento, suspensão ou restrição aplicada pelo jogo</li>
              <li>O cliente não gostou do progresso, itens ou resultados da conta</li>
              <li>O problema ocorreu por mau uso ou compartilhamento da conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Prazo para Solicitação</h2>
            <p>
              Qualquer solicitação de reembolso deve ser feita dentro do prazo de até 7 dias corridos após a compra, exclusivamente para os casos previstos nesta política. Solicitações fora desse prazo não serão analisadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Processo de Análise</h2>
            <p>
              Após o contato com o suporte, a solicitação será analisada em até 5 dias úteis. Caso o reembolso seja aprovado, o valor será devolvido utilizando o mesmo meio de pagamento utilizado na compra, respeitando os prazos da operadora ou instituição financeira.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Chargeback e Contestação</h2>
            <p>
              A abertura de chargeback sem contato prévio com o suporte poderá resultar em bloqueio do atendimento futuro. Recomendamos sempre entrar em contato conosco para solução amigável antes de qualquer contestação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Considerações Finais</h2>
            <p>
              A Gacha World se reserva o direito de negar solicitações que não estejam de acordo com esta Política de Reembolso. Esta política pode ser alterada a qualquer momento, visando adequações legais e melhorias no atendimento.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
