import os
import pytest
import database
from app import app as flask_app

@pytest.fixture
def client(tmp_path):
    db_file = os.path.join(tmp_path, "test_app.db")
    database.init_db(db_file)

    flask_app.config["TESTING"] = True
    flask_app.config["SECRET_KEY"] = "test-secret"

    # Patch DEFAULT_DB_PATH during tests
    old_db_path = database.DEFAULT_DB_PATH
    database.DEFAULT_DB_PATH = db_file

    with flask_app.test_client() as client:
        yield client

    database.DEFAULT_DB_PATH = old_db_path

def test_home_page(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Brasilidade" in response.get_data(as_text=True)
    assert "Saudade" in response.get_data(as_text=True)

def test_contribute_page_get(client):
    response = client.get("/contribute")
    assert response.status_code == 200
    assert "Contribuir com um Fato Cultural" in response.get_data(as_text=True)

def test_contribute_form_post_success(client):
    response = client.post("/contribute", data={
        "title": "Samba de Roda",
        "category": "Música",
        "content": "O samba de roda é uma manifestação tradicional do Recôncavo Baiano.",
        "contributor_name": "João da Bahia",
        "source": "IPHAN"
    }, follow_redirects=True)

    assert response.status_code == 200
    page_text = response.get_data(as_text=True)
    assert "adicionado com sucesso" in page_text
    assert "Samba de Roda" in page_text

def test_contribute_form_post_validation_error(client):
    response = client.post("/contribute", data={
        "title": "Oi",
        "category": "",
        "content": "Curto"
    }, follow_redirects=False)

    assert response.status_code == 200
    page_text = response.get_data(as_text=True)
    assert "O título deve ter pelo menos 3 caracteres." in page_text
    assert "A categoria é obrigatória." in page_text
    assert "A descrição do fato deve conter pelo menos 10 caracteres." in page_text

def test_api_get_facts(client):
    response = client.get("/api/facts")
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["success"] is True
    assert len(json_data["facts"]) >= 6

def test_api_post_fact_success(client):
    response = client.post("/api/facts", json={
        "title": "Forró",
        "category": "Música",
        "content": "O forró é uma festa e gênero musical originário do Nordeste do Brasil.",
        "contributor_name": "Luiz",
        "source": "Cultura Nordestina"
    })
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data["success"] is True
    assert json_data["fact"]["title"] == "Forró"

def test_api_post_fact_validation_failure(client):
    response = client.post("/api/facts", json={
        "title": "x",
        "category": "",
        "content": "público"
    })
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data["success"] is False
    assert len(json_data["errors"]) >= 3
