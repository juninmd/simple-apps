let quizState = {
  questions: [],
  currentIndex: 0,
  userAnswers: []
};

document.addEventListener("DOMContentLoaded", () => {
  loadEncyclopedia();
  loadQuizCategories();
});

function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));

  if (tabName === "encyclopedia") {
    document.getElementById("encyclopedia-section").classList.add("active");
    document.getElementById("nav-encyclopedia").classList.add("active");
  } else if (tabName === "quiz") {
    document.getElementById("quiz-section").classList.add("active");
    document.getElementById("nav-quiz").classList.add("active");
  }
}

async function loadEncyclopedia(query = "") {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    renderEncyclopediaCards(data.results);
  } catch (err) {
    console.error("Erro ao carregar a enciclopédia:", err);
  }
}

function handleSearchKey(event) {
  if (event.key === "Enter") {
    performSearch();
  }
}

function performSearch() {
  const query = document.getElementById("search-input").value.trim();
  loadEncyclopedia(query);
}

function renderEncyclopediaCards(items) {
  const container = document.getElementById("encyclopedia-results");
  if (!items || items.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum verbete encontrado.</div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="card">
      <span class="card-category">${item.category}</span>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-description">${item.description}</p>
      <div class="tags">
        ${item.tags.map(t => `<span class="tag">#${t}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

async function loadQuizCategories() {
  try {
    const res = await fetch("/api/quiz/categories");
    const data = await res.json();
    const select = document.getElementById("quiz-category-select");
    select.innerHTML = `<option value="">Todas as Categorias</option>` +
      data.categories.map(c => `<option value="${c}">${c}</option>`).join("");
  } catch (err) {
    console.error("Erro ao carregar categorias do quiz:", err);
  }
}

async function startQuiz() {
  const category = document.getElementById("quiz-category-select").value;
  const limit = document.getElementById("quiz-limit-select").value;

  let url = `/api/quiz?limit=${limit}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    quizState.questions = data.questions;
    quizState.currentIndex = 0;
    quizState.userAnswers = [];

    document.getElementById("quiz-setup-card").classList.add("hidden");
    document.getElementById("quiz-results-card").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");

    renderQuestion();
  } catch (err) {
    console.error("Erro ao iniciar o quiz:", err);
  }
}

function renderQuestion() {
  const q = quizState.questions[quizState.currentIndex];
  const total = quizState.questions.length;

  document.getElementById("progress-indicator").style.width = `${((quizState.currentIndex) / total) * 100}%`;
  document.getElementById("quiz-question-counter").innerText = `Pergunta ${quizState.currentIndex + 1} de ${total}`;
  document.getElementById("quiz-category-badge").innerText = q.category;
  document.getElementById("quiz-question-text").innerText = q.question;

  document.getElementById("quiz-explanation-box").classList.add("hidden");
  document.getElementById("next-btn").classList.add("hidden");

  const optionsContainer = document.getElementById("quiz-options-container");
  optionsContainer.innerHTML = q.options.map((opt, idx) => `
    <button class="option-btn" onclick="selectOption(${idx})">${idx + 1}) ${opt}</button>
  `).join("");
}

function selectOption(selectedIndex) {
  const q = quizState.questions[quizState.currentIndex];
  quizState.userAnswers.push({
    question_id: q.id,
    selected_index: selectedIndex
  });

  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === selectedIndex) {
      btn.classList.add("selected");
    }
  });

  document.getElementById("next-btn").classList.remove("hidden");
}

function nextQuestion() {
  quizState.currentIndex++;
  if (quizState.currentIndex < quizState.questions.length) {
    renderQuestion();
  } else {
    submitQuiz();
  }
}

async function submitQuiz() {
  try {
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: quizState.userAnswers })
    });
    const result = await res.json();

    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("quiz-results-card").classList.remove("hidden");

    document.getElementById("final-score-badge").innerText = `${result.score_percentage}%`;
    document.getElementById("final-score-message").innerText =
      `Você acertou ${result.correct_answers} de ${result.total}!`;

    const detailsContainer = document.getElementById("results-details-container");
    detailsContainer.innerHTML = result.details.map((item, idx) => `
      <div class="result-item ${item.is_correct ? 'correct' : 'incorrect'}">
        <strong>${idx + 1}. ${item.question}</strong>
        <p style="margin-top: 0.4rem; font-size: 0.95rem;">
          ${item.is_correct ? '✅ Sua resposta está correta!' : `❌ Resposta incorreta.`}
        </p>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.3rem;">
          💡 <em>${item.explanation}</em>
        </p>
      </div>
    `).join("");
  } catch (err) {
    console.error("Erro ao enviar o quiz:", err);
  }
}

function resetQuiz() {
  document.getElementById("quiz-results-card").classList.add("hidden");
  document.getElementById("quiz-container").classList.add("hidden");
  document.getElementById("quiz-setup-card").classList.remove("hidden");
}
