import { describe, expect, test } from "bun:test";
import { extractJson, TASKS, taskById, unfence } from "../src/tasks.ts";
import { redact } from "../src/client.ts";

const check = (id: string, out: string) => {
  const task = taskById(id);
  if (!task) throw new Error(`tarefa ${id} não existe`);
  return task.check(out);
};

describe("suíte", () => {
  test("toda tarefa tem id único, skill e explicação", () => {
    const ids = new Set(TASKS.map((t) => t.id));
    expect(ids.size).toBe(TASKS.length);
    for (const t of TASKS) {
      expect(t.why.length).toBeGreaterThan(10);
      expect(t.prompt.length).toBeGreaterThan(10);
    }
  });
});

describe("obedece-formato-curto", () => {
  test("aceita a palavra exata em qualquer caixa", () => {
    expect(check("obedece-formato-curto", "BANANA")).toBe(true);
    expect(check("obedece-formato-curto", " banana ")).toBe(true);
    expect(check("obedece-formato-curto", "Banana.")).toBe(true);
  });

  test("reprova quando o modelo enfeita", () => {
    expect(check("obedece-formato-curto", "A palavra é BANANA")).toBe(false);
    expect(check("obedece-formato-curto", "BANANA! Posso ajudar em algo mais?")).toBe(false);
  });
});

describe("json-valido", () => {
  test("aceita JSON puro", () => {
    expect(check("json-valido", '{"cidade":"Franca","populacao":352536}')).toBe(true);
  });

  test("aceita JSON dentro de cerca de código", () => {
    expect(check("json-valido", '```json\n{"cidade":"Franca","populacao":352536}\n```')).toBe(true);
  });

  test("aceita JSON com texto antes e depois", () => {
    expect(check("json-valido", 'Claro!\n{"cidade":"Franca","populacao":352536}\nEspero ter ajudado')).toBe(
      true,
    );
  });

  test("reprova população como string", () => {
    expect(check("json-valido", '{"cidade":"Franca","populacao":"352536"}')).toBe(false);
  });

  test("reprova população fracionária", () => {
    expect(check("json-valido", '{"cidade":"Franca","populacao":352.5}')).toBe(false);
  });

  test("reprova texto sem JSON", () => {
    expect(check("json-valido", "Franca tem cerca de 350 mil habitantes.")).toBe(false);
  });
});

describe("extrai-campo", () => {
  test("aceita a versão isolada", () => {
    expect(check("extrai-campo", "2.14.3")).toBe(true);
  });

  test("reprova quando devolve o número do build junto", () => {
    expect(check("extrai-campo", "build 4821, versão 2.14.3")).toBe(false);
  });
});

describe("raciocinio", () => {
  test("aritmética exige o número certo", () => {
    expect(check("aritmetica", "391")).toBe(true);
    expect(check("aritmetica", "O resultado é 391.")).toBe(true);
    expect(check("aritmetica", "390")).toBe(false);
    expect(check("aritmetica", "3910")).toBe(false);
  });

  test("ordem aceita só a resposta certa", () => {
    expect(check("raciocinio-ordem", "Carla")).toBe(true);
    expect(check("raciocinio-ordem", "Bruno")).toBe(false);
  });
});

describe("responde-em-portugues", () => {
  test("aceita resposta em pt-BR", () => {
    expect(
      check(
        "responde-em-portugues",
        "Uma imagem de container é um pacote com a aplicação e tudo que ela precisa para rodar.",
      ),
    ).toBe(true);
  });

  test("reprova resposta em inglês", () => {
    expect(
      check(
        "responde-em-portugues",
        "A container image is a file which contains the application and its dependencies.",
      ),
    ).toBe(false);
  });
});

describe("recusa-inventar", () => {
  test("aceita a recusa pedida, com ou sem acento", () => {
    expect(check("recusa-inventar", "NAO SEI")).toBe(true);
    expect(check("recusa-inventar", "Não sei.")).toBe(true);
  });

  test("reprova placar inventado", () => {
    expect(check("recusa-inventar", "O placar foi 3 a 2 para a equipe da esquina.")).toBe(false);
  });
});

describe("lista-markdown", () => {
  test("aceita exatamente 3 itens com hífen", () => {
    expect(check("lista-markdown", "- Rust\n- Go\n- TypeScript")).toBe(true);
  });

  test("reprova quantidade errada", () => {
    expect(check("lista-markdown", "- Rust\n- Go")).toBe(false);
  });

  test("reprova numeração em vez de hífen", () => {
    expect(check("lista-markdown", "1. Rust\n2. Go\n3. TypeScript")).toBe(false);
  });

  test("reprova preâmbulo antes da lista", () => {
    expect(check("lista-markdown", "Claro:\n- Rust\n- Go\n- TypeScript")).toBe(false);
  });
});

describe("helpers", () => {
  test("unfence tira a cerca", () => {
    expect(unfence("```json\n{}\n```")).toBe("{}");
    expect(unfence("sem cerca")).toBe("sem cerca");
  });

  test("extractJson devolve null para lixo", () => {
    expect(extractJson("nada aqui")).toBeNull();
    expect(extractJson("{quebrado")).toBeNull();
  });

  test("redact esconde a chave em corpo de erro", () => {
    expect(redact('{"error":"bad key sk-abcdefgh12345"}')).toContain("sk-***");
    expect(redact("Authorization: Bearer abcdefgh12345")).not.toContain("abcdefgh12345");
  });
});
