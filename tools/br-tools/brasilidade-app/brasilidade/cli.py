"""
CLI module for Brasilidade.
Provides CLI entrypoint for interactive multiple-choice quiz mode and encyclopedia lookup.
"""

import argparse
import sys
from typing import List, Optional

from .data import ENCYCLOPEDIA_DATA
from .quiz import QuizEngine


def run_quiz(category: Optional[str] = None, limit: Optional[int] = None, shuffle: bool = True) -> None:
    engine = QuizEngine()
    try:
        session = engine.create_session(category=category, limit=limit, shuffle=shuffle)
    except ValueError as e:
        print(f"\n❌ Erro: {e}")
        print("\nCategorias disponíveis:")
        for cat in engine.get_categories():
            print(f"  - {cat}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("🇧🇷  BRASILIDADE - QUIZ DE CULTURA BRASILEIRA  🇧🇷")
    print("=" * 60)
    if category:
        print(f"Categoria selecionada: {category}")
    print(f"Total de perguntas: {len(session.questions)}\n")

    for idx, question in enumerate(session.questions, 1):
        print(f"\n[Pergunta {idx}/{len(session.questions)}] [{question.category}]")
        print(f"❓ {question.question}\n")

        for option_idx, option_text in enumerate(question.options, 1):
            print(f"  {option_idx}) {option_text}")

        user_choice = None
        while user_choice is None:
            try:
                raw_input = input("\nSua resposta (1-4, ou 'q' para sair): ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\nQuiz cancelado.")
                return
            if raw_input.lower() == 'q':
                print("\nQuiz encerrado pelo usuário.")
                return
            if raw_input.isdigit() and 1 <= int(raw_input) <= len(question.options):
                user_choice = int(raw_input) - 1
            else:
                print(f"Por favor, escolha um número entre 1 e {len(question.options)}.")

        result = session.answer_question(question.id, user_choice)
        if result["is_correct"]:
            print("✅ Correto!")
        else:
            correct_opt = question.options[result["correct_index"]]
            print(f"❌ Incorreto! A resposta certa era: ({result['correct_index'] + 1}) {correct_opt}")

        print(f"💡 Explicação: {result['explanation']}")
        print("-" * 60)

    summary = session.get_results()
    print("\n" + "=" * 60)
    print("🎉 RESULTADO FINAL DO QUIZ 🎉")
    print("=" * 60)
    print(f"Acertos: {summary['correct_answers']} de {summary['total_questions']}")
    print(f"Pontuação: {summary['score_percentage']}%\n")

    if summary['score_percentage'] == 100:
        print("🏆 Perfeito! Você é um verdadeiro mestre da brasilidade!")
    elif summary['score_percentage'] >= 70:
        print("👏 Muito bom! Seu conhecimento sobre a cultura brasileira é impressionante!")
    else:
        print("📚 Bom esforço! Continue explorando e aprendendo mais sobre o Brasil!")
    print("=" * 60 + "\n")


def run_search(query: str) -> None:
    query_lower = query.lower()
    matches = []

    for item in ENCYCLOPEDIA_DATA:
        if (
            query_lower in item["title"].lower()
            or query_lower in item["description"].lower()
            or query_lower in item["category"].lower()
            or any(query_lower in tag for tag in item.get("tags", []))
        ):
            matches.append(item)

    print("\n" + "=" * 60)
    print(f"🔍 Busca na Enciclopédia: '{query}'")
    print("=" * 60)

    if not matches:
        print("Nenhum termo encontrado.")
        return

    for item in matches:
        print(f"\n📖 [{item['category']}] {item['title']}")
        print(f"   {item['description']}")
        print(f"   Tags: {', '.join(item['tags'])}")
    print("-" * 60 + "\n")


def run_list() -> None:
    print("\n" + "=" * 60)
    print("📚 BRASILIDADE - ENCICLOPÉDIA DE CULTURA BRASILEIRA")
    print("=" * 60)
    for item in ENCYCLOPEDIA_DATA:
        print(f"\n• {item['title']} ({item['category']})")
        print(f"  {item['description']}")
    print("=" * 60 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Brasilidade - Enciclopédia e Quiz de Cultura e História Brasileira"
    )
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponíveis")

    # Quiz subcommand
    quiz_parser = subparsers.add_parser("quiz", help="Inicia o modo quiz com perguntas de múltipla escolha")
    quiz_parser.add_argument("-c", "--category", type=str, help="Filtrar por categoria de pergunta")
    quiz_parser.add_argument("-n", "--limit", type=int, help="Número máximo de perguntas")
    quiz_parser.add_argument("--no-shuffle", action="store_true", help="Não embaralhar a ordem das perguntas")

    # Search subcommand
    search_parser = subparsers.add_parser("search", help="Busca verbete na enciclopédia")
    search_parser.add_argument("query", type=str, help="Termo ou palavra-chave para buscar")

    # List subcommand
    subparsers.add_parser("list", help="Lista todos os verbetes da enciclopédia")

    args = parser.parse_args()

    if args.command == "quiz":
        run_quiz(category=args.category, limit=args.limit, shuffle=not args.no_shuffle)
    elif args.command == "search":
        run_search(args.query)
    elif args.command == "list":
        run_list()
    else:
        # Default behavior if no subcommand specified
        parser.print_help()


if __name__ == "__main__":
    main()
