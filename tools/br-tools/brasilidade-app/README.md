# brasilidade-app

A lightweight, beautiful command-line tool and local web app that serves as an encyclopedia of Brazilian culture, history, and trivia, equipped with an interactive **Quiz Mode** to test your knowledge!

---

## 🇧🇷 Features

- 📖 **Encyclopedia**: Explore entries on Brazilian culture, history, geography, cuisine, and arts.
- 🎯 **Quiz Mode**: Test your knowledge with multiple-choice questions across various categories.
- 💻 **CLI Interface**: Play quizzes and search entries directly in your terminal.
- 🌐 **Web Interface**: Modern, responsive web app featuring interactive quiz sessions with real-time feedback, progress tracking, and score summaries.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ (no external package dependencies required for base usage).

---

## 💻 CLI Usage

### 1. Interactive Quiz Mode
Run the quiz in your terminal:
```bash
python3 -m brasilidade.cli quiz
```

Filter by category or limit the number of questions:
```bash
# Filter by category
python3 -m brasilidade.cli quiz --category "Música"

# Limit to 5 questions
python3 -m brasilidade.cli quiz --limit 5
```

### 2. Search Encyclopedia
Search entries by title, tag, or description:
```bash
python3 -m brasilidade.cli search "saudade"
```

### 3. List All Entries
```bash
python3 -m brasilidade.cli list
```

---

## 🌐 Web Interface

Start the local web server:
```bash
python3 -m brasilidade.web
```
Open your browser at `http://localhost:8000` to access both the Encyclopedia search interface and the interactive **Modo Quiz**.

---

## 🧪 Running Tests

Execute the test suite using Python's `unittest`:
```bash
python3 -m unittest discover -s tests -p "test_*.py"
```

---

## 📄 License
MIT License
