import os
import pytest
import database

@pytest.fixture
def test_db(tmp_path):
    db_file = os.path.join(tmp_path, "test_brasilidade.db")
    database.init_db(db_file)
    return db_file

def test_init_db_seeds_data(test_db):
    facts = database.get_facts(db_path=test_db)
    assert len(facts) >= 6
    titles = [f["title"] for f in facts]
    assert "Saudade" in titles
    assert "Festa Junina" in titles

def test_add_fact(test_db):
    fact_id = database.add_fact(
        title="Maracatu",
        category="Cultura & Música",
        content="O maracatu é um ritmo musical, dança e ritual de tradição afro-brasileira típico de Pernambuco.",
        contributor_name="Maria Pernambucana",
        source="Cultura Popular PE",
        db_path=test_db
    )
    assert fact_id is not None
    fact = database.get_fact_by_id(fact_id, db_path=test_db)
    assert fact["title"] == "Maracatu"
    assert fact["category"] == "Cultura & Música"
    assert fact["contributor_name"] == "Maria Pernambucana"
    assert fact["source"] == "Cultura Popular PE"

def test_get_facts_filter_by_category(test_db):
    database.add_fact("Choro", "Música", "O choro é um gênero de música popular e instrumental brasileira.", db_path=test_db)
    musica_facts = database.get_facts(category="Música", db_path=test_db)
    for f in musica_facts:
        assert f["category"] == "Música"

def test_get_facts_search(test_db):
    database.add_fact("Açaí", "Gastronomia", "O açaí é um fruto típico da região amazônica e patrimônio gastronômico.", db_path=test_db)
    search_results = database.get_facts(search_query="amazônica", db_path=test_db)
    assert len(search_results) >= 1
    assert any(f["title"] == "Açaí" for f in search_results)

def test_get_categories(test_db):
    cats = database.get_categories(db_path=test_db)
    assert isinstance(cats, list)
    assert "Gastronomia" in cats
    assert "História" in cats
