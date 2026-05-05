import "dotenv/config";
import { db } from "../src/db/index";
import {
  projects,
  questions,
  questionOptions,
  resultProfiles,
  resultProfileBlocks,
  leads,
  leadAnswers,
} from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

const CONFIRM = process.argv.includes("--confirm");

if (!CONFIRM) {
  console.log(`
⚠️  AVISO: Este script apaga e recria todas as perguntas, opções e perfis do projeto 'biblia-facil'.
   Leads e respostas existentes também serão deletados (FK constraints).

   Para prosseguir:
   npm run db:reseed -- --confirm
`);
  process.exit(0);
}

const questionsData = [
  {
    text: "Quando você abre a Bíblia, qual é o sentimento real que domina você?",
    hint: undefined,
    options: [
      { letter: "A", text: "Confusão: Leio, mas parece um quebra-cabeça com peças faltando. Acabo desistindo.", score: 1 },
      { letter: "B", text: "Impotência: Entendo a história, mas não consigo trazer pro meu dia a dia. A vida continua travada.", score: 2 },
      { letter: "C", text: "Incompletude: Sei o básico, mas sinto que estou perdendo as chaves mestras do governo espiritual.", score: 3 },
      { letter: "D", text: "Tédio Oculto: Tenho vergonha de admitir, mas a leitura é um peso e não um prazer.", score: 1 },
    ],
  },
  {
    text: "O que mais te causa \"frio na barriga\" hoje?",
    hint: undefined,
    options: [
      { letter: "A", text: "Ver minha família passar por problemas e eu não ter uma palavra de autoridade para mudar a situação.", score: 3 },
      { letter: "B", text: "Alguém me questionar sobre minha fé e eu gaguejar por não saber onde está escrito.", score: 2 },
      { letter: "C", text: "Perceber que os anos estão passando e minha vida espiritual é a mesma de 10 anos atrás.", score: 1 },
      { letter: "D", text: "Ter medo de estar sendo enganado por interpretações erradas de outras pessoas.", score: 2 },
    ],
  },
  {
    text: "Por que suas tentativas anteriores de estudar a Bíblia \"morreram no caminho\"?",
    hint: undefined,
    options: [
      { letter: "A", text: "Falta de método: Eu tentava ler como um livro comum, mas a Bíblia é um código.", score: 2 },
      { letter: "B", text: "Cansaço mental: O formato atual é denso demais para minha rotina acelerada.", score: 1 },
      { letter: "C", text: "Falta de clareza: Eu assisto pregações, mas continuo dependente da \"comida mastigada\" dos outros.", score: 3 },
      { letter: "D", text: "Ainda não tentei nada de forma sistemática.", score: 0 },
    ],
  },
  {
    text: "Onde sua vida parece estar \"travada\" hoje por falta de princípios claros?",
    hint: undefined,
    options: [
      { letter: "A", text: "No Governo Pessoal: Falta de disciplina, domínio próprio e decisões erradas.", score: 2 },
      { letter: "B", text: "No Governo da Casa: Conflitos familiares e falta de respeito espiritual dos filhos/cônjuge.", score: 3 },
      { letter: "C", text: "No Governo Financeiro: Trabalho muito, mas não entendo as leis bíblicas da colheita e prosperidade.", score: 2 },
      { letter: "D", text: "Bloqueio Geral: Sinto que estou jogando um jogo sem saber as regras.", score: 1 },
    ],
  },
  {
    text: "Se você tivesse que explicar o plano de Deus de Gênesis a Apocalipse agora, qual seria o resultado?",
    hint: undefined,
    options: [
      { letter: "A", text: "Passaria vergonha. Conheço apenas histórias isoladas (Ex: Arca de Noé).", score: 0 },
      { letter: "B", text: "Falaria muito, mas sem profundidade ou conexão real entre os livros.", score: 1 },
      { letter: "C", text: "Explicaria o Novo Testamento, mas o Antigo Testamento ainda é um mistério.", score: 2 },
      { letter: "D", text: "Tenho o conhecimento na cabeça, mas não tenho didática para ensinar ninguém.", score: 3 },
    ],
  },
  {
    text: "Você acredita que imagens, mapas mentais e resumos visuais facilitariam o seu \"destrave\" bíblico?",
    hint: undefined,
    options: [
      { letter: "A", text: "Sim! Eu aprendo muito mais rápido vendo do que apenas lendo textos densos.", score: 3 },
      { letter: "B", text: "Com certeza, preciso de algo que organize o caos de informações na minha mente.", score: 2 },
      { letter: "C", text: "Preciso de um mapa. Estou cansado de andar em círculos na leitura.", score: 3 },
      { letter: "D", text: "Sim, sinto que o texto puro me cansa e as imagens fixariam o conteúdo de vez.", score: 3 },
    ],
  },
  {
    text: "Imagine que daqui a 1 ano você continua com o mesmo entendimento bíblico de hoje. O que mais te assusta?",
    hint: undefined,
    options: [
      { letter: "A", text: "Estagnação Total: Minha vida continuará nesse looping de dúvidas e decisões erradas.", score: 1 },
      { letter: "B", text: "Perda de Autoridade: Ver minha família sem uma referência espiritual forte em casa.", score: 3 },
      { letter: "C", text: "Vulnerabilidade: Continuar sendo um cristão frágil, que qualquer crise abala.", score: 2 },
      { letter: "D", text: "Arrependimento: Saber que tive a chance de destravar, mas escolhi continuar igual.", score: 1 },
    ],
  },
];

const profilesData = [
  {
    scoreMin: 0,
    scoreMax: 12,
    name: "O Cristão Superficial",
    badge: "Nível Superficial",
    headline: "Você está vivendo de migalhas espirituais e sua vida reflete essa confusão.",
    ctaText: "Quero começar agora por R$19,90 →",
    ctaUrl: "https://pay.hotmart.com/O95283942Y?checkoutMode=10",
    blocks: [
      "Você tem a Bíblia, mas ela é um livro lacrado. O resultado é uma vida espiritual rasa, movida por emoções e não por princípios. O problema não é sua fé, é a sua <strong>omissão</strong>. Enquanto você não entende o \"Código\", você é governado pelas circunstâncias.",
      "A <strong>Bíblia 360°</strong> foi criada para quem está exatamente aqui. Com mapas mentais ilustrados dos 66 livros, você vai entender de forma visual e didática — do contexto histórico até os princípios que governam sua vida.",
    ],
  },
  {
    scoreMin: 13,
    scoreMax: 17,
    name: "O Soldado Desarmado",
    badge: "Nível Intermediário",
    headline: "Sua vida está travada porque você luta a guerra errada com as armas cegas.",
    ctaText: "Quero o Plano Completo por R$39,90 →",
    ctaUrl: "https://pay.hotmart.com/J95283825E?off=y15uhas8&checkoutMode=10",
    blocks: [
      "Você não é ignorante, é <strong>incompleto</strong>. Tem a espada na mão, mas ela está cega. Sabe por que as coisas não avançam? Porque você tem informações isoladas, mas não tem o Governo. Essa insegurança trava sua prosperidade e sua paz.",
      "Os mapas mentais ilustrados da <strong>Bíblia 360°</strong> organizam tudo de forma visual, cronológica e memorável. Você enxerga o quadro completo — e finalmente entende como aplicar os princípios do Reino na sua vida real.",
    ],
  },
  {
    scoreMin: 18,
    scoreMax: 21,
    name: "O Líder Omitido",
    badge: "Nível Avançado",
    headline: "O seu chamado está bloqueado pela sua falta de autoridade técnica.",
    ctaText: "Quero o Plano Completo com todos os bônus →",
    ctaUrl: "https://pay.hotmart.com/J95283825E?off=y15uhas8&checkoutMode=10",
    blocks: [
      "Você nasceu para liderar, mas no fundo sente que é uma fraude. As pessoas esperam uma direção que você não sabe dar com clareza. A <strong>omissão</strong> é o que trava o seu destino e o futuro da sua posteridade. Domine a Bíblia agora ou continue sendo um líder médio.",
      "Com a <strong>Bíblia 360°</strong>, você terá os 66 livros em mapas ilustrados — organizados, cronológicos, prontos para ensinar. Professores de EBD e líderes de célula estão entre os maiores fãs. Este é o seu momento de sair da teoria e assumir o governo.",
    ],
  },
];

async function reseed() {
  console.log("🔄 Reseeding biblia-facil...\n");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, "biblia-facil"));

  if (!project) {
    console.error("❌ Projeto 'biblia-facil' não encontrado. Rode npm run db:seed primeiro.");
    process.exit(1);
  }

  // Delete lead_answers first (no cascade from questions → lead_answers)
  const existingLeads = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.projectId, project.id));

  if (existingLeads.length > 0) {
    const leadIds = existingLeads.map((l) => l.id);
    await db.delete(leadAnswers).where(inArray(leadAnswers.leadId, leadIds));
    await db.delete(leads).where(eq(leads.projectId, project.id));
    console.log(`  ↳ Deletados ${existingLeads.length} leads e suas respostas`);
  }

  // Delete questions — cascades to question_options
  await db.delete(questions).where(eq(questions.projectId, project.id));
  console.log("  ↳ Deletadas perguntas e opções");

  // Delete result profiles — cascades to result_profile_blocks
  await db.delete(resultProfiles).where(eq(resultProfiles.projectId, project.id));
  console.log("  ↳ Deletados perfis e blocos de resultado\n");

  // Insert new questions + options
  for (let i = 0; i < questionsData.length; i++) {
    const qData = questionsData[i];
    const [question] = await db
      .insert(questions)
      .values({
        projectId: project.id,
        orderIndex: i,
        text: qData.text,
        hint: qData.hint ?? null,
      })
      .returning();

    for (let j = 0; j < qData.options.length; j++) {
      const opt = qData.options[j];
      await db.insert(questionOptions).values({
        questionId: question.id,
        letter: opt.letter,
        text: opt.text,
        score: opt.score,
        orderIndex: j,
      });
    }
  }
  console.log(`  ↳ Inseridas ${questionsData.length} perguntas`);

  // Insert new profiles + blocks
  for (const profileData of profilesData) {
    const [profile] = await db
      .insert(resultProfiles)
      .values({
        projectId: project.id,
        scoreMin: profileData.scoreMin,
        scoreMax: profileData.scoreMax,
        name: profileData.name,
        badge: profileData.badge,
        headline: profileData.headline,
        ctaText: profileData.ctaText,
        ctaUrl: profileData.ctaUrl,
      })
      .returning();

    for (let i = 0; i < profileData.blocks.length; i++) {
      await db.insert(resultProfileBlocks).values({
        profileId: profile.id,
        orderIndex: i,
        content: profileData.blocks[i],
      });
    }
  }
  console.log(`  ↳ Inseridos ${profilesData.length} perfis de resultado\n`);

  console.log("✅ Reseed completo.");
  process.exit(0);
}

reseed().catch((err) => {
  console.error(err);
  process.exit(1);
});
