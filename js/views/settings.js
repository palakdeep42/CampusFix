// js/views/settings.js - Platform Settings, Role Switcher & Judge Demo Controls
import { store } from '../store.js';
import { Icons } from '../icons.js';
import { showToast } from './report.js';

export function renderSettings(container, navigateTo) {
  const currentRole = store.getRole();
  const issues = store.getIssues();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div class="view-badge">
          ${Icons.settings}
          <span>System Preferences</span>
        </div>
        <h1 class="view-title">Platform Settings</h1>
        <p class="view-subtitle">Manage user permissions, reset competition seed data, or export campus issue records.</p>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Role Toggle Card -->
      <div class="card settings-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Active Platform Persona</h2>
            <p class="card-subtitle">Switch between Student reporter view and Campus Operations admin view</p>
          </div>
        </div>

        <div class="persona-switch-row">
          <label class="persona-card ${currentRole === 'student' ? 'active' : ''}">
            <input type="radio" name="persona" value="student" ${currentRole === 'student' ? 'checked' : ''}>
            <div class="persona-content">
              <span class="persona-icon">${Icons.user}</span>
              <span class="persona-title">Student View</span>
              <span class="persona-desc">Optimized for quick issue reporting and personal ticket tracking.</span>
            </div>
          </label>

          <label class="persona-card ${currentRole === 'admin' ? 'active' : ''}">
            <input type="radio" name="persona" value="admin" ${currentRole === 'admin' ? 'checked' : ''}>
            <div class="persona-content">
              <span class="persona-icon">${Icons.dashboard}</span>
              <span class="persona-title">Campus Admin / Dispatch</span>
              <span class="persona-desc">Full facility controls, status overrides, and resolution log audits.</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Competition Demo & Data Controls -->
      <div class="card settings-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Competition & Demo Controls</h2>
            <p class="card-subtitle">Quick reset and export tools for competition judges and evaluators</p>
          </div>
        </div>

        <div class="settings-action-list">
          <div class="settings-action-item">
            <div>
              <h4 class="action-item-title">Reset to Clean Seed Dataset</h4>
              <p class="action-item-desc">Restores the 8 realistic campus issues (electrical, Wi-Fi, plumbing, etc.) with accurate sample statuses.</p>
            </div>
            <button id="reset-seed-btn" class="btn btn-secondary">
              ${Icons.refresh}
              <span>Reset Seed Data</span>
            </button>
          </div>

          <div class="settings-action-item">
            <div>
              <h4 class="action-item-title">Export Issue Database (JSON)</h4>
              <p class="action-item-desc">Download all currently saved ${issues.length} records from browser localStorage as a formatted JSON file.</p>
            </div>
            <button id="export-json-btn" class="btn btn-secondary">
              ${Icons.download}
              <span>Download JSON</span>
            </button>
          </div>

          <div class="settings-action-item danger-item">
            <div>
              <h4 class="action-item-title text-danger">Clear All Local Storage</h4>
              <p class="action-item-desc">Purges all active tickets and resets application state completely.</p>
            </div>
            <button id="clear-all-btn" class="btn btn-danger-soft">
              ${Icons.trash}
              <span>Clear Data</span>
            </button>
          </div>
        </div>
      </div>

      <!-- About CampusFix -->
      <div class="card settings-card">
        <div class="card-header">
          <h2 class="card-title">About CampusFix Platform</h2>
        </div>
        <p class="text-sm text-muted" style="line-height: 1.6;">
          <strong>CampusFix</strong> was engineered for rapid, reliable campus issue tracking. Built with modern, zero-dependency vanilla web standards for 100% offline uptime, local storage resilience, and lightning-fast edge keyword triage.
        </p>
      </div>
    </div>
  `;

  // Attach Persona Switcher
  container.querySelectorAll('input[name="persona"]').forEach(radio => {
    radio.addEventListener('change', () => {
      store.setRole(radio.value);
      showToast(`Switched to ${radio.value === 'admin' ? 'Campus Admin' : 'Student'} Persona`, 'info');
      renderSettings(container, navigateTo);
    });
  });

  // Attach Reset Seed Data
  const resetBtn = container.querySelector('#reset-seed-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      store.resetToSeed();
      showToast('Successfully reset to clean competition seed dataset!', 'success');
      setTimeout(() => navigateTo('dashboard'), 400);
    });
  }

  // Attach Export JSON
  const exportBtn = container.querySelector('#export-json-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(store.getIssues(), null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `campusfix_records_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Exported campus records as JSON file.', 'success');
    });
  }

  // Attach Clear All
  const clearBtn = container.querySelector('#clear-all-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all campus tickets? You can always restore seed data later.')) {
        store.issues = [];
        store.save();
        showToast('All records cleared.', 'info');
        renderSettings(container, navigateTo);
      }
    });
  }
}
