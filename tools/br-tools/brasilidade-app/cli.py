import argparse
import sys
import database

def format_fact(fact):
    title = fact.get("title", "")
    category = fact.get("category", "")
    content = fact.get("content", "")
    contributor = fact.get("contributor_name", "Anônimo")
    source = fact.get("source", "")

    output = []
    output.append(f"📌 [{category.upper()}] {title}")
    output.append("-" * (len(title) + len(category) + 5))
    output.append(content)
    output.append(f"👤 Contribuição: {contributor}")
    if source:
        output.append(f"📖 Fonte: {source}")
    output.append("")
    return "\n".join(output)

def list_cmd(args):
    database.init_db()
    facts = database.get_facts(category=args.category)
    if not facts:
        print("Nenhum fato encontrado.")
        return
    print(f"\n--- Fatos da Enciclopédia ({len(facts)}) ---\n")
    for fact in facts:
        print(format_fact(fact))

def search_cmd(args):
    database.init_db()
    facts = database.get_facts(search_query=args.query)
    if not facts:
        print(f"Nenhum fato encontrado para '{args.query}'.")
        return
    print(f"\n--- Resultados para '{args.query}' ({len(facts)}) ---\n")
    for fact in facts:
        print(format_fact(fact))

def categories_cmd(args):
    database.init_db()
    cats = database.get_categories()
    print("\n--- Categorias Disponíveis ---")
    for c in cats:
        print(f"• {c}")
    print()

def add_cmd(args):
    database.init_db()
    if args.title and args.category and args.content:
        title = args.title
        category = args.category
        content = args.content
        contributor = args.contributor or "Anônimo"
        source = args.source or ""
    else:
        print("\n--- Contribuir com novo fato ---")
        title = input("Título do Fato: ").strip()
        while not title or len(title) < 3:
            print("O título deve ter pelo menos 3 caracteres.")
            title = input("Título do Fato: ").strip()

        category = input("Categoria: ").strip()
        while not category:
            print("A categoria é obrigatória.")
            category = input("Categoria: ").strip()

        content = input("Descrição / Conteúdo: ").strip()
        while not content or len(content) < 10:
            print("O conteúdo deve ter pelo menos 10 caracteres.")
            content = input("Descrição / Conteúdo: ").strip()

        contributor = input("Seu Nome/Apelido (opcional, Enter para Anônimo): ").strip()
        source = input("Fonte (opcional): ").strip()

    fact_id = database.add_fact(
        title=title,
        category=category,
        content=content,
        contributor_name=contributor,
        source=source
    )
    print(f"\n✅ Fato '{title}' adicionado com sucesso! (ID: {fact_id})\n")

def main():
    parser = argparse.ArgumentParser(description="Brasilidade - Enciclopédia de Cultura Brasileira CLI")
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponíveis")

    # List command
    list_parser = subparsers.add_parser("list", help="Listar fatos")
    list_parser.add_argument("--category", "-c", help="Filtrar por categoria")

    # Search command
    search_parser = subparsers.add_parser("search", help="Pesquisar fatos")
    search_parser.add_argument("query", help="Termo de pesquisa")

    # Categories command
    subparsers.add_parser("categories", help="Listar categorias")

    # Add / Contribute command
    add_parser = subparsers.add_parser("add", help="Adicionar novo fato")
    add_parser.add_argument("--title", "-t", help="Título do fato")
    add_parser.add_argument("--category", "-c", help="Categoria")
    add_parser.add_argument("--content", "-m", help="Conteúdo/Descrição")
    add_parser.add_argument("--contributor", help="Nome do contribuidor")
    add_parser.add_argument("--source", help="Fonte/Referência")

    args = parser.parse_args()

    if args.command == "list":
        list_cmd(args)
    elif args.command == "search":
        search_cmd(args)
    elif args.command == "categories":
        categories_cmd(args)
    elif args.command == "add":
        add_cmd(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
