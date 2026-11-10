import sqlite3
import os

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brasilidade.db")

SEED_FACTS = [
    {
        "title": "Saudade",
        "category": "Língua & Cultura",
        "content": "Uma palavra profundamente expressiva da língua portuguesa que descreve um sentimento nostálgico de falta de alguém, de algum lugar ou de algum momento especial.",
        "contributor_name": "Equipe Brasilidade",
        "source": "Dicionário Cultural",
        "status": "approved"
    },
    {
        "title": "Festa Junina",
        "category": "Tradições",
        "content": "Celebrada ao longo de todo o mês de junho, a Festa Junina homenageia São João com quadrilhas, fogueiras, comidas à base de milho e trajes caipiras.",
        "contributor_name": "Equipe Brasilidade",
        "source": "Tradições Populares",
        "status": "approved"
    },
    {
        "title": "Bossa Nova",
        "category": "Música",
        "content": "Gênero musical brasileiro surgido no final dos anos 1950 no Rio de Janeiro, derivado do samba e influenciado pelo jazz, imortalizado por Tom Jobim e João Gilberto.",
        "contributor_name": "Equipe Brasilidade",
        "source": "História da Música Brasileira",
        "status": "approved"
    },
    {
        "title": "Capoeira",
        "category": "Arte & Esporte",
        "content": "Expressão cultural afro-brasileira que mistura arte marcial, esporte, cultura popular, dança e música, declarada Patrimônio Imaterial da Humanidade pela UNESCO.",
        "contributor_name": "Equipe Brasilidade",
        "source": "Patrimônio Cultural UNESCO",
        "status": "approved"
    },
    {
        "title": "Santos Dumont",
        "category": "História",
        "content": "Alberto Santos-Dumont foi um inventor e pioneiro da aviação brasileiro. Em 1906, realizou em Paris o primeiro voo homologado de um avião mais pesado que o ar, o 14-bis.",
        "contributor_name": "Equipe Brasilidade",
        "source": "História do Brasil",
        "status": "approved"
    },
    {
        "title": "Feijoada",
        "category": "Gastronomia",
        "content": "Um dos pratos mais emblemáticos da culinária brasileira, consistindo em um guisado de feijão-preto com variados cortes de carne suína e bovina, acompanhado de couve, farofa e laranja.",
        "contributor_name": "Equipe Brasilidade",
        "source": "Culinária Brasileira",
        "status": "approved"
    }
]

def get_db_connection(db_path=None):
    if db_path is None:
        db_path = DEFAULT_DB_PATH
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS facts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            contributor_name TEXT DEFAULT 'Anônimo',
            source TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'approved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    cursor.execute("SELECT COUNT(*) as count FROM facts")
    count = cursor.fetchone()["count"]

    if count == 0:
        for fact in SEED_FACTS:
            cursor.execute("""
                INSERT INTO facts (title, category, content, contributor_name, source, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (fact["title"], fact["category"], fact["content"], fact["contributor_name"], fact["source"], fact["status"]))
        conn.commit()

    conn.close()

def get_facts(category=None, search_query=None, status="approved", db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    query = "SELECT * FROM facts WHERE 1=1"
    params = []

    if status:
        query += " AND status = ?"
        params.append(status)

    if category and category != "Todos":
        query += " AND category = ?"
        params.append(category)

    if search_query:
        query += " AND (title LIKE ? OR content LIKE ? OR category LIKE ? OR contributor_name LIKE ?)"
        term = f"%{search_query}%"
        params.extend([term, term, term, term])

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_fact_by_id(fact_id, db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM facts WHERE id = ?", (fact_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def add_fact(title, category, content, contributor_name="Anônimo", source="", status="approved", db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO facts (title, category, content, contributor_name, source, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        title.strip(),
        category.strip(),
        content.strip(),
        contributor_name.strip() if contributor_name and contributor_name.strip() else "Anônimo",
        source.strip() if source else "",
        status
    ))
    conn.commit()
    fact_id = cursor.lastrowid
    conn.close()
    return fact_id

def get_categories(db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM facts ORDER BY category ASC")
    rows = cursor.fetchall()
    conn.close()
    return [row["category"] for row in rows]
