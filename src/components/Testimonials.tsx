"use client";
import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "Entrega instantânea mesmo! Comprei a conta de Dragon Ball Legends e em 2 segundos já tava logado. Site 100% confiável.",
    image: "https://xsgames.co/randomusers/assets/avatars/male/74.jpg",
    name: "Ricardo Silva",
    role: "Jogador de Mobile",
  },
  {
    text: "Melhor preço que encontrei para keys da Steam. O suporte no WhatsApp também é muito rápido e atencioso.",
    image: "https://xsgames.co/randomusers/assets/avatars/male/45.jpg",
    name: "Vinícius Jr.",
    role: "PC Gamer",
  },
  {
    text: "Já sou cliente fixo. Sempre que sai lançamento eu venho conferir as promoções aqui primeiro. Recomendo muito!",
    image: "https://xsgames.co/randomusers/assets/avatars/female/23.jpg",
    name: "Beatriz Santos",
    role: "Fã de RPGs",
  },
  {
    text: "Comprei uma conta de Genshin Impact e veio exatamente como descrito. Segurança total na transação via PIX.",
    image: "https://xsgames.co/randomusers/assets/avatars/male/12.jpg",
    name: "Lucas Oliveira",
    role: "Genshin Player",
  },
  {
    text: "O sistema de entrega automática é sensacional. Não precisa ficar esperando o vendedor responder.",
    image: "https://xsgames.co/randomusers/assets/avatars/female/67.jpg",
    name: "Mariana Costa",
    role: "Console Gamer",
  },
  {
    text: "Preços imbatíveis e produtos de qualidade. Economizei muito comprando as keys aqui.",
    image: "https://xsgames.co/randomusers/assets/avatars/male/2.jpg",
    name: "Felipe Melo",
    role: "Pro Player",
  },
];

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div 
                  className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] shadow-xl shadow-black/20 max-w-xs w-full text-white/70 hover:border-primary/30 transition-colors" 
                  key={i}
                >
                  <div className="text-sm italic mb-6 leading-relaxed">"{text}"</div>
                  <div className="flex items-center gap-3">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover border border-white/10 shadow-lg"
                    />
                    <div className="flex flex-col">
                      <div className="font-bold text-sm tracking-tight leading-loose text-white">{name}</div>
                      <div className="text-[10px] uppercase font-bold text-primary tracking-widest leading-none opacity-60">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

export function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4 uppercase">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto font-medium">
            Junte-se a milhares de jogadores que já garantiram seus itens digitais com segurança e entrega instantânea.
          </p>
        </div>

        <div className="flex justify-center gap-6 h-[600px] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
          <TestimonialsColumn testimonials={testimonials.slice(0, 3)} duration={15} />
          <TestimonialsColumn testimonials={testimonials.slice(3, 6)} className="hidden md:block" duration={18} />
          <TestimonialsColumn testimonials={testimonials.slice(0, 3)} className="hidden lg:block" duration={12} />
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />
    </section>
  );
}
