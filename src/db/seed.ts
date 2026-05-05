import "dotenv/config";
import { db } from "./index";
import {
  projects,
  questions,
  questionOptions,
  resultProfiles,
  resultProfileBlocks,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Project
  const [project] = await db
    .insert(projects)
    .values({ slug: "biblia-facil", name: "Bíblia 360°" })
    .onConflictDoNothing()
    .returning();

  if (!project) {
    console.log("Project already exists, skipping seed.");
    process.exit(0);
  }

  // Questions + Options
  const questionsData = [
    {
      text: "Quando você abre a Bíblia para ler, o que geralmente acontece?",
      hint: undefined,
      options: [
        { letter: "A", text: "Leio alguns versículos, mas não entendo o contexto e acabo fechando", score: 1 },
        { letter: "B", text: "Consigo ler, mas na hora de aplicar ou explicar, trava tudo", score: 2 },
        { letter: "C", text: "Leio com regularidade, mas sinto que está na superfície — quero ir mais fundo", score: 3 },
        { letter: "D", text: "Fico pulando de livro em livro sem saber por onde começar direito", score: 1 },
      ],
    },
    {
      text: "Qual dessas situações mais te incomoda?",
      hint: undefined,
      options: [
        { letter: "A", text: "Não saber explicar para minha família ou amigos o que a Bíblia diz", score: 3 },
        { letter: "B", text: "Sentir que todo mundo entende menos eu", score: 1 },
        { letter: "C", text: "Saber os versículos isolados, mas não entender o quadro geral", score: 2 },
        { letter: "D", text: "Não conseguir ter uma rotina de devoção constante", score: 1 },
      ],
    },
    {
      text: "Você já tentou alguma alternativa para estudar melhor a Bíblia?",
      hint: undefined,
      options: [
        { letter: "A", text: "Já tentei leitura diária, mas não durou mais de 2 semanas", score: 1 },
        { letter: "B", text: "Já fiz curso bíblico ou EBD, mas esqueci boa parte do que aprendi", score: 2 },
        { letter: "C", text: "Assisto pregações e vídeos no YouTube, mas não é suficiente", score: 2 },
        { letter: "D", text: "Ainda não tentei nada de forma sistemática", score: 0 },
      ],
    },
    {
      text: "Se você tivesse domínio completo da Bíblia, o que mais mudaria na sua vida?",
      hint: undefined,
      options: [
        { letter: "A", text: "Teria mais paz, segurança e intimidade com Deus", score: 2 },
        { letter: "B", text: "Poderia ensinar meus filhos, liderar uma célula ou ministrar na igreja", score: 3 },
        { letter: "C", text: "Me sentiria mais confiante e preparado espiritualmente", score: 2 },
        { letter: "D", text: "Conseguiria orar e meditar com muito mais profundidade", score: 2 },
      ],
    },
    {
      text: "Quantos livros da Bíblia você consegue resumir de cabeça hoje?",
      hint: undefined,
      options: [
        { letter: "A", text: "Nenhum ou quase nenhum", score: 0 },
        { letter: "B", text: "Uns 5 a 10 — os mais famosos tipo Gênesis, João, Salmos…", score: 1 },
        { letter: "C", text: "Uns 20 a 30 — conheço bem o Novo Testamento, o Antigo ainda confunde", score: 2 },
        { letter: "D", text: "Conheço a maioria, mas sinto que falta organização e profundidade", score: 3 },
      ],
    },
    {
      text: "Como você aprende melhor?",
      hint: "Esta resposta ajuda a identificar o método ideal para você",
      options: [
        { letter: "A", text: "Vendo imagens, mapas e ilustrações", score: 3 },
        { letter: "B", text: "Lendo textos organizados e resumidos", score: 2 },
        { letter: "C", text: "Ouvindo ou assistindo videoaulas", score: 1 },
        { letter: "D", text: "Mistura de tudo — quanto mais recursos, melhor", score: 2 },
      ],
    },
    {
      text: "O que você precisaria para começar a estudar a Bíblia de verdade hoje?",
      hint: undefined,
      options: [
        { letter: "A", text: "Um material prático, visual e fácil de seguir", score: 3 },
        { letter: "B", text: "Mais tempo e motivação", score: 1 },
        { letter: "C", text: "Alguém para me guiar ou uma comunidade", score: 2 },
        { letter: "D", text: "Já tenho o que preciso — só falta colocar em prática", score: 2 },
      ],
    },
  ];

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

  // Result Profiles
  const profilesData = [
    {
      scoreMin: 0,
      scoreMax: 5,
      name: "O Crente Perdido",
      badge: "Nível Iniciante",
      headline: "Você quer crescer na fé, mas sente que a Bíblia fala uma língua que ainda não aprendeu.",
      ctaText: "Quero começar agora por R$19,90 →",
      ctaUrl: "https://pay.hotmart.com/O95283942Y?checkoutMode=10",
      blocks: [
        "<strong>Você não está sozinho.</strong> Milhares de cristãos sinceros abrem a Bíblia com vontade genuína de entender — e fecham com a mesma sensação de que algo passou por cima. Não é falta de fé. É falta de método.",
        "Sem entender o contexto dos livros, cada leitura parece isolada. Você vai acumulando versículos soltos, sem saber como eles se conectam — e isso vai esfriando a chama do estudo.",
        "A <strong>Bíblia 360°</strong> foi criada exatamente para quem está nesse momento. Com mapas mentais ilustrados de todos os 66 livros, você vai entender de forma visual e didática o que cada livro fala — do contexto histórico aos personagens principais.",
      ],
    },
    {
      scoreMin: 6,
      scoreMax: 10,
      name: "O Estudante Travado",
      badge: "Nível Intermediário",
      headline: "Você já tem vontade e já tentou — o que falta é o método certo para tudo se encaixar.",
      ctaText: "Quero o Plano Completo por R$39,90 →",
      ctaUrl: "https://pay.hotmart.com/J95283825E?off=y15uhas8&checkoutMode=10",
      blocks: [
        "<strong>Você não é um iniciante.</strong> Já passou por estudos, já assistiu pregações, já tentou leitura sistemática. Mas existe aquela sensação persistente de que as peças não se encaixam — você sabe partes, mas não o todo.",
        "Quando alguém te pergunta sobre um livro que você 'já leu', você hesita. Quando quer ensinar algo, não sabe por onde começar. A falta de uma visão panorâmica trava o seu crescimento.",
        "Os <strong>mapas mentais ilustrados da Bíblia Fácil</strong> organizam tudo de forma visual, cronológica e memorável. Você enxerga o quadro completo — e as peças finalmente se encaixam.",
      ],
    },
    {
      scoreMin: 11,
      scoreMax: 21,
      name: "O Ensinador em Formação",
      badge: "Nível Avançado",
      headline: "Você foi chamado para ensinar — e está mais perto do que imagina de estar preparado.",
      ctaText: "Quero o Plano Completo com todos os bônus →",
      ctaUrl: "https://pay.hotmart.com/J95283825E?off=y15uhas8&checkoutMode=10",
      blocks: [
        "<strong>Você sente que a Bíblia tem muito a dizer por meio de você.</strong> Seja para seus filhos, sua célula, sua classe da EBD — existe um chamado em você para transmitir a Palavra. E para isso, você precisa dominar o que ensina.",
        "Ensinar sem profundidade tem um limite. As pessoas percebem quando o líder está inseguro. Essa insegurança não vem de falta de fé — vem de não ter uma base organizada de toda a Bíblia na cabeça.",
        "Com a <strong>Bíblia Fácil</strong>, você terá os 66 livros em mapas ilustrados — organizados, cronológicos, prontos para ensinar. Professores de EBD e líderes de célula estão entre os maiores fãs do material.",
      ],
    },
  ];

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

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
