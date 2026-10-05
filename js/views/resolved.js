// js/views/resolved.js - Resolved Issues Archive & Audit View
import { store, CATEGORIES } from '../store.js';
import { Icons, getCategoryIcon } from '../icons.js';
import { formatTimeAgo } from './dashboard.js';

let resolvedSearchQuery = '';
let resolvedCategoryFilter = 'ALL';

export function renderResolved(container, navigateTo, openIssueModal, openIssueDetails) {
  const issues = store.getIssues().filter(i => i.status === 'Resolved');

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div class="view-badge">
          ${Icons.resolved}
          <span>Completed Maintenance Archive</span>
        </div>
        <h1 class="view-title">Resolved Issues</h1>
        <p class="view-subtitle">Audit log of successfully remediated campus facilities issues and technician completion notes.</p>
      </div>

      <div class="view-header-actions">
        <button id="resolved-report-btn" class="btn btn-primary">
          ${Icons.plus}
          <span>Report New Issue</span>
        </button>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="card resolved-controls-card">
      <div class="flex-between flex-wrap gap-12">
        <div class="search-box">
          <span class="search-icon">${Icons.search}</span>
          <input type="text" id="resolved-search-input" placeholder="Search resolved tickets or resolution notes..." value="${escapeHtml(resolvedSearchQuery)}">
        </div>

        <div class="flex-align gap-8">
          <div class="select-wrapper">
            <select id="resolved-cat-filter">
              <option value="ALL">All Categories</option>
              ${CATEGORIES.map(c => `<option value="${c}" ${resolvedCategoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <span class="text-sm text-muted font-medium" id="resolved-count-label">${issues.length} resolved</span>
        </div>
      </div>
    </div>

    <!-- Resolved Issues Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Issue & Location</th>
              <th>Category</th>
              <th>Reported / Resolved</th>
              <th>Technician Resolution Note</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="resolved-table-body">
            ${renderResolvedRows(issues, openIssueDetails)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach listeners
  const searchInput = container.querySelector('#resolved-search-input');
  const catSelect = container.querySelector('#resolved-cat-filter');
  const tbody = container.querySelector('#resolved-table-body');
  const countLabel = container.querySelector('#resolved-count-label');

  function updateTable() {
    const allResolved = store.getIssues().filter(i => i.status === 'Resolved');
    let filtered = allResolved.filter(issue => {
      if (resolvedSearchQuery) {
        const q = resolvedSearchQuery.toLowerCase();
        const mTitle = (issue.title || '').toLowerCase().includes(q);
        const mLoc = (issue.location || '').toLowerCase().includes(q);
        const mNote = (issue.resolutionNote || '').toLowerCase().includes(q);
        const mId = (issue.id || '').toLowerCase().includes(q);
        if (!mTitle && !mLoc && !mNote && !mId) return false;
      }
      if (resolvedCategoryFilter !== 'ALL' && issue.category !== resolvedCategoryFilter) {
        return false;
      }
      return true;
    });

    tbody.innerHTML = renderResolvedRows(filtered, openIssueDetails);
    countLabel.textContent = `${filtered.length} resolved`;
    attachResolvedRowActions(tbody, openIssueDetails, updateTable);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      resolvedSearchQuery = e.target.value;
      updateTable();
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      resolvedCategoryFilter = e.target.value;
      updateTable();
    });
  }

  const reportBtn = container.querySelector('#resolved-report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => openIssueModal());
  }

  attachResolvedRowActions(tbody, openIssueDetails, updateTable);
}

function renderResolvedRows(issues) {
  if (issues.length === 0) {
    return `
      <tr>
        <td colspan="6" class="text-center py-24 text-muted">
          No resolved tickets match your current filters.
        </td>
      </tr>
    `;
  }

  return issues.map(issue => {
    const catIcon = getCategoryIcon(issue.category);
    const resolvedTime = issue.resolvedAt ? formatTimeAgo(issue.resolvedAt) : 'Recently';

    return `
      <tr class="issue-table-row" data-id="${issue.id}">
        <td class="font-mono text-xs font-semibold text-muted">${issue.id}</td>
        <td>
          <div class="issue-title-cell">
            <span class="issue-table-title">${escapeHtml(issue.title)}</span>
            <div class="flex-align gap-6 text-xs text-muted">
              ${Icons.pin}
              <span>${escapeHtml(issue.location)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="cat-pill-tiny cat-${issue.category.toLowerCase().replace(/[^a-z]/g, '')}">
            ${catIcon}
            <span>${issue.category}</span>
          </span>
        </td>
        <td>
          <div class="text-xs">
            <div class="font-semibold text-charcoal">Fixed ${resolvedTime}</div>
            <div class="text-muted">Reported ${formatTimeAgo(issue.createdAt)}</div>
          </div>
        </td>
        <td>
          <div class="resolved-note-box">
            <span class="note-quote">${escapeHtml(issue.resolutionNote || 'Technician completed repairs and confirmed safe operation.')}</span>
          </div>
        </td>
        <td style="text-align: right;">
          <div class="flex-align gap-4" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-xs btn-reopen-table" data-id="${issue.id}" title="Reopen this issue">
              ${Icons.refresh}
              <span>Reopen</span>
            </button>
            <button class="btn-icon btn-view-resolved" data-id="${issue.id}" title="View details">
              ${Icons.eye}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function attachResolvedRowActions(tbody, openIssueDetails, refreshCallback) {
  if (!tbody) return;

  tbody.querySelectorAll('.btn-view-resolved').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const issue = store.getIssueById(id);
      if (issue && openIssueDetails) openIssueDetails(issue);
    });
  });

  tbody.querySelectorAll('.btn-reopen-table').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      store.updateIssueStatus(id, 'In Progress');
      refreshCallback();
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}
