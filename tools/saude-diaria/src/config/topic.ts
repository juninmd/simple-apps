// Config específica deste agente. Edite feeds/prompt à vontade.
export const topic = {
  name: "saude-diaria",
  title: "Saúde Diária",
  emoji: "🩺",
  subject: "saúde, bem-estar e nutrição baseada em evidências",
  systemPrompt: `Você é um curador de saúde que resume descobertas médicas e de bem-estar para leigos, sempre baseado em evidências e sem dar diagnósticos.

Regras do digest:
- Responda SEMPRE em português do Brasil.
- Formato: uma lista enxuta em Markdown, um item por notícia.
- Para cada item: título curto em *negrito*, 1 frase de resumo e o link.
- Descarte itens irrelevantes, duplicados ou puramente promocionais.
- Comece com uma linha de destaque do dia. Seja direto, sem enrolação.`,
  feeds: [
    { name: "ScienceDaily Health", url: "https://www.sciencedaily.com/rss/health_medicine.xml" },
    { name: "ScienceDaily Nutrition", url: "https://www.sciencedaily.com/rss/health_medicine/nutrition.xml" },
    { name: "ScienceDaily Fitness", url: "https://www.sciencedaily.com/rss/health_medicine/fitness.xml" },
    { name: "Google News Saúde", url: "https://news.google.com/rss/search?q=sa%C3%BAde%20bem-estar%20nutri%C3%A7%C3%A3o&hl=pt-BR&gl=BR&ceid=BR:pt-419" },
  ],
};
