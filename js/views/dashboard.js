// js/views/dashboard.js - SaaS Dashboard View with Stats, Overview, Category breakdown & Recent Issues
import { store, CATEGORIES } from '../store.js';
import { Icons, getCategoryIcon } from '../icons.js';
import { generateSmartInsights } from '../smart-engine.js';

export function renderDashboard(container, navigateTo, openIssueModal, openIssueDetails) {
  const stats = store.getStats();
  const issues = store.getIssues();
  const insights = generateSmartInsights(issues);
  const activeRole = store.getRole();

  // Category breakdown calculations
  const categoryMax = Math.max(...Object.values(stats.byCategory), 1);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div class="view-badge">
          ${Icons.sparkleSmall}
          <span>Real-time Facility Monitoring</span>
        </div>
        <h1 class="view-title">Campus Operations Dashboard</h1>
        <p class="view-subtitle">Live centralized issue reporting, priority routing, and resolution telemetry across campus facilities.</p>
      </div>

      <div class="view-header-actions">
        <button id="dash-quick-report-btn" class="btn btn-primary">
          ${Icons.plus}
          <span>Report Issue</span>
        </button>
      </div>
    </div>

    <!-- 4 Summary KPI Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Total Reported</span>
          <div class="stat-icon-wrapper total">
            ${Icons.barChart3 || Icons.dashboard}
          </div>
        </div>
        <div class="stat-value">${stats.total}</div>
        <div class="stat-meta">
          <span class="badge-trend positive">${Icons.trendingUp} Active campus database</span>
          <span class="stat-subtext">All active & past tickets</span>
        </div>
      </div>

      <div class="stat-card stat-pending">
        <div class="stat-header">
          <span class="stat-label">Pending Triage</span>
          <div class="stat-icon-wrapper pending">
            ${Icons.clock}
          </div>
        </div>
        <div class="stat-value">${stats.pending}</div>
        <div class="stat-meta">
          <span class="badge-status-pill pending">${stats.highPriority} high priority</span>
          <span class="stat-subtext">Awaiting maintenance</span>
        </div>
      </div>

      <div class="stat-card stat-progress">
        <div class="stat-header">
          <span class="stat-label">In Progress</span>
          <div class="stat-icon-wrapper progress">
            ${Icons.refresh}
          </div>
        </div>
        <div class="stat-value">${stats.inProgress}</div>
        <div class="stat-meta">
          <span class="badge-status-pill in-progress">Under active repair</span>
          <span class="stat-subtext">Assigned to field staff</span>
        </div>
      </div>

      <div class="stat-card stat-resolved">
        <div class="stat-header">
          <span class="stat-label">Resolved</span>
          <div class="stat-icon-wrapper resolved">
            ${Icons.resolved}
          </div>
        </div>
        <div class="stat-value">${stats.resolved}</div>
        <div class="stat-meta">
          <span class="badge-status-pill resolved">${stats.resolutionRate}% resolution rate</span>
          <span class="stat-subtext">Archived & verified</span>
        </div>
      </div>
    </div>

    <!-- Main Grid: Left Column (Status Overview & Recent Issues) + Right Column (Smart Insights & Categories) -->
    <div class="dashboard-grid">
      <!-- Left Column -->
      <div class="dashboard-main-col">
        <!-- Status Overview Progress Card -->
        <div class="card status-overview-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Issue Status Overview</h2>
              <p class="card-subtitle">Current workflow distribution across lifecycle stages</p>
            </div>
            <div class="status-legend">
              <span class="legend-item"><span class="legend-dot pending"></span> Pending (${stats.pending})</span>
              <span class="legend-item"><span class="legend-dot in-progress"></span> In Progress (${stats.inProgress})</span>
              <span class="legend-item"><span class="legend-dot resolved"></span> Resolved (${stats.resolved})</span>
            </div>
          </div>
          
          <div class="progress-stacked-bar">
            <div class="bar-segment pending" style="width: ${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%;" title="Pending: ${stats.pending}"></div>
            <div class="bar-segment in-progress" style="width: ${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%;" title="In Progress: ${stats.inProgress}"></div>
            <div class="bar-segment resolved" style="width: ${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%;" title="Resolved: ${stats.resolved}"></div>
          </div>

          <div class="status-metrics-row">
            <div class="metric-pill">
              <span class="metric-num">${stats.pending}</span>
              <span class="metric-txt">Awaiting Review</span>
            </div>
            <div class="metric-pill">
              <span class="metric-num">${stats.inProgress}</span>
              <span class="metric-txt">Technicians Dispatched</span>
            </div>
            <div class="metric-pill">
              <span class="metric-num">${stats.resolved}</span>
              <span class="metric-txt">Successfully Closed</span>
            </div>
            <div class="metric-pill highlight">
              <span class="metric-num">${stats.highPriority}</span>
              <span class="metric-txt">Safety High Priority</span>
            </div>
          </div>
        </div>

        <!-- Recent Issues Table / Card -->
        <div class="card recent-issues-card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Recent Campus Issues</h2>
              <p class="card-subtitle">Real-time reports sorted by latest submission</p>
            </div>
            <div class="table-filters">
              <button class="filter-chip active" data-filter="all">All</button>
              <button class="filter-chip" data-filter="High">High Priority</button>
              <button class="filter-chip" data-filter="Pending">Pending</button>
              <button class="filter-chip" data-filter="In Progress">In Progress</button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Issue & Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="dashboard-recent-tbody">
                ${renderRecentRows(issues, 'all')}
              </tbody>
            </table>
          </div>

          <div class="card-footer flex-between">
            <span class="text-muted text-sm">Showing top recent campus issues</span>
            <button id="view-kanban-link" class="btn btn-secondary btn-sm">
              <span>Open My Reports Kanban</span>
              ${Icons.arrowRight}
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Smart Insights & Issues by Category -->
      <div class="dashboard-side-col">
        <!-- Smart AI Insights Panel -->
        <div class="card smart-insights-card">
          <div class="card-header flex-between">
            <div class="flex-align gap-8">
              <div class="smart-badge-icon">
                ${Icons.insights}
              </div>
              <div>
                <h2 class="card-title">Smart Insight Panel</h2>
                <p class="card-subtitle">Automated keyword & pattern diagnostics</p>
              </div>
            </div>
            <span class="smart-pill-live">LIVE ANALYZER</span>
          </div>

          <div class="insights-list">
            ${insights.slice(0, 3).map(insight => `
              <div class="insight-item insight-${insight.type}">
                <div class="insight-top">
                  <span class="insight-badge ${insight.type}">${insight.badge}</span>
                </div>
                <h4 class="insight-title">${insight.title}</h4>
                <p class="insight-desc">${insight.description}</p>
              </div>
            `).join('')}
          </div>

          <button id="view-all-insights-btn" class="btn btn-outline btn-block btn-sm">
            <span>Explore Full Diagnostics</span>
            ${Icons.arrowRight}
          </button>
        </div>

        <!-- Issues by Category Card -->
        <div class="card categories-card">
          <div class="card-header">
            <h2 class="card-title">Issues by Category</h2>
            <p class="card-subtitle">Distribution across facility systems</p>
          </div>

          <div class="category-list">
            ${CATEGORIES.map(category => {
              const count = stats.byCategory[category] || 0;
              const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const barPercent = Math.round((count / categoryMax) * 100);
              const icon = getCategoryIcon(category);

              return `
                <div class="category-row" data-cat="${category}">
                  <div class="category-info">
                    <span class="category-icon cat-${category.toLowerCase().replace(/[^a-z]/g, '')}">
                      ${icon}
                    </span>
                    <span class="category-name">${category}</span>
                  </div>
                  <div class="category-meter">
                    <div class="category-bar">
                      <div class="category-bar-fill cat-${category.toLowerCase().replace(/[^a-z]/g, '')}" style="width: ${barPercent}%;"></div>
                    </div>
                  </div>
                  <div class="category-count">
                    <span class="count-num">${count}</span>
                    <span class="count-percent">${percent}%</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Quick Tips for Competition / Campus Guidelines -->
        <div class="card quick-actions-card">
          <div class="card-header">
            <h3 class="card-title text-sm">Campus Facility Hotline</h3>
          </div>
          <p class="text-sm text-muted" style="margin-bottom: 12px;">
            For immediate life-safety emergencies, call Campus Security Dispatch: <strong>ext. 5555</strong>.
          </p>
          <div class="flex-align gap-8">
            <button id="quick-add-urgent-btn" class="btn btn-danger-soft btn-sm btn-block">
              ${Icons.alertTriangle}
              <span>Quick Emergency Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Event Listeners
  const reportBtn = container.querySelector('#dash-quick-report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => openIssueModal());
  }

  const urgentBtn = container.querySelector('#quick-add-urgent-btn');
  if (urgentBtn) {
    urgentBtn.addEventListener('click', () => {
      openIssueModal({ priority: 'High', title: 'Urgent: ' });
    });
  }

  const kanbanLink = container.querySelector('#view-kanban-link');
  if (kanbanLink) {
    kanbanLink.addEventListener('click', () => navigateTo('kanban'));
  }

  const insightsLink = container.querySelector('#view-all-insights-btn');
  if (insightsLink) {
    insightsLink.addEventListener('click', () => navigateTo('insights'));
  }

  // Filter chips in Recent Issues table
  const filterChips = container.querySelectorAll('.filter-chip');
  const tbody = container.querySelector('#dashboard-recent-tbody');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      tbody.innerHTML = renderRecentRows(store.getIssues(), filter);
      attachRowActionListeners(tbody, openIssueDetails);
    });
  });

  attachRowActionListeners(tbody, openIssueDetails);
}

function renderRecentRows(issues, filter) {
  let filtered = issues;
  if (filter === 'High') {
    filtered = issues.filter(i => i.priority === 'High');
  } else if (filter === 'Pending') {
    filtered = issues.filter(i => i.status === 'Pending');
  } else if (filter === 'In Progress') {
    filtered = issues.filter(i => i.status === 'In Progress');
  }

  if (filtered.length === 0) {
    return `<tr><td colspan="6" class="text-center py-16 text-muted">No campus issues match this filter.</td></tr>`;
  }

  return filtered.slice(0, 7).map(issue => {
    const catIcon = getCategoryIcon(issue.category);
    const timeFormatted = formatTimeAgo(issue.createdAt);
    
    return `
      <tr class="issue-table-row" data-id="${issue.id}">
        <td class="font-mono text-xs font-semibold text-muted">${issue.id}</td>
        <td>
          <div class="issue-title-cell">
            <span class="issue-table-title" title="${escapeHtml(issue.title)}">${escapeHtml(issue.title)}</span>
            <div class="issue-subinfo">
              <span class="cat-pill-tiny cat-${issue.category.toLowerCase().replace(/[^a-z]/g, '')}">
                ${catIcon}
                <span>${issue.category}</span>
              </span>
              ${issue.smartDetected ? `<span class="smart-pill-tiny" title="${escapeHtml(issue.smartReason || '')}">Smart AI</span>` : ''}
              <span class="text-muted text-xs">• ${timeFormatted}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="location-cell">
            ${Icons.pin}
            <span class="location-text" title="${escapeHtml(issue.location)}">${escapeHtml(issue.location)}</span>
          </div>
        </td>
        <td>
          <span class="priority-badge priority-${issue.priority.toLowerCase()}">
            ${issue.priority}
          </span>
        </td>
        <td>
          <div class="status-cell">
            <select class="status-select-inline" data-id="${issue.id}">
              <option value="Pending" ${issue.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </div>
        </td>
        <td style="text-align: right;">
          <button class="btn-icon btn-view-row" data-id="${issue.id}" title="View details">
            ${Icons.eye}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function attachRowActionListeners(tbody, openIssueDetails) {
  if (!tbody) return;

  // View details
  tbody.querySelectorAll('.btn-view-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const issue = store.getIssueById(id);
      if (issue && openIssueDetails) {
        openIssueDetails(issue);
      }
    });
  });

  // Row click
  tbody.querySelectorAll('.issue-table-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('select') || e.target.closest('button')) return;
      const id = row.dataset.id;
      const issue = store.getIssueById(id);
      if (issue && openIssueDetails) {
        openIssueDetails(issue);
      }
    });
  });

  // Status select quick-change
  tbody.querySelectorAll('.status-select-inline').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = select.dataset.id;
      const newStatus = select.value;
      store.updateIssueStatus(id, newStatus);
    });
  });
}

export function formatTimeAgo(isoString) {
  if (!isoString) return 'recently';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
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
