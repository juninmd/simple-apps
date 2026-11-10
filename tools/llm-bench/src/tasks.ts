import type { Task } from "./types.ts";

/** minúsculas e sem acento: a checagem não pode reprovar por "ç" ou "é". */
const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Tira cerca de código para modelos que insistem em ```json ... ```. */
export function unfence(raw: string): string {
  const fenced = /```(?:json|javascript|js)?\s*([\s\S]*?)```/i.exec(raw);
  return (fenced?.[1] ?? raw).trim();
}

/** Primeiro objeto JSON válido do texto, ou null. */
export function extractJson(raw: string): unknown {
  const text = unfence(raw);
  try {
    return JSON.parse(text);
  } catch {
    /* tenta recortar o objeto */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Suíte fixa e determinística. Cada tarefa mede uma capacidade que decide
 * onde o modelo pode ser usado — não uma nota abstrata de "qualidade".
 */
export const TASKS: Task[] = [
  {
    id: "obedece-formato-curto",
    skill: "instrucao",
    system: "Siga a instrução literalmente. Não explique.",
    prompt: 'Responda exatamente com a palavra BANANA, sem pontuação e sem mais nada.',
    check: (out) => norm(out).replace(/[.!]/g, "") === "banana",
    why: "não obedece instrução literal — inútil para pipeline que espera saída fixa",
    maxTokens: 20,
  },
  {
    id: "json-valido",
    skill: "formato",
    system: "Responda apenas com JSON válido, sem texto ao redor.",
    prompt:
      'Devolva um JSON com as chaves "cidade" (string) e "populacao" (número inteiro) para Franca, São Paulo. Sem comentários.',
    check: (out) => {
      const json = extractJson(out) as { cidade?: unknown; populacao?: unknown } | null;
      return (
        !!json &&
        typeof json.cidade === "string" &&
        typeof json.populacao === "number" &&
        Number.isInteger(json.populacao)
      );
    },
    why: "não produz JSON parseável — quebra qualquer integração estruturada",
    maxTokens: 120,
  },
  {
    id: "extrai-campo",
    skill: "extracao",
    system: "Extraia o dado pedido. Responda só com o valor.",
    prompt:
      'Do texto a seguir, qual é o número da versão? Texto: "O deploy do build 4821 subiu a versão 2.14.3 na terça." Responda apenas o número da versão.',
    check: (out) => /2\.14\.3/.test(out) && !/4821/.test(out),
    why: "confunde números do contexto — ruim para parsing de log e changelog",
    maxTokens: 30,
  },
  {
    id: "aritmetica",
    skill: "raciocinio",
    system: "Responda apenas com o número final.",
    prompt: "Quanto é 17 multiplicado por 23? Responda só o número.",
    check: (out) => /\b391\b/.test(out),
    why: "erra conta de duas casas — não confie em nada quantitativo",
    maxTokens: 30,
  },
  {
    id: "raciocinio-ordem",
    skill: "raciocinio",
    system: "Responda apenas com o nome.",
    prompt:
      "Ana chegou depois de Bruno. Carla chegou antes de Bruno. Quem chegou primeiro? Responda só o nome.",
    check: (out) => norm(out).includes("carla") && !norm(out).includes("bruno chegou"),
    why: "erra ordenação simples — evite para classificação e triagem",
    maxTokens: 30,
  },
  {
    id: "responde-em-portugues",
    skill: "idioma",
    system: "Responda sempre em português do Brasil.",
    prompt: "Explain in one short sentence what a container image is.",
    check: (out) => {
      const t = norm(out);
      const pt = ["imagem", "container", "conteiner", "arquivo", "aplicacao", "pacote", "que"];
      const en = ["the ", "is a", "image is", "which", "contains"];
      const ptHits = pt.filter((w) => t.includes(w)).length;
      const enHits = en.filter((w) => t.includes(w)).length;
      return ptHits >= 2 && ptHits > enHits;
    },
    why: "ignora o idioma pedido — inútil para os bots pt-BR",
    maxTokens: 120,
  },
  {
    id: "recusa-inventar",
    skill: "instrucao",
    system: 'Se não souber, responda exatamente "NAO SEI". Nunca invente.',
    prompt:
      'Qual foi o placar exato da final do Campeonato Interno de Botão da Rua das Acácias em 1987? Se não souber, responda "NAO SEI".',
    check: (out) => norm(out).includes("nao sei"),
    why: "alucina em vez de admitir desconhecimento — perigoso em digest factual",
    maxTokens: 60,
  },
  {
    id: "lista-markdown",
    skill: "formato",
    system: "Siga o formato pedido exatamente.",
    prompt:
      "Liste exatamente 3 linguagens de programação, uma por linha, cada linha começando com '- '. Nada além da lista.",
    check: (out) => {
      const lines = out
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      return lines.length === 3 && lines.every((l) => l.startsWith("- "));
    },
    why: "não respeita formato de lista — quebra digest em Markdown",
    maxTokens: 80,
  },
];

export const taskById = (id: string) => TASKS.find((t) => t.id === id);
