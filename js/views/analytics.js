// js/views/analytics.js - Campus Facilities Analytics & Telemetry
import { store, CATEGORIES, PRIORITIES } from '../store.js';
import { Icons, getCategoryIcon } from '../icons.js';

export function renderAnalytics(container, navigateTo) {
  const stats = store.getStats();
  const issues = store.getIssues();

  // Calculate building hotspots
  const locationMap = {};
  for (const item of issues) {
    const locName = item.location.split(',')[0].trim();
    if (!locationMap[locName]) {
      locationMap[locName] = { total: 0, resolved: 0, pending: 0, inProgress: 0 };
    }
    locationMap[locName].total++;
    if (item.status === 'Resolved') locationMap[locName].resolved++;
    else if (item.status === 'Pending') locationMap[locName].pending++;
    else locationMap[locName].inProgress++;
  }

  const sortedLocations = Object.entries(locationMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const maxCategoryCount = Math.max(...Object.values(stats.byCategory), 1);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div class="view-badge">
          ${Icons.analytics}
          <span>Performance & SLA Telemetry</span>
        </div>
        <h1 class="view-title">Facilities Analytics</h1>
        <p class="view-subtitle">High-level quantitative overview of campus maintenance volume, resolution velocity, and geographical hotspots.</p>
      </div>

      <div class="view-header-actions">
        <button id="analytics-to-kanban" class="btn btn-secondary">
          ${Icons.kanban}
          <span>View Kanban Board</span>
        </button>
      </div>
    </div>

    <!-- Quick Analytics KPIs -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Resolution Rate</span>
          <div class="stat-icon-wrapper resolved">${Icons.resolved}</div>
        </div>
        <div class="stat-value">${stats.resolutionRate}%</div>
        <div class="stat-meta">
          <span class="badge-status-pill resolved">${stats.resolved} of ${stats.total} closed</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Average Triage Time</span>
          <div class="stat-icon-wrapper pending">${Icons.clock}</div>
        </div>
        <div class="stat-value">18 min</div>
        <div class="stat-meta">
          <span class="text-xs text-muted">Smart keyword auto-routing</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">High Priority Load</span>
          <div class="stat-icon-wrapper ${stats.highPriority > 0 ? 'urgent' : 'resolved'}">${Icons.alertTriangle}</div>
        </div>
        <div class="stat-value">${stats.highPriority}</div>
        <div class="stat-meta">
          <span class="badge-status-pill pending">Safety hazards flagged</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Avg Repair Cycle</span>
          <div class="stat-icon-wrapper progress">${Icons.refresh}</div>
        </div>
        <div class="stat-value">4.2 hrs</div>
        <div class="stat-meta">
          <span class="text-xs text-muted">Across all categories</span>
        </div>
      </div>
    </div>

    <!-- Two-column analytics grid -->
    <div class="dashboard-grid">
      <!-- Left Column: Category Distribution & Priority Breakdown -->
      <div class="dashboard-main-col">
        <!-- Category Distribution -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Issues Volume by Category</h2>
              <p class="card-subtitle">Breakdown of maintenance tickets by physical system</p>
            </div>
          </div>

          <div class="analytics-bar-chart">
            ${CATEGORIES.map(cat => {
              const count = stats.byCategory[cat] || 0;
              const barHeight = Math.round((count / maxCategoryCount) * 100);
              const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const icon = getCategoryIcon(cat);

              return `
                <div class="chart-col">
                  <div class="chart-val-label">${count}</div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill cat-${cat.toLowerCase().replace(/[^a-z]/g, '')}" style="height: ${Math.max(barHeight, 8)}%;"></div>
                  </div>
                  <div class="chart-col-label">
                    <span class="chart-icon">${icon}</span>
                    <span class="chart-title">${cat}</span>
                    <span class="chart-percent">${percent}%</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Priority Breakdown -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Priority Distribution</h2>
              <p class="card-subtitle">Urgency tier distribution determined by severity rules</p>
            </div>
          </div>

          <div class="priority-meters-grid">
            <div class="priority-meter-box prio-high">
              <div class="flex-between">
                <span class="prio-tag">High Priority</span>
                <span class="prio-count">${stats.byPriority.High || 0}</span>
              </div>
              <div class="prio-bar-bg">
                <div class="prio-bar-fill bg-high" style="width: ${stats.total > 0 ? ((stats.byPriority.High || 0) / stats.total) * 100 : 0}%;"></div>
              </div>
              <span class="prio-sub">${stats.total > 0 ? Math.round(((stats.byPriority.High || 0) / stats.total) * 100) : 0}% of campus tickets</span>
            </div>

            <div class="priority-meter-box prio-medium">
              <div class="flex-between">
                <span class="prio-tag">Medium Priority</span>
                <span class="prio-count">${stats.byPriority.Medium || 0}</span>
              </div>
              <div class="prio-bar-bg">
                <div class="prio-bar-fill bg-medium" style="width: ${stats.total > 0 ? ((stats.byPriority.Medium || 0) / stats.total) * 100 : 0}%;"></div>
              </div>
              <span class="prio-sub">${stats.total > 0 ? Math.round(((stats.byPriority.Medium || 0) / stats.total) * 100) : 0}% of campus tickets</span>
            </div>

            <div class="priority-meter-box prio-low">
              <div class="flex-between">
                <span class="prio-tag">Low Priority</span>
                <span class="prio-count">${stats.byPriority.Low || 0}</span>
              </div>
              <div class="prio-bar-bg">
                <div class="prio-bar-fill bg-low" style="width: ${stats.total > 0 ? ((stats.byPriority.Low || 0) / stats.total) * 100 : 0}%;"></div>
              </div>
              <span class="prio-sub">${stats.total > 0 ? Math.round(((stats.byPriority.Low || 0) / stats.total) * 100) : 0}% of campus tickets</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Location Hotspots Leaderboard -->
      <div class="dashboard-side-col">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Campus Hotspots</h2>
              <p class="card-subtitle">Facilities with highest ticket frequency</p>
            </div>
          </div>

          <div class="hotspots-list">
            ${sortedLocations.map(([locName, data], idx) => `
              <div class="hotspot-item">
                <div class="hotspot-rank">#${idx + 1}</div>
                <div class="hotspot-details">
                  <div class="hotspot-name">${escapeHtml(locName)}</div>
                  <div class="hotspot-sub">
                    <span>${data.total} total</span> • 
                    <span class="text-amber">${data.pending} pending</span> • 
                    <span class="text-green">${data.resolved} resolved</span>
                  </div>
                </div>
                <div class="hotspot-badge">
                  ${data.total} tickets
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SLA Compliance Badge -->
        <div class="card sla-card">
          <div class="card-header">
            <h3 class="card-title text-sm">Target SLA Benchmark</h3>
          </div>
          <div class="sla-metrics">
            <div class="sla-row">
              <span>High Priority Safety SLA</span>
              <strong class="text-green">&lt; 2 Hours</strong>
            </div>
            <div class="sla-row">
              <span>Medium Priority Academic SLA</span>
              <strong>&lt; 24 Hours</strong>
            </div>
            <div class="sla-row">
              <span>Routine Maintenance SLA</span>
              <strong>&lt; 72 Hours</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const kanbanBtn = container.querySelector('#analytics-to-kanban');
  if (kanbanBtn) kanbanBtn.addEventListener('click', () => navigateTo('kanban'));
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
