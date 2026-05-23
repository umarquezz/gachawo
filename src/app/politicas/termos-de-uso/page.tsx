import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso | Gacha World',
  description: 'Termos de uso que regulam o acesso e a utilização do site Gacha World.',
}

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/5 rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-primary rounded-full"></span>
          Termos de Uso
        </h1>
        
        <div className="space-y-8 text-white/70 leading-relaxed">
          <p>
            Bem-vindo à Gacha World. Estes Termos de Uso regulam o acesso e a utilização do site, bem como a compra e uso dos produtos digitais disponibilizados. Ao acessar o site ou realizar uma compra, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Sobre a Gacha World</h2>
            <p>
              A Gacha World é uma loja online especializada na comercialização de produtos digitais, incluindo contas e conteúdos relacionados a jogos do tipo gacha, entregues de forma eletrônica após a confirmação do pagamento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Elegibilidade do Usuário</h2>
            <p className="mb-4">Ao utilizar este site, o usuário declara que:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Possui capacidade legal para realizar compras</li>
              <li>Utiliza o site de forma lícita</li>
              <li>Fornece informações verdadeiras e atualizadas</li>
            </ul>
            <p className="mt-4">
              É proibida a utilização do site para fins ilegais, fraudulentos ou que violem estes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Produtos Digitais</h2>
            <p>
              Os produtos comercializados são digitais e intangíveis, não havendo envio físico. Após a confirmação do pagamento, o produto é entregue de forma eletrônica, geralmente por e-mail ou sistema automatizado. Por se tratarem de produtos digitais, o acesso é considerado imediato após a entrega.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Responsabilidade do Usuário</h2>
            <p className="mb-4">Após o recebimento do produto, o usuário passa a ser o único responsável por:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uso da conta</li>
              <li>Alteração de senhas e dados</li>
              <li>Segurança das informações recebidas</li>
            </ul>
            <p className="mt-4">
              A Gacha World não se responsabiliza por perdas decorrentes de mau uso, compartilhamento ou ações do próprio usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Regras dos Jogos e Desenvolvedores</h2>
            <p>
              A Gacha World não possui vínculo com os desenvolvedores ou publicadoras dos jogos. Alterações de regras, políticas internas, banimentos, suspensões ou qualquer ação aplicada pelos jogos são de responsabilidade exclusiva dos desenvolvedores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Pagamentos</h2>
            <p>
              Os pagamentos podem ser realizados por meio dos métodos disponibilizados no site. A liberação do produto está condicionada à confirmação do pagamento pela operadora ou instituição financeira.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Reembolsos</h2>
            <p>
              As condições de reembolso seguem a Política de Reembolso disponível no site, a qual integra estes Termos de Uso. Recomendamos a leitura completa antes da compra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do site, incluindo textos, imagens, logotipos e identidade visual, é de propriedade da Gacha World, sendo proibida a reprodução sem autorização prévia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Limitação de Responsabilidade</h2>
            <p className="mb-4">
              A Gacha World não será responsável por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Expectativas subjetivas do usuário</li>
              <li>Resultados dentro dos jogos</li>
              <li>Indisponibilidade temporária do site</li>
            </ul>
            <p className="mt-4">
              O uso do site e dos produtos ocorre por conta e risco do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Alterações dos Termos</h2>
            <p>
              A Gacha World se reserva o direito de modificar estes Termos de Uso a qualquer momento, sem aviso prévio. As alterações entram em vigor a partir da publicação no site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Aceitação</h2>
            <p>
              Ao utilizar o site ou finalizar uma compra, o usuário confirma a aceitação integral destes Termos de Uso.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
