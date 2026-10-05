// js/views/kanban.js - Kanban Board for My Reports (Pending, In Progress, Resolved)
import { store, CATEGORIES, PRIORITIES } from '../store.js';
import { Icons, getCategoryIcon } from '../icons.js';
import { formatTimeAgo } from './dashboard.js';

let kanbanSearchQuery = '';
let kanbanCategoryFilter = 'ALL';
let kanbanPriorityFilter = 'ALL';

export function renderKanban(container, navigateTo, openIssueModal, openIssueDetails) {
  const issues = store.getIssues();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div class="view-badge">
          ${Icons.kanban}
          <span>Issue Lifecycle Board</span>
        </div>
        <h1 class="view-title">My Reports & Tracking</h1>
        <p class="view-subtitle">Interactive Kanban board. Drag issues between columns or use quick actions to update repair stages.</p>
      </div>

      <div class="view-header-actions">
        <button id="kanban-new-issue-btn" class="btn btn-primary">
          ${Icons.plus}
          <span>Report New Issue</span>
        </button>
      </div>
    </div>

    <!-- Kanban Filter Controls -->
    <div class="kanban-controls-card card">
      <div class="kanban-controls-row">
        <div class="search-box kanban-search">
          <span class="search-icon">${Icons.search}</span>
          <input type="text" id="kanban-search-input" placeholder="Search cards by title, location or ID..." value="${escapeHtml(kanbanSearchQuery)}">
          ${kanbanSearchQuery ? `<button id="clear-kanban-search" class="clear-btn">${Icons.close}</button>` : ''}
        </div>

        <div class="filter-dropdowns">
          <div class="select-wrapper">
            <select id="kanban-category-filter">
              <option value="ALL" ${kanbanCategoryFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
              ${CATEGORIES.map(cat => `<option value="${cat}" ${kanbanCategoryFilter === cat ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
          </div>

          <div class="select-wrapper">
            <select id="kanban-priority-filter">
              <option value="ALL" ${kanbanPriorityFilter === 'ALL' ? 'selected' : ''}>All Priorities</option>
              ${PRIORITIES.map(p => `<option value="${p}" ${kanbanPriorityFilter === p ? 'selected' : ''}>${p} Priority</option>`).join('')}
            </select>
          </div>

          ${(kanbanSearchQuery || kanbanCategoryFilter !== 'ALL' || kanbanPriorityFilter !== 'ALL') ? `
            <button id="reset-kanban-filters" class="btn btn-secondary btn-sm" title="Reset filters">
              ${Icons.refresh}
              <span>Reset</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- 3-Column Kanban Board -->
    <div class="kanban-board">
      <!-- Column 1: Pending -->
      <div class="kanban-column column-pending" data-status="Pending">
        <div class="column-header">
          <div class="column-title-group">
            <span class="column-dot pending"></span>
            <h3 class="column-title">Pending</h3>
            <span class="column-count" id="count-pending">0</span>
          </div>
          <span class="column-hint">Awaiting Action</span>
        </div>
        <div class="kanban-dropzone" id="dropzone-pending" data-status="Pending">
          <!-- Cards inserted here -->
        </div>
      </div>

      <!-- Column 2: In Progress -->
      <div class="kanban-column column-progress" data-status="In Progress">
        <div class="column-header">
          <div class="column-title-group">
            <span class="column-dot progress"></span>
            <h3 class="column-title">In Progress</h3>
            <span class="column-count" id="count-in-progress">0</span>
          </div>
          <span class="column-hint">Staff Assigned</span>
        </div>
        <div class="kanban-dropzone" id="dropzone-progress" data-status="In Progress">
          <!-- Cards inserted here -->
        </div>
      </div>

      <!-- Column 3: Resolved -->
      <div class="kanban-column column-resolved" data-status="Resolved">
        <div class="column-header">
          <div class="column-title-group">
            <span class="column-dot resolved"></span>
            <h3 class="column-title">Resolved</h3>
            <span class="column-count" id="count-resolved">0</span>
          </div>
          <span class="column-hint">Fixed & Verified</span>
        </div>
        <div class="kanban-dropzone" id="dropzone-resolved" data-status="Resolved">
          <!-- Cards inserted here -->
        </div>
      </div>
    </div>
  `;

  // Render cards into columns
  populateKanbanColumns(container, openIssueDetails);

  // Attach controls listeners
  const searchInput = container.querySelector('#kanban-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      kanbanSearchQuery = e.target.value;
      populateKanbanColumns(container, openIssueDetails);
    });
  }

  const clearSearch = container.querySelector('#clear-kanban-search');
  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      kanbanSearchQuery = '';
      if (searchInput) searchInput.value = '';
      populateKanbanColumns(container, openIssueDetails);
    });
  }

  const catFilter = container.querySelector('#kanban-category-filter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      kanbanCategoryFilter = e.target.value;
      populateKanbanColumns(container, openIssueDetails);
    });
  }

  const prioFilter = container.querySelector('#kanban-priority-filter');
  if (prioFilter) {
    prioFilter.addEventListener('change', (e) => {
      kanbanPriorityFilter = e.target.value;
      populateKanbanColumns(container, openIssueDetails);
    });
  }

  const resetFilters = container.querySelector('#reset-kanban-filters');
  if (resetFilters) {
    resetFilters.addEventListener('click', () => {
      kanbanSearchQuery = '';
      kanbanCategoryFilter = 'ALL';
      kanbanPriorityFilter = 'ALL';
      renderKanban(container, navigateTo, openIssueModal, openIssueDetails);
    });
  }

  const newIssueBtn = container.querySelector('#kanban-new-issue-btn');
  if (newIssueBtn) {
    newIssueBtn.addEventListener('click', () => openIssueModal());
  }

  // Setup HTML5 Drag and Drop on dropzones
  setupDragAndDrop(container, openIssueDetails);
}

function filterKanbanIssues(issues) {
  return issues.filter(issue => {
    // Search query match
    if (kanbanSearchQuery) {
      const q = kanbanSearchQuery.toLowerCase();
      const matchTitle = (issue.title || '').toLowerCase().includes(q);
      const matchDesc = (issue.description || '').toLowerCase().includes(q);
      const matchLoc = (issue.location || '').toLowerCase().includes(q);
      const matchId = (issue.id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchId) return false;
    }

    // Category filter match
    if (kanbanCategoryFilter !== 'ALL' && issue.category !== kanbanCategoryFilter) {
      return false;
    }

    // Priority filter match
    if (kanbanPriorityFilter !== 'ALL' && issue.priority !== kanbanPriorityFilter) {
      return false;
    }

    return true;
  });
}

function populateKanbanColumns(container, openIssueDetails) {
  const issues = store.getIssues();
  const filtered = filterKanbanIssues(issues);

  const pendingIssues = filtered.filter(i => i.status === 'Pending');
  const progressIssues = filtered.filter(i => i.status === 'In Progress');
  const resolvedIssues = filtered.filter(i => i.status === 'Resolved');

  // Update counts
  const countPending = container.querySelector('#count-pending');
  const countProgress = container.querySelector('#count-in-progress');
  const countResolved = container.querySelector('#count-resolved');

  if (countPending) countPending.textContent = pendingIssues.length;
  if (countProgress) countProgress.textContent = progressIssues.length;
  if (countResolved) countResolved.textContent = resolvedIssues.length;

  const dropPending = container.querySelector('#dropzone-pending');
  const dropProgress = container.querySelector('#dropzone-progress');
  const dropResolved = container.querySelector('#dropzone-resolved');

  if (dropPending) {
    dropPending.innerHTML = renderColumnCards(pendingIssues, 'Pending');
  }
  if (dropProgress) {
    dropProgress.innerHTML = renderColumnCards(progressIssues, 'In Progress');
  }
  if (dropResolved) {
    dropResolved.innerHTML = renderColumnCards(resolvedIssues, 'Resolved');
  }

  attachCardEvents(container, openIssueDetails);
}

function renderColumnCards(issues, columnStatus) {
  if (issues.length === 0) {
    return `
      <div class="empty-dropzone">
        <span class="empty-icon">${Icons.pin}</span>
        <p class="empty-text">No ${columnStatus.toLowerCase()} issues</p>
        <span class="empty-subtext">Drag cards here or submit new report</span>
      </div>
    `;
  }

  return issues.map(issue => {
    const catIcon = getCategoryIcon(issue.category);
    const timeAgo = formatTimeAgo(issue.createdAt);

    return `
      <div class="kanban-card priority-border-${issue.priority.toLowerCase()}" 
           draggable="true" 
           data-id="${issue.id}" 
           data-status="${issue.status}">
        
        <div class="kanban-card-top">
          <div class="flex-align gap-6">
            <span class="kanban-card-id">${issue.id}</span>
            <span class="cat-pill-tiny cat-${issue.category.toLowerCase().replace(/[^a-z]/g, '')}">
              ${catIcon}
              <span>${issue.category}</span>
            </span>
          </div>
          <span class="priority-badge priority-${issue.priority.toLowerCase()}">
            ${issue.priority}
          </span>
        </div>

        <h4 class="kanban-card-title">${escapeHtml(issue.title)}</h4>

        <p class="kanban-card-desc">${escapeHtml(issue.description)}</p>

        <div class="kanban-card-location">
          ${Icons.pin}
          <span title="${escapeHtml(issue.location)}">${escapeHtml(issue.location)}</span>
        </div>

        ${issue.smartDetected ? `
          <div class="kanban-smart-tag" title="${escapeHtml(issue.smartReason || '')}">
            ${Icons.sparkleSmall}
            <span>Smart Priority Analyzed</span>
          </div>
        ` : ''}

        <div class="kanban-card-footer">
          <div class="card-reporter">
            <span class="reporter-avatar">${(issue.reporterName || 'S').charAt(0).toUpperCase()}</span>
            <span class="card-time">${timeAgo}</span>
          </div>

          <div class="card-actions">
            <!-- Quick status transition actions -->
            ${issue.status === 'Pending' ? `
              <button class="btn-card-action btn-move" data-id="${issue.id}" data-target="In Progress" title="Move to In Progress">
                <span>Start</span>
                ${Icons.arrowRight}
              </button>
            ` : ''}

            ${issue.status === 'In Progress' ? `
              <button class="btn-card-action btn-resolve" data-id="${issue.id}" data-target="Resolved" title="Mark as Resolved">
                ${Icons.check}
                <span>Resolve</span>
              </button>
            ` : ''}

            ${issue.status === 'Resolved' ? `
              <button class="btn-card-action btn-reopen" data-id="${issue.id}" data-target="In Progress" title="Reopen issue">
                ${Icons.refresh}
                <span>Reopen</span>
              </button>
            ` : ''}

            <button class="btn-icon-sm btn-card-details" data-id="${issue.id}" title="View full details">
              ${Icons.eye}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function attachCardEvents(container, openIssueDetails) {
  // Card click to open details
  container.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('select')) return;
      const id = card.dataset.id;
      const issue = store.getIssueById(id);
      if (issue && openIssueDetails) {
        openIssueDetails(issue);
      }
    });

    // Native Drag events
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('is-dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      container.querySelectorAll('.kanban-dropzone').forEach(dz => dz.classList.remove('drag-over'));
    });
  });

  // Details button
  container.querySelectorAll('.btn-card-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const issue = store.getIssueById(id);
      if (issue && openIssueDetails) {
        openIssueDetails(issue);
      }
    });
  });

  // Quick Move / Resolve button
  container.querySelectorAll('.btn-card-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const target = btn.dataset.target;
      store.updateIssueStatus(id, target);
      populateKanbanColumns(container, openIssueDetails);
    });
  });
}

function setupDragAndDrop(container, openIssueDetails) {
  const dropzones = container.querySelectorAll('.kanban-dropzone');

  dropzones.forEach(dropzone => {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', (e) => {
      if (!dropzone.contains(e.relatedTarget)) {
        dropzone.classList.remove('drag-over');
      }
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const issueId = e.dataTransfer.getData('text/plain');
      const targetStatus = dropzone.dataset.status;

      if (issueId && targetStatus) {
        const issue = store.getIssueById(issueId);
        if (issue && issue.status !== targetStatus) {
          store.updateIssueStatus(issueId, targetStatus);
          populateKanbanColumns(container, openIssueDetails);
        }
      }
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
