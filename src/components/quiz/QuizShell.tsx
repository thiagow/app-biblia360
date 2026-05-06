"use client";

import { useState, useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

interface Option {
  id: string;
  letter: string;
  text: string;
  score: number;
  orderIndex: number;
}

interface Question {
  id: string;
  text: string;
  hint: string | null;
  orderIndex: number;
  options: Option[];
}

interface ProfileBlock {
  id: string;
  content: string;
  orderIndex: number;
}

interface Profile {
  id: string;
  scoreMin: number;
  scoreMax: number;
  name: string;
  badge: string;
  headline: string;
  ctaText: string;
  ctaUrl: string;
  blocks: ProfileBlock[];
}

interface QuizData {
  project: { id: string; slug: string; name: string };
  questions: Question[];
  profiles: Profile[];
}

type Screen = "intro" | "question" | "loading" | "result" | "testimonials" | "offer" | "checkout";

function ProofCarousel() {
  const IMAGES = [
    "/quiz-provasocial-1.jpg",
    "/quiz-provasocial-2.jpg",
    "/quiz-provasocial-3.jpg",
    "/quiz-provasocial-4.jpg",
    "/quiz-provasocial-5.jpg",
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + IMAGES.length) % IMAGES.length);
  const next = () => setCurrent((c) => (c + 1) % IMAGES.length);

  return (
    <div style={{ position: "relative" }}>
      {/* Track */}
      <div style={{ overflow: "hidden", borderRadius: "12px" }}>
        <div
          style={{
            display: "flex",
            transform: `translateX(-${current * 100}%)`,
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Prova social ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              style={{
                minWidth: "100%",
                width: "100%",
                maxHeight: "420px",
                objectFit: "contain",
                borderRadius: "12px",
                display: "block",
              }}
            />
          ))}
        </div>
      </div>

      {/* Setas */}
      {(["prev", "next"] as const).map((dir) => (
        <button
          key={dir}
          onClick={dir === "prev" ? prev : next}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            [dir === "prev" ? "left" : "right"]: "8px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(26,20,16,0.72)",
            border: "1px solid rgba(212,168,80,0.35)",
            color: "var(--gold)",
            fontSize: "20px",
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          {dir === "prev" ? "‹" : "›"}
        </button>
      ))}

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "14px" }}>
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? "22px" : "7px",
              height: "7px",
              borderRadius: "4px",
              background: i === current ? "var(--gold)" : "rgba(212,168,80,0.28)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: "var(--surface)", border: "0.5px solid rgba(212,168,80,0.18)", borderRadius: "10px", overflow: "hidden" }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ color: "var(--cream)", fontSize: "13px", fontWeight: 500, lineHeight: 1.4 }}>{item.q}</span>
            <span style={{ color: "var(--gold)", fontSize: "16px", flexShrink: 0, transition: "transform 0.2s", transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: "0 16px 14px", color: "var(--cream-sub)", fontSize: "12px", lineHeight: "1.65" }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface Answer {
  questionId: string;
  optionId: string;
  score: number;
}

export function QuizShell({ data }: { data: QuizData }) {
  const { project, questions, profiles } = data;
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [resultProfile, setResultProfile] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "advanced">("advanced");
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [advancedWithDiscount, setAdvancedWithDiscount] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"basic" | "advanced" | null>(null);
  const trackedPageView = useRef(false);

  useEffect(() => {
    if (!trackedPageView.current) {
      trackedPageView.current = true;
      track(project.slug, "page_view", {
        url: window.location.href,
        referrer: document.referrer,
      });
    }
  }, [project.slug]);

  const totalScore = answers.reduce((s, a) => s + a.score, 0);

  function getProfile(score: number) {
    return (
      profiles.find((p) => score >= p.scoreMin && score <= p.scoreMax) ??
      profiles[0]
    );
  }

  function startQuiz() {
    track(project.slug, "quiz_start");
    setScreen("question");
  }

  function selectOption(idx: number) {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);

    setTimeout(() => {
      const q = questions[currentQ];
      const opt = q.options[idx];

      const newAnswers = [
        ...answers,
        { questionId: q.id, optionId: opt.id, score: opt.score },
      ];
      setAnswers(newAnswers);

      track(project.slug, "question_answer", {
        questionIndex: currentQ,
        optionLetter: opt.letter,
        score: opt.score,
      });

      if (currentQ + 1 >= questions.length) {
        const total = newAnswers.reduce((s, a) => s + a.score, 0);
        const profile = getProfile(total);
        track(project.slug, "quiz_complete", { totalScore: total });
        setResultProfile(profile);
        setScreen("loading");
        setTimeout(() => {
          track(project.slug, "result_view", { profileName: profile.name, score: total });
          setScreen("result");
        }, 10000);
      } else {
        setCurrentQ((c) => c + 1);
        setSelectedIdx(null);
      }
    }, 350);
  }

  function prevQuestion() {
    if (currentQ > 0) {
      setCurrentQ((c) => c - 1);
      setSelectedIdx(null);
      const prevAnswer = answers[answers.length - 1];
      if (prevAnswer) {
        setAnswers(answers.slice(0, -1));
      }
    }
  }

  function restart() {
    setScreen("intro");
    setCurrentQ(0);
    setSelectedIdx(null);
    setAnswers([]);
    setResultProfile(null);
    setSelectedPlan("advanced");
    setShowDiscountPopup(false);
    setAdvancedWithDiscount(false);
  }

  const progress =
    screen === "question"
      ? Math.round((currentQ / questions.length) * 100)
      : screen === "result"
      ? 100
      : 0;

  return (
    <div className="quiz-wrap">
      <div className="bg-pattern" />
      <div className="inner">
        {/* Progress bar */}
        {screen === "question" && (
          <div className="progress-bar-wrap">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-label">
              {screen === "question"
                ? `${currentQ + 1} / ${questions.length}`
                : `${questions.length} / ${questions.length}`}
            </span>
          </div>
        )}

        {/* Intro */}
        {screen === "intro" && (
          <div>
            <h1 className="intro-title">
              Por que sua vida não anda? <br />A sua impotência em entender a Bíblia é o que te mantém preso no mesmo ciclo de erros.
            </h1>
            <div className="flex justify-center mb-6 sm:mb-8 px-4">
              <img src="/biblia360-intro.png" alt="Bíblia 360°" className="w-full max-w-sm sm:max-w-md object-contain" />
            </div>
            <p className="intro-sub">
              Responda {questions.length} perguntas e descubra o o grau da sua cegueira espiritual e acesse o caminho didático para destravar seu entendimento em tempo recorde.
            </p>
            <div className="social-proof">
              <div className="social-proof-dot" />
              <span>
                Mais de{" "}
                <strong>10.000 cristãos brasileiros</strong> já transformaram
                seu estudo bíblico
              </span>
            </div>
            <button className="btn-primary" onClick={startQuiz}>
              Fazer o teste agora
            </button>
          </div>
        )}

        {/* Question */}
        {screen === "question" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <button
                onClick={prevQuestion}
                disabled={currentQ === 0}
                style={{
                  background: "none",
                  border: "none",
                  color: currentQ === 0 ? "var(--cream-muted)" : "var(--gold)",
                  cursor: currentQ === 0 ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  padding: "4px 8px",
                  opacity: currentQ === 0 ? 0.3 : 1,
                }}
                title="Pergunta anterior"
              >
                ← Voltar
              </button>
              <div className="q-number" style={{ fontSize: "18px", fontWeight: 600, color: "var(--gold)" }}>
                Pergunta {currentQ + 1} de {questions.length}
              </div>
              <div style={{ width: "70px" }} />
            </div>
            {/* Imagem da pergunta */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem", padding: "0 16px", minHeight: "200px", alignItems: "center" }}>
              <img
                key={`quiz-step-${currentQ}`}
                src={`/quiz-step-${currentQ + 1}.jpg`}
                alt={`Pergunta ${currentQ + 1}`}
                loading="eager"
                style={{
                  maxWidth: "100%",
                  width: "auto",
                  maxHeight: "250px",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "12px",
                  display: "block",
                }}
              />
            </div>
            <div className="q-text">{questions[currentQ].text}</div>
            {questions[currentQ].hint && (
              <div className="q-hint">{questions[currentQ].hint}</div>
            )}
            <div className="options">
              {questions[currentQ].options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`opt${selectedIdx === idx ? " selected" : ""}`}
                  onClick={() => selectOption(idx)}
                >
                  <div className="opt-letter">{opt.letter}</div>
                  <div className="opt-text">{opt.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {screen === "loading" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div className="flex justify-center px-4 mb-6">
              <img
                src="/biblia360-loading.png"
                alt="Carregando..."
                className="w-full max-w-sm sm:max-w-md object-contain"
              />
            </div>
            <div style={{ color: "var(--cream-muted)", fontSize: "16px", marginBottom: "1.75rem", lineHeight: "1.6" }}>
              Preparando seu diagnóstico bíblico personalizado
            </div>
            <div style={{ width: "100%", height: "3px", background: "var(--gold-faint)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "var(--gold)",
                  borderRadius: "2px",
                  animation: "loadingBar 10s ease-in-out forwards",
                }}
              />
            </div>
            <style>{`
              @keyframes loadingBar {
                from { width: 0% }
                to { width: 100% }
              }
            `}</style>
          </div>
        )}


        {/* Testimonials */}
        {screen === "testimonials" && (
          <div>
            <div className="capture-title">A prova real de que a vida destrava quando o entendimento bíblico aparece.</div>
            <div style={{ margin: "1.5rem 0" }}>
              <ProofCarousel />
            </div>
            <button className="btn-primary" onClick={() => setScreen("offer")}>Continuar →</button>
          </div>
        )}

        {/* Offer */}
        {screen === "offer" && resultProfile && (
          <div>
            <div className="capture-title">Escolha seu plano</div>
            <div style={{ background: "rgba(212,168,80,0.1)", border: "1px solid rgba(212,168,80,0.3)", borderRadius: "12px", padding: "14px 16px", marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{ color: "var(--gold)", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>📱 Acesso via Aplicativo</div>
              <div style={{ color: "var(--cream-sub)", fontSize: "12px", lineHeight: "1.6" }}>
                O Bíblia 360° vive no seu bolso através de um aplicativo exclusivo.
              </div>
            </div>
            <style>{`
              @media (max-width: 768px) {
                .plans-container {
                  display: flex;
                  flex-direction: column-reverse;
                  gap: 16px;
                  margin: 1.5rem 0;
                }
              }
              @media (min-width: 769px) {
                .plans-container {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 16px;
                  margin: 1.5rem 0;
                }
              }
            `}</style>
            <div className="plans-container">
              {/* Plano Básico */}
              <div
                onClick={() => {
                  setSelectedPlan("basic");
                  setShowDiscountPopup(true);
                }}
                style={{
                  background: selectedPlan === "basic" ? "linear-gradient(135deg, #1f1408 0%, #2a1c0a 100%)" : "var(--surface)",
                  border: selectedPlan === "basic" ? "2px solid var(--gold)" : "1px solid rgba(212,168,80,0.18)",
                  borderRadius: "16px",
                  padding: "20px 16px",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: selectedPlan === "basic" ? "0 0 24px rgba(212,168,80,0.2)" : "none",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <div style={{ color: "var(--cream)", fontSize: "16px", fontWeight: 600, fontFamily: "'Playfair Display', serif", marginBottom: "8px" }}>Plano Básico</div>
                  <div style={{ color: "var(--cream-sub)", fontSize: "12px", marginBottom: "12px" }}>Bíblia 360°</div>
                  <div style={{ color: "var(--cream-sub)", fontSize: "11px", marginBottom: "16px" }}>Acesso anual</div>
                  <div style={{ color: "var(--gold)", fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>R$ 19,90</div>
                </div>
                <div style={{ borderTop: "0.5px solid rgba(212,168,80,0.15)", paddingTop: "16px", marginBottom: "16px" }}>
                  <div style={{ color: "var(--cream-sub)", fontSize: "12px", lineHeight: "1.6" }}>
                    <div style={{ marginBottom: "8px" }}>✦ 39 Mapas mentais (AT)</div>
                    <div>✦ 27 Mapas mentais (NT)</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan("basic");
                    setShowDiscountPopup(true);
                  }}
                  style={{
                    width: "100%",
                    background: "var(--gold)",
                    color: "#1a1410",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Quero o Plano Básico
                </button>
              </div>

              {/* Plano Avançado */}
              <div
                onClick={() => selectedPlan !== "advanced" && setSelectedPlan("advanced")}
                style={{
                  background: selectedPlan === "advanced" ? "linear-gradient(135deg, #1f1408 0%, #2a1c0a 100%)" : "var(--surface)",
                  border: selectedPlan === "advanced" ? "2px solid var(--gold)" : "1px solid rgba(212,168,80,0.18)",
                  borderRadius: "16px",
                  padding: "20px 16px",
                  cursor: selectedPlan === "advanced" && advancedWithDiscount ? "default" : "pointer",
                  transition: "all 0.3s",
                  boxShadow: selectedPlan === "advanced" ? "0 0 24px rgba(212,168,80,0.2)" : "none",
                  position: "relative",
                }}
              >
                <div style={{ position: "absolute", top: "-12px", right: "16px", background: "var(--gold)", color: "#1a1410", padding: "4px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {advancedWithDiscount ? "✓ Desconto Aplicado" : "Mais usado"}
                </div>
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <div style={{ color: "var(--cream)", fontSize: "16px", fontWeight: 600, fontFamily: "'Playfair Display', serif", marginBottom: "8px" }}>Plano Avançado</div>
                  <div style={{ color: "var(--cream-sub)", fontSize: "12px", marginBottom: "12px" }}>Bíblia 360°</div>
                  <div style={{ color: "var(--cream-sub)", fontSize: "11px", marginBottom: "16px" }}>Acesso anual</div>
                  {advancedWithDiscount ? (
                    <div>
                      <div style={{ color: "rgba(245,232,200,0.35)", fontSize: "12px", textDecoration: "line-through", marginBottom: "4px" }}>R$ 39,90</div>
                      <div style={{ color: "var(--gold)", fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>R$ 27,90</div>
                    </div>
                  ) : (
                    <div style={{ color: "var(--gold)", fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>R$ 39,90</div>
                  )}
                </div>
                <div style={{ borderTop: "0.5px solid rgba(212,168,80,0.15)", paddingTop: "12px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--gold)", marginBottom: "10px", fontWeight: 500 }}>Inclui tudo do Básico +</div>
                  <div style={{ color: "var(--cream-sub)", fontSize: "11px", lineHeight: "1.5" }}>
                    <div style={{ marginBottom: "4px" }}>✦ 39 Resumos (AT)</div>
                    <div style={{ marginBottom: "4px" }}>✦ 27 Resumos (NT)</div>
                    <div style={{ marginBottom: "4px" }}>✦ Guia de Orações</div>
                    <div style={{ marginBottom: "4px" }}>✦ Emoções da Bíblia</div>
                    <div style={{ marginBottom: "4px" }}>✦ Divisão Bíblica</div>
                    <div style={{ marginBottom: "4px" }}>✦ Tabela Periódica</div>
                    <div style={{ marginBottom: "4px" }}>✦ Planner Devocional</div>
                    <div style={{ marginBottom: "4px" }}>✦ Guia da Fé</div>
                    <div>✦ Marcadores Bíblicos</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCheckoutPlan("advanced");
                    setScreen("checkout");
                  }}
                  style={{
                    width: "100%",
                    background: "var(--gold)",
                    color: "#1a1410",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Quero o Plano Avançado
                </button>
              </div>
            </div>

            {/* Popup de Desconto */}
            {showDiscountPopup && selectedPlan === "basic" && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
                <div style={{ background: "linear-gradient(135deg, #1f1408 0%, #2a1c0a 100%)", border: "2px solid var(--gold)", borderRadius: "16px", padding: "32px 24px", maxWidth: "450px", width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                  <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <div style={{ color: "var(--gold)", fontSize: "20px", fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: "16px", lineHeight: 1.3 }}>ESPERA! Você vai mesmo escolher continuar travado?</div>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ color: "var(--cream)", fontSize: "13px", lineHeight: "1.7", margin: "0 0 12px 0" }}>
                      Identificamos que o seu perfil precisa de ferramentas <strong>avançadas</strong> para romper o ciclo de erros. O Plano Básico entrega apenas o conteúdo, mas o Plano Completo entrega o <strong>GOVERNO</strong>.
                    </p>
                    <p style={{ color: "var(--cream-sub)", fontSize: "13px", lineHeight: "1.7", margin: 0 }}>
                      Somente nesta tela, liberamos um acesso exclusivo para você não retroceder. Se fechar esta janela, esta oferta desaparece para sempre.
                    </p>
                  </div>

                  <div style={{ background: "rgba(212,168,80,0.15)", border: "1px solid rgba(212,168,80,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "24px", textAlign: "center" }}>
                    <div style={{ color: "var(--cream-sub)", fontSize: "12px", marginBottom: "8px" }}>De R$ 39,90 por apenas:</div>
                    <div style={{ color: "var(--gold)", fontSize: "42px", fontWeight: 700, fontFamily: "'Playfair Display', serif", lineHeight: 1, marginBottom: "4px" }}>R$ 27,90</div>
                    <div style={{ color: "var(--cream-muted)", fontSize: "11px" }}>(Plano anual.)</div>
                  </div>

                  <button
                    onClick={() => {
                      setAdvancedWithDiscount(true);
                      setCheckoutPlan("advanced");
                      setShowDiscountPopup(false);
                      setScreen("checkout");
                    }}
                    style={{
                      width: "100%",
                      background: "var(--gold)",
                      color: "#1a1410",
                      border: "none",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Sim! Quero o Plano Completo com Desconto
                  </button>

                  <button
                    onClick={() => {
                      setCheckoutPlan("basic");
                      setShowDiscountPopup(false);
                      setScreen("checkout");
                    }}
                    style={{
                      width: "100%",
                      background: "transparent",
                      color: "var(--cream-sub)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Não, prefiro continuar com o básico e assumir o risco de continuar sem entender.
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: "rgba(212,168,80,0.06)", border: "0.5px solid rgba(212,168,80,0.25)", borderRadius: "14px", padding: "16px", margin: "1.25rem 0", display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <img src="/biblia360-garantia.png" alt="Garantia 7 dias" style={{ width: 64, height: 64, minWidth: 64, objectFit: "contain" }} />
              <div>
                <div style={{ color: "var(--gold)", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Experimente sem riscos!</div>
                <p style={{ color: "var(--cream-sub)", fontSize: "12px", lineHeight: "1.65", margin: 0 }}>
                  Confiamos tanto na qualidade deste material que oferecemos garantia total por 7 dias. Se por qualquer motivo a Bíblia 360° não superar suas expectativas, basta nos contatar e devolveremos 100% do seu investimento. A sua satisfação e intimidade com Deus são a nossa prioridade.
                </p>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setCheckoutPlan("advanced");
                setScreen("checkout");
              }}
              style={{ cursor: "pointer" }}
            >
              Quero Começar Agora
            </button>
            <div className="privacy" style={{ marginTop: "10px" }}>
              🔒 Compra 100% segura · Acesso imediato após o pagamento
            </div>

            {/* FAQ */}
            <div style={{ marginTop: "2rem" }}>
              <div style={{ color: "var(--cream)", fontSize: "15px", fontWeight: 600, fontFamily: "'Playfair Display', serif", marginBottom: "12px", textAlign: "center" }}>Perguntas Frequentes</div>
              <FaqAccordion items={[
                { q: "Como receberei o material?", a: "O acesso ao aplicativo estará disponível na plataforma PerfectPay assim que o pagamento for confirmado. Enviaremos automaticamente para o seu e-mail um link de acesso à plataforma." },
                { q: "Esta é uma compra única ou será cobrada mensalmente?", a: "Esta é uma compra única. Independente do plano que escolher, você não será cobrado novamente, nem inscrito em qualquer tipo de programa de cobrança automática." },
                { q: "Por quanto tempo terei acesso?", a: "Logo após a compra, poderá acessar o aplicativo que contém todo o conteúdo e você pode acessá-lo por um período de um ano." },
                { q: "Em qual dispositivo posso ver os mapas?", a: "Você pode acessar o aplicativo com todo o conteúdo da Bíblia 360° em qualquer dispositivo, seja celular, tablet ou computador." },
                { q: "Receberei o material em casa?", a: "Não, o material é 100% online — não há material físico. No entanto, todo o conteúdo está disponível a qualquer momento." },
              ]} />
              <button className="btn-primary" onClick={() => {
                setCheckoutPlan("advanced");
                setScreen("checkout");
              }} style={{ marginTop: "1.25rem", cursor: "pointer" }}>
                Quero Começar Agora
              </button>
            </div>
          </div>
        )}

        {/* Checkout */}
        {screen === "checkout" && checkoutPlan && resultProfile && (
          <div>
            <div className="capture-title">Confirmação do Plano</div>

            <div style={{ background: "linear-gradient(135deg, #1f1408 0%, #2a1c0a 100%)", border: "2px solid var(--gold)", borderRadius: "16px", padding: "24px 16px", marginBottom: "1.5rem" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ color: "var(--cream)", fontSize: "18px", fontWeight: 600, fontFamily: "'Playfair Display', serif", marginBottom: "8px" }}>
                  {checkoutPlan === "basic" ? "Plano Básico" : "Plano Avançado"}
                </div>
                <div style={{ color: "var(--cream-sub)", fontSize: "13px", marginBottom: "12px" }}>Bíblia 360° - Acesso anual</div>
                <div style={{ color: "var(--gold)", fontSize: "32px", fontWeight: 700, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
                  {checkoutPlan === "basic"
                    ? "R$ 19,90"
                    : advancedWithDiscount
                    ? "R$ 27,90"
                    : "R$ 39,90"}
                </div>
                {checkoutPlan === "advanced" && advancedWithDiscount && (
                  <div style={{ color: "rgba(245,232,200,0.5)", fontSize: "11px", marginTop: "6px" }}>
                    De R$ 39,90 com desconto exclusivo
                  </div>
                )}
              </div>

              <div style={{ borderTop: "0.5px solid rgba(212,168,80,0.15)", paddingTop: "16px" }}>
                <div style={{ color: "var(--cream-sub)", fontSize: "12px", marginBottom: "8px", fontWeight: 500 }}>Você receberá:</div>
                <div style={{ color: "var(--cream-sub)", fontSize: "11px", lineHeight: "1.6" }}>
                  {checkoutPlan === "basic" ? (
                    <>
                      <div style={{ marginBottom: "6px" }}>✦ 39 Mapas mentais (Antigo Testamento)</div>
                      <div>✦ 27 Mapas mentais (Novo Testamento)</div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: "6px" }}>✦ 39 Mapas mentais (AT)</div>
                      <div style={{ marginBottom: "6px" }}>✦ 27 Mapas mentais (NT)</div>
                      <div style={{ marginBottom: "6px" }}>✦ 39 Resumos (AT)</div>
                      <div style={{ marginBottom: "6px" }}>✦ 27 Resumos (NT)</div>
                      <div style={{ marginBottom: "6px" }}>✦ Guia de Orações</div>
                      <div style={{ marginBottom: "6px" }}>✦ Emoções da Bíblia</div>
                      <div style={{ marginBottom: "6px" }}>✦ Divisão Bíblica</div>
                      <div style={{ marginBottom: "6px" }}>✦ Tabela Periódica</div>
                      <div style={{ marginBottom: "6px" }}>✦ Planner Devocional</div>
                      <div style={{ marginBottom: "6px" }}>✦ Guia da Fé</div>
                      <div>✦ Marcadores Bíblicos</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(212,168,80,0.06)", border: "0.5px solid rgba(212,168,80,0.25)", borderRadius: "14px", padding: "16px", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <img src="/biblia360-garantia.png" alt="Garantia 7 dias" style={{ width: 56, height: 56, minWidth: 56, objectFit: "contain" }} />
              <div>
                <div style={{ color: "var(--gold)", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Garantia de 7 dias</div>
                <p style={{ color: "var(--cream-sub)", fontSize: "11px", lineHeight: "1.6", margin: 0 }}>
                  Se não for exatamente o que você esperava, devolvemos 100% do seu dinheiro, sem perguntas.
                </p>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                const url = checkoutPlan === "basic"
                  ? "https://go.perfectpay.com.br/PPU38CQBJHG"
                  : "https://go.perfectpay.com.br/PPU38CQBJHE";
                track(project.slug, "cta_click", { profileName: checkoutPlan ?? "", ctaUrl: url });
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              style={{ cursor: "pointer", marginBottom: "12px" }}
            >
              ✓ Finalizar Compra
            </button>

            <button
              onClick={() => {
                setScreen("offer");
                setCheckoutPlan(null);
              }}
              style={{
                width: "100%",
                background: "transparent",
                color: "var(--cream-sub)",
                border: "1px solid rgba(212,168,80,0.3)",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gold)";
                e.currentTarget.style.color = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,168,80,0.3)";
                e.currentTarget.style.color = "var(--cream-sub)";
              }}
            >
              ← Quero Começar Agora
            </button>
          </div>
        )}

        {/* Result */}
        {screen === "result" && resultProfile && (
          <div>
            <div className="result-badge">{resultProfile.badge}</div>
            <div className="result-headline">{resultProfile.headline}</div>

            {/* Imagem do resultado */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem", padding: "0 16px" }}>
              <img
                key={`result-${resultProfile.id}`}
                src={
                  resultProfile.name === "O Líder Omitido"
                    ? "/quiz-resultado-lider.jpg"
                    : resultProfile.name === "O Soldado Desarmado"
                    ? "/quiz-resultado-soldado.jpg"
                    : "/quiz-resultado-superficial.jpg"
                }
                alt={resultProfile.name}
                loading="eager"
                style={{
                  maxWidth: "100%",
                  width: "auto",
                  maxHeight: "280px",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "12px",
                  display: "block",
                }}
              />
            </div>

            <div className="score-display">
              <div className="score-circle">{totalScore}</div>
              <div className="score-info">
                <div className="s-label">Seu perfil bíblico</div>
                <div className="s-perfil">{resultProfile.name}</div>
              </div>
            </div>
            <div className="result-blocks">
              {resultProfile.blocks.map((b) => (
                <div key={b.id} className="result-block">
                  <p dangerouslySetInnerHTML={{ __html: b.content }} />
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setScreen("testimonials")}>
              Continuar
            </button>
            <button className="btn-secondary" onClick={restart}>
              Refazer o quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
