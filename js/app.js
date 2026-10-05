// js/app.js - Main Application Orchestrator & View Router
import { store } from './store.js';
import { Icons } from './icons.js';
import { openReportModal, openIssueDetailsModal } from './modal.js';

// Views
import { renderDashboard } from './views/dashboard.js';
import { renderKanban } from './views/kanban.js';
import { renderReportForm } from './views/report.js';
import { renderResolved } from './views/resolved.js';
import { renderAnalytics } from './views/analytics.js';
import { renderInsights } from './views/insights.js';
import { renderSettings } from './views/settings.js';

class CampusFixApp {
  constructor() {
    this.currentView = 'dashboard';
    this.mainContainer = document.getElementById('view-container');
    this.sidebar = document.getElementById('app-sidebar');
    this.globalSearchInput = document.getElementById('global-search-input');
    this.globalSearchResults = document.getElementById('global-search-results');
    this.roleBadge = document.getElementById('topbar-role-badge');
    this.notificationCount = document.getElementById('notif-badge-count');

    this.init();
  }

  init() {
    // 1. Setup Hash Routing
    window.addEventListener('hashchange', () => this.handleHashChange());

    // 2. Setup Sidebar Navigation Links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.dataset.view;
        this.navigateTo(targetView);
        // On mobile, close sidebar
        if (window.innerWidth < 1024) {
          this.sidebar.classList.remove('open');
        }
      });
    });

    // 3. Topbar Report Issue Button
    const topReportBtn = document.getElementById('topbar-report-btn');
    if (topReportBtn) {
      topReportBtn.addEventListener('click', () => {
        openReportModal({}, () => {
          this.refreshCurrentView();
        });
      });
    }

    // 4. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        this.sidebar.classList.toggle('open');
      });
    }

    // Close mobile menu on overlay click
    document.addEventListener('click', (e) => {
      if (window.innerWidth < 1024 && this.sidebar.classList.contains('open')) {
        if (!this.sidebar.contains(e.target) && !e.target.closest('#mobile-menu-toggle')) {
          this.sidebar.classList.remove('open');
        }
      }
    });

    // 5. Global Search
    this.setupGlobalSearch();

    // 6. Role Switcher in Topbar
    if (this.roleBadge) {
      this.roleBadge.addEventListener('click', () => {
        const nextRole = store.getRole() === 'admin' ? 'student' : 'admin';
        store.setRole(nextRole);
      });
    }

    // 7. Subscribe to Store updates
    store.subscribe((issues, stats) => {
      this.updateTopbarBadges(stats);
      this.refreshCurrentView();
    });

    // Initial sync
    this.updateTopbarBadges(store.getStats());
    this.handleHashChange();
  }

  handleHashChange() {
    const raw = window.location.hash.replace('#/', '').replace('#', '').trim();
    const [viewName, queryString] = raw.split('?');
    const params = {};
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
      }
    }
    const validViews = ['dashboard', 'report', 'kanban', 'resolved', 'analytics', 'insights', 'settings'];
    if (validViews.includes(viewName)) {
      this.loadView(viewName, params);
    } else {
      this.loadView('dashboard');
    }
  }

  navigateTo(viewName, params = {}) {
    window.location.hash = `#/${viewName}`;
    this.loadView(viewName, params);
  }

  loadView(viewName, params = {}) {
    this.currentView = viewName;

    // Update active state in sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.view === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render corresponding view
    switch (viewName) {
      case 'dashboard':
        renderDashboard(
          this.mainContainer,
          (v, p) => this.navigateTo(v, p),
          (init) => openReportModal(init, () => this.refreshCurrentView()),
          (issue) => openIssueDetailsModal(issue, () => this.refreshCurrentView())
        );
        break;

      case 'report':
        renderReportForm(
          this.mainContainer,
          (v, p) => this.navigateTo(v, p),
          params
        );
        break;

      case 'kanban':
        renderKanban(
          this.mainContainer,
          (v, p) => this.navigateTo(v, p),
          (init) => openReportModal(init, () => this.refreshCurrentView()),
          (issue) => openIssueDetailsModal(issue, () => this.refreshCurrentView())
        );
        break;

      case 'resolved':
        renderResolved(
          this.mainContainer,
          (v, p) => this.navigateTo(v, p),
          (init) => openReportModal(init, () => this.refreshCurrentView()),
          (issue) => openIssueDetailsModal(issue, () => this.refreshCurrentView())
        );
        break;

      case 'analytics':
        renderAnalytics(
          this.mainContainer,
          (v, p) => this.navigateTo(v, p)
        );
        break;

      case 'insights':
        renderInsights(
          this.mainContainer,
          (v, p) => this.navigateTo(v, p)
        );
        break;

      case 'settings':
        renderSettings(
          this.mainContainer,
          (v, p) => this.navigateTo(v, p)
        );
        break;

      default:
        this.navigateTo('dashboard');
        break;
    }
  }

  refreshCurrentView() {
    this.loadView(this.currentView);
  }

  updateTopbarBadges(stats) {
    // Role badge
    if (this.roleBadge) {
      const role = store.getRole();
      if (role === 'admin') {
        this.roleBadge.innerHTML = `<span class="badge-dot admin"></span> <span>Admin View</span>`;
        this.roleBadge.className = 'topbar-role-badge role-admin';
      } else {
        this.roleBadge.innerHTML = `<span class="badge-dot student"></span> <span>Student View</span>`;
        this.roleBadge.className = 'topbar-role-badge role-student';
      }
    }

    // Pending notification count
    if (this.notificationCount) {
      const highPending = store.getIssues().filter(i => i.priority === 'High' && i.status === 'Pending').length;
      if (highPending > 0) {
        this.notificationCount.textContent = highPending;
        this.notificationCount.style.display = 'inline-flex';
      } else {
        this.notificationCount.textContent = stats.pending;
        this.notificationCount.style.display = stats.pending > 0 ? 'inline-flex' : 'none';
      }
    }
  }

  setupGlobalSearch() {
    if (!this.globalSearchInput || !this.globalSearchResults) return;

    // Keyboard shortcut '/' to focus
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.globalSearchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        this.globalSearchInput.focus();
      }
    });

    this.globalSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        this.globalSearchResults.style.display = 'none';
        return;
      }

      const issues = store.getIssues();
      const matches = issues.filter(issue => {
        return (
          (issue.title || '').toLowerCase().includes(query) ||
          (issue.location || '').toLowerCase().includes(query) ||
          (issue.category || '').toLowerCase().includes(query) ||
          (issue.id || '').toLowerCase().includes(query)
        );
      });

      this.renderSearchResults(matches);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!this.globalSearchInput.contains(e.target) && !this.globalSearchResults.contains(e.target)) {
        this.globalSearchResults.style.display = 'none';
      }
    });

    this.globalSearchInput.addEventListener('focus', () => {
      if (this.globalSearchInput.value.trim()) {
        this.globalSearchResults.style.display = 'block';
      }
    });
  }

  renderSearchResults(matches) {
    if (matches.length === 0) {
      this.globalSearchResults.innerHTML = `
        <div class="search-no-results">
          <p class="text-sm text-muted">No campus issues found matching your query.</p>
        </div>
      `;
      this.globalSearchResults.style.display = 'block';
      return;
    }

    this.globalSearchResults.innerHTML = matches.slice(0, 6).map(issue => `
      <div class="search-result-item" data-id="${issue.id}">
        <div class="flex-between">
          <span class="font-mono text-xs font-bold text-muted">${issue.id}</span>
          <span class="badge-status-pill ${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
        </div>
        <div class="search-result-title">${escapeHtml(issue.title)}</div>
        <div class="search-result-meta flex-align gap-8">
          <span class="text-xs text-muted">${escapeHtml(issue.category)}</span>
          <span class="text-xs text-muted">•</span>
          <span class="text-xs text-muted">${escapeHtml(issue.location)}</span>
        </div>
      </div>
    `).join('');

    this.globalSearchResults.style.display = 'block';

    this.globalSearchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const issue = store.getIssueById(id);
        this.globalSearchResults.style.display = 'none';
        this.globalSearchInput.value = '';
        if (issue) {
          openIssueDetailsModal(issue, () => this.refreshCurrentView());
        }
      });
    });
  }
}

// Helper
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

// Bootstrap on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CampusFixApp();
});
