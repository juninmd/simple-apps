document.addEventListener('DOMContentLoaded', () => {
  const categoryFiltersContainer = document.getElementById('category-filters');
  const searchInput = document.getElementById('search-input');
  const entriesGrid = document.getElementById('entries-grid');
  const currentCategoryHeading = document.getElementById('current-category-heading');
  const resultsCountBadge = document.getElementById('results-count');

  let activeCategory = 'All';
  let searchQuery = '';

  // Fetch and display themed categories
  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const categories = await response.json();

      categories.forEach((cat) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = cat;
        btn.textContent = cat;
        categoryFiltersContainer.appendChild(btn);
      });
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  // Fetch and display entries filtered by current active category and search term
  async function loadEntries() {
    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'All') {
        params.append('category', activeCategory);
      }
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const response = await fetch(`/api/entries?${params.toString()}`);
      const entries = await response.json();

      renderEntries(entries);
    } catch (err) {
      console.error('Failed to load entries:', err);
      entriesGrid.innerHTML = '<p class="no-results">Failed to load content. Please try again.</p>';
    }
  }

  function renderEntries(entries) {
    entriesGrid.innerHTML = '';

    currentCategoryHeading.textContent =
      activeCategory === 'All' ? 'All Entries' : `Theme: ${activeCategory}`;
    resultsCountBadge.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;

    if (entries.length === 0) {
      entriesGrid.innerHTML = '<p class="no-results">No cultural entries found matching your search.</p>';
      return;
    }

    entries.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'entry-card';

      card.innerHTML = `
        <span class="card-tag tag-${entry.category}">${entry.category}</span>
        <h3 class="card-title">${escapeHTML(entry.title)}</h3>
        <p class="card-summary">${escapeHTML(entry.summary)}</p>
        <p class="card-description">${escapeHTML(entry.description)}</p>
      `;

      entriesGrid.appendChild(card);
    });
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Handle category button click
  categoryFiltersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      const allBtns = categoryFiltersContainer.querySelectorAll('.filter-btn');
      allBtns.forEach((btn) => btn.classList.remove('active'));

      e.target.classList.add('active');
      activeCategory = e.target.dataset.category;
      loadEntries();
    }
  });

  // Handle search input
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadEntries();
    }, 200);
  });

  // Initialize
  loadCategories();
  loadEntries();
});
