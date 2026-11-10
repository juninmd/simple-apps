let currentPage = 1;
const limit = 5;

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
}

async function fetchConfig() {
  const res = await fetch('/api/config');
  const config = await res.json();
  const container = document.getElementById('config-content');
  if (!container) return;

  const env = escapeHtml(config.environment);
  const repo = escapeHtml(config.monitoredRepository);
  const autoReleaseBadge = config.autoReleaseEnabled ? 'badge-success' : 'badge-warning';
  const autoReleaseText = config.autoReleaseEnabled ? 'ENABLED' : 'DISABLED';
  const npmBadge = config.npmPublishingConfigured ? 'badge-success' : 'badge-danger';
  const npmText = config.npmPublishingConfigured ? 'READY' : 'NOT CONFIGURED';
  const pypiBadge = config.pypiPublishingConfigured ? 'badge-success' : 'badge-danger';
  const pypiText = config.pypiPublishingConfigured ? 'READY' : 'NOT CONFIGURED';

  container.innerHTML = `
    <div class="stat-box">
      <label>Environment</label>
      <span>${env}</span>
    </div>
    <div class="stat-box">
      <label>Auto-Release</label>
      <span class="badge ${autoReleaseBadge}">
        ${autoReleaseText}
      </span>
    </div>
    <div class="stat-box">
      <label>NPM Publishing</label>
      <span class="badge ${npmBadge}">
        ${npmText}
      </span>
    </div>
    <div class="stat-box">
      <label>PyPI Publishing</label>
      <span class="badge ${pypiBadge}">
        ${pypiText}
      </span>
    </div>
    <div class="stat-box">
      <label>Repository</label>
      <span>${repo}</span>
    </div>
  `;
}

async function fetchPending() {
  const res = await fetch('/api/pending');
  const pending = await res.json();
  const container = document.getElementById('pending-content');
  if (!container) return;

  if (!Array.isArray(pending) || pending.length === 0) {
    container.innerHTML = '<p>No pending releases currently queued.</p>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Version</th>
          <th>Tag</th>
          <th>Target Branch</th>
          <th>Changes</th>
          <th>Scheduled At</th>
        </tr>
      </thead>
      <tbody>
  `;

  pending.forEach(item => {
    const version = escapeHtml(item.version);
    const tag = escapeHtml(item.tag);
    const targetBranch = escapeHtml(item.targetBranch);
    const changesCount = Number(item.changesCount);
    const scheduledAt = formatDate(item.scheduledAt);

    html += `
      <tr>
        <td><strong>${version}</strong></td>
        <td><code>${tag}</code></td>
        <td>${targetBranch}</td>
        <td>${changesCount} commits</td>
        <td>${scheduledAt}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

async function fetchHistory(page = 1) {
  currentPage = page;
  const res = await fetch(`/api/history?page=${page}&limit=${limit}`);
  const result = await res.json();
  const container = document.getElementById('history-content');
  if (!container) return;

  if (!result || !Array.isArray(result.data) || result.data.length === 0) {
    container.innerHTML = '<p>No release history available.</p>';
    const controls = document.getElementById('pagination-controls');
    if (controls) controls.innerHTML = '';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Version</th>
          <th>Status</th>
          <th>Released At</th>
          <th>Targets</th>
          <th>Summary</th>
        </tr>
      </thead>
      <tbody>
  `;

  result.data.forEach(item => {
    const badgeClass = item.status === 'SUCCESS' ? 'badge-success' : 'badge-danger';
    const statusText = escapeHtml(item.status);
    const version = escapeHtml(item.version);
    const releasedAt = formatDate(item.releasedAt);
    const publishedTargets = Array.isArray(item.publishedTargets)
      ? item.publishedTargets.map(escapeHtml).join(', ')
      : escapeHtml(item.publishedTargets);
    const summary = escapeHtml(item.changelogSummary);

    html += `
      <tr>
        <td><strong>${version}</strong></td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>${releasedAt}</td>
        <td>${publishedTargets}</td>
        <td>${summary}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  renderPagination(result.page, result.totalPages);
}

function renderPagination(page, totalPages) {
  const controls = document.getElementById('pagination-controls');
  if (!controls) return;
  controls.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  if (page <= 1) {
    prevBtn.disabled = true;
  } else {
    prevBtn.setAttribute('data-page', String(page - 1));
  }
  controls.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = String(i);
    if (i === page) {
      btn.classList.add('active');
    }
    btn.setAttribute('data-page', String(i));
    controls.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  if (page >= totalPages) {
    nextBtn.disabled = true;
  } else {
    nextBtn.setAttribute('data-page', String(page + 1));
  }
  controls.appendChild(nextBtn);
}

document.addEventListener('DOMContentLoaded', () => {
  const paginationControls = document.getElementById('pagination-controls');
  if (paginationControls) {
    paginationControls.addEventListener('click', (event) => {
      const target = event.target;
      if (target && target.tagName === 'BUTTON' && !target.disabled) {
        const pageAttr = target.getAttribute('data-page');
        if (pageAttr) {
          fetchHistory(Number(pageAttr));
        }
      }
    });
  }

  fetchConfig();
  fetchPending();
  fetchHistory();
});
