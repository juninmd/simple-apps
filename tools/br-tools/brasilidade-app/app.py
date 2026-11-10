import os
import secrets
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import database

app = Flask(__name__)
# Sem default fixo no codigo: uma SECRET_KEY versionada permite forjar cookie de
# sessao. Em producao defina SECRET_KEY no ambiente; sem ela a chave e gerada a
# cada inicio (sessoes nao sobrevivem a restart nem valem entre workers).
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_hex(32)

# Initialize DB when app starts
with app.app_context():
    database.init_db()

@app.route("/")
def index():
    category = request.args.get("category", "").strip()
    query = request.args.get("q", "").strip()

    facts = database.get_facts(category=category, search_query=query)
    categories = database.get_categories()

    return render_template(
        "index.html",
        facts=facts,
        categories=categories,
        selected_category=category,
        query=query,
        active_page="home"
    )

@app.route("/contribute", methods=["GET", "POST"])
def contribute():
    categories = database.get_categories()

    if request.method == "POST":
        title = request.form.get("title", "").strip()
        category = request.form.get("category", "").strip()
        custom_category = request.form.get("custom_category", "").strip()
        content = request.form.get("content", "").strip()
        contributor_name = request.form.get("contributor_name", "").strip()
        source = request.form.get("source", "").strip()

        if category == "Outro" and custom_category:
            category = custom_category

        # Validation
        errors = []
        if not title:
            errors.append("O título do fato é obrigatório.")
        elif len(title) < 3:
            errors.append("O título deve ter pelo menos 3 caracteres.")

        if not category:
            errors.append("A categoria é obrigatória.")

        if not content:
            errors.append("A descrição do fato é obrigatória.")
        elif len(content) < 10:
            errors.append("A descrição do fato deve conter pelo menos 10 caracteres.")

        if errors:
            for error in errors:
                flash(error, "danger")
            return render_template(
                "contribute.html",
                categories=categories,
                form_data=request.form,
                active_page="contribute"
            )

        fact_id = database.add_fact(
            title=title,
            category=category,
            content=content,
            contributor_name=contributor_name if contributor_name else "Anônimo",
            source=source,
            status="approved"
        )

        flash(f"Obrigado! Seu fato '{title}' foi adicionado com sucesso à enciclopédia.", "success")
        return redirect(url_for("index"))

    return render_template(
        "contribute.html",
        categories=categories,
        form_data=None,
        active_page="contribute"
    )

@app.route("/api/facts", methods=["GET"])
def api_get_facts():
    category = request.args.get("category", "").strip()
    query = request.args.get("q", "").strip()
    status = request.args.get("status", "approved").strip()

    facts = database.get_facts(category=category, search_query=query, status=status)
    return jsonify({"success": True, "count": len(facts), "facts": facts})

@app.route("/api/facts", methods=["POST"])
def api_add_fact():
    data = request.get_json(silent=True) or request.form

    title = data.get("title", "").strip() if data else ""
    category = data.get("category", "").strip() if data else ""
    content = data.get("content", "").strip() if data else ""
    contributor_name = data.get("contributor_name", "").strip() if data else ""
    source = data.get("source", "").strip() if data else ""

    errors = []
    if not title or len(title) < 3:
        errors.append("Título é obrigatório e deve ter pelo menos 3 caracteres.")
    if not category:
        errors.append("Categoria é obrigatória.")
    if not content or len(content) < 10:
        errors.append("Conteúdo é obrigatório e deve ter pelo menos 10 caracteres.")

    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    fact_id = database.add_fact(
        title=title,
        category=category,
        content=content,
        contributor_name=contributor_name,
        source=source,
        status="approved"
    )

    fact = database.get_fact_by_id(fact_id)
    return jsonify({
        "success": True,
        "message": "Fato adicionado com sucesso!",
        "fact": fact
    }), 201

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
