// js/modal.js - Reusable Modal for Quick Issue Reporting & Issue Details Viewer
import { store, CATEGORIES, PRIORITIES } from './store.js';
import { Icons, getCategoryIcon } from './icons.js';
import { analyzePriority } from './smart-engine.js';
import { formatTimeAgo } from './views/dashboard.js';
import { showToast } from './views/report.js';

let activeModal = null;

export function openReportModal(initialData = {}, onSubmitted) {
  closeModal();

  let selectedCategory = initialData.category || 'Electrical';
  let selectedPriority = initialData.priority || 'Medium';
  let isOverridden = false;
  let smartResult = null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-dialog modal-md" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="flex-align gap-8">
          <div class="modal-header-icon">${Icons.report}</div>
          <div>
            <h3 class="modal-title">Report Campus Issue</h3>
            <p class="modal-subtitle">Direct dispatch to campus maintenance</p>
          </div>
        </div>
        <button class="btn-close-modal" aria-label="Close modal">${Icons.close}</button>
      </div>

      <div class="modal-body">
        <form id="modal-report-form" novalidate>
          <div class="form-group">
            <label class="form-label required" for="m-title">Issue Title</label>
            <input type="text" id="m-title" class="form-input" placeholder="e.g., Burst water pipe or sparking switchboard" value="${escapeHtml(initialData.title || '')}" required>
            <div class="field-error" id="m-title-error">Please enter at least 5 characters.</div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label required" for="m-category">Category</label>
              <select id="m-category" class="form-select">
                ${CATEGORIES.map(c => `<option value="${c}" ${c === selectedCategory ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label required" for="m-priority">Priority</label>
              <select id="m-priority" class="form-select">
                ${PRIORITIES.map(p => `<option value="${p}" ${p === selectedPriority ? 'selected' : ''}>${p} Priority</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required" for="m-location">Campus Location</label>
            <input type="text" id="m-location" class="form-input" placeholder="e.g., Central Library 2nd Floor or Hostel 3" value="${escapeHtml(initialData.location || '')}" required>
            <div class="field-error" id="m-location-error">Please enter a specific campus location.</div>
          </div>

          <div class="form-group">
            <label class="form-label required" for="m-description">Description</label>
            <textarea id="m-description" class="form-textarea" rows="3" placeholder="Describe the physical condition, hazards, or equipment affected..." required>${escapeHtml(initialData.description || '')}</textarea>
            <div class="field-error" id="m-desc-error">Please enter at least 10 characters.</div>
          </div>

          <!-- Quick Smart AI Preview Banner -->
          <div class="modal-smart-box" id="m-smart-box" style="display: none;">
            <div class="flex-align gap-6">
              <span class="text-orange">${Icons.sparkleSmall}</span>
              <strong id="m-smart-headline">Smart Triage Analysis</strong>
            </div>
            <p id="m-smart-reason" class="text-xs text-muted mb-0 mt-4"></p>
            <div id="m-smart-tags" class="mt-6 flex-wrap gap-4 flex-align"></div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-cancel-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${Icons.report}
              <span>Submit Issue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeModal = overlay;
  setTimeout(() => overlay.classList.add('visible'), 10);

  // Attach elements
  const form = overlay.querySelector('#modal-report-form');
  const titleInput = overlay.querySelector('#m-title');
  const descInput = overlay.querySelector('#m-description');
  const locInput = overlay.querySelector('#m-location');
  const catSelect = overlay.querySelector('#m-category');
  const prioSelect = overlay.querySelector('#m-priority');
  const smartBox = overlay.querySelector('#m-smart-box');
  const smartHeadline = overlay.querySelector('#m-smart-headline');
  const smartReason = overlay.querySelector('#m-smart-reason');
  const smartTags = overlay.querySelector('#m-smart-tags');

  function evaluateSmart() {
    const t = titleInput.value.trim();
    const d = descInput.value.trim();
    if (!t && !d) {
      smartBox.style.display = 'none';
      return;
    }
    smartResult = analyzePriority(t, d, catSelect.value);
    smartBox.style.display = 'block';
    smartHeadline.textContent = `${smartResult.headline} (${smartResult.confidence}% confidence)`;
    smartReason.textContent = smartResult.reason;
    if (smartResult.matches.length > 0) {
      smartTags.innerHTML = smartResult.matches.map(m => `<span class="kw-tag">${m}</span>`).join('');
    } else {
      smartTags.innerHTML = '';
    }

    if (!isOverridden) {
      prioSelect.value = smartResult.priority;
    }
  }

  titleInput.addEventListener('input', evaluateSmart);
  descInput.addEventListener('input', evaluateSmart);
  catSelect.addEventListener('change', evaluateSmart);

  prioSelect.addEventListener('change', () => {
    isOverridden = true;
  });

  // Close handlers
  overlay.querySelector('.btn-close-modal').addEventListener('click', closeModal);
  overlay.querySelector('.btn-cancel-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const loc = locInput.value.trim();
    const desc = descInput.value.trim();

    overlay.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
    let valid = true;

    if (!title || title.length < 5) {
      valid = false;
      overlay.querySelector('#m-title-error').style.display = 'block';
    }
    if (!loc || loc.length < 3) {
      valid = false;
      overlay.querySelector('#m-location-error').style.display = 'block';
    }
    if (!desc || desc.length < 10) {
      valid = false;
      overlay.querySelector('#m-desc-error').style.display = 'block';
    }

    if (!valid) return;

    const analysis = analyzePriority(title, desc, catSelect.value);
    const created = store.addIssue({
      title,
      description: desc,
      location: loc,
      category: catSelect.value,
      priority: prioSelect.value,
      reporterName: 'Alex Chen (Student)',
      smartDetected: analysis.matches.length > 0,
      smartReason: analysis.reason
    });

    closeModal();
    showToast(`Issue ${created.id} logged successfully!`, 'success');
    if (onSubmitted) onSubmitted(created);
  });

  if (initialData.title || initialData.description) {
    evaluateSmart();
  }
}

export function openIssueDetailsModal(issue, onUpdate) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const catIcon = getCategoryIcon(issue.category);
  const timeFormatted = formatTimeAgo(issue.createdAt);

  overlay.innerHTML = `
    <div class="modal-dialog modal-md" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="flex-align gap-8">
          <span class="font-mono font-bold text-sm text-muted">${issue.id}</span>
          <span class="cat-pill-tiny cat-${issue.category.toLowerCase().replace(/[^a-z]/g, '')}">
            ${catIcon}
            <span>${issue.category}</span>
          </span>
          <span class="priority-badge priority-${issue.priority.toLowerCase()}">
            ${issue.priority} Priority
          </span>
        </div>
        <button class="btn-close-modal" aria-label="Close modal">${Icons.close}</button>
      </div>

      <div class="modal-body">
        <h2 class="modal-issue-title">${escapeHtml(issue.title)}</h2>

        <div class="modal-issue-location flex-align gap-6">
          ${Icons.pin}
          <span>${escapeHtml(issue.location)}</span>
        </div>

        <div class="details-section">
          <label class="details-label">Description</label>
          <p class="details-desc-box">${escapeHtml(issue.description)}</p>
        </div>

        ${issue.smartDetected ? `
          <div class="details-section">
            <div class="smart-rec-box smart-${issue.priority.toLowerCase()}" style="margin: 0;">
              <div class="flex-align gap-6">
                ${Icons.sparkleSmall}
                <strong class="text-xs">Smart AI Triage Analysis</strong>
              </div>
              <p class="text-xs text-muted mb-0 mt-4">${escapeHtml(issue.smartReason || 'Detected relevant campus keywords.')}</p>
            </div>
          </div>
        ` : ''}

        <div class="details-meta-grid">
          <div class="meta-item">
            <span class="meta-lbl">Reported By</span>
            <span class="meta-val">${escapeHtml(issue.reporterName || 'Alex Chen')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Submitted</span>
            <span class="meta-val">${timeFormatted}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Assigned Team</span>
            <span class="meta-val">${escapeHtml(issue.assignedTo || 'Facility Dispatch')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Status</span>
            <span class="badge-status-pill ${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
          </div>
        </div>

        <!-- Status Transition Selector for Admin / Student -->
        <div class="details-section status-change-section">
          <label class="details-label">Update Lifecycle Status</label>
          <div class="status-btn-group">
            <button type="button" class="btn-status-choice ${issue.status === 'Pending' ? 'active pending' : ''}" data-status="Pending">
              <span class="column-dot pending"></span>
              <span>Pending</span>
            </button>
            <button type="button" class="btn-status-choice ${issue.status === 'In Progress' ? 'active progress' : ''}" data-status="In Progress">
              <span class="column-dot progress"></span>
              <span>In Progress</span>
            </button>
            <button type="button" class="btn-status-choice ${issue.status === 'Resolved' ? 'active resolved' : ''}" data-status="Resolved">
              <span class="column-dot resolved"></span>
              <span>Resolved</span>
            </button>
          </div>

          <div class="resolution-note-input-box mt-12" id="resolution-box" style="${issue.status === 'Resolved' ? 'display: block;' : 'display: none;'}">
            <label class="details-label">Resolution / Remediation Note</label>
            <input type="text" id="details-res-note" class="form-input text-sm" placeholder="e.g., Replaced fuse & sanitized area" value="${escapeHtml(issue.resolutionNote || '')}">
          </div>
        </div>

        <div class="modal-footer flex-between">
          <button type="button" class="btn btn-danger-soft btn-sm btn-delete-issue">
            ${Icons.trash}
            <span>Delete Ticket</span>
          </button>
          <div class="flex-align gap-8">
            <button type="button" class="btn btn-secondary btn-cancel-modal">Close</button>
            <button type="button" class="btn btn-primary btn-save-status">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeModal = overlay;
  setTimeout(() => overlay.classList.add('visible'), 10);

  let currentStatus = issue.status;
  const statusChoices = overlay.querySelectorAll('.btn-status-choice');
  const resolutionBox = overlay.querySelector('#resolution-box');
  const resNoteInput = overlay.querySelector('#details-res-note');

  statusChoices.forEach(btn => {
    btn.addEventListener('click', () => {
      statusChoices.forEach(b => {
        b.classList.remove('active', 'pending', 'progress', 'resolved');
      });
      currentStatus = btn.dataset.status;
      const classMap = { 'Pending': 'pending', 'In Progress': 'progress', 'Resolved': 'resolved' };
      btn.classList.add('active', classMap[currentStatus]);

      if (currentStatus === 'Resolved') {
        resolutionBox.style.display = 'block';
      } else {
        resolutionBox.style.display = 'none';
      }
    });
  });

  // Save changes
  overlay.querySelector('.btn-save-status').addEventListener('click', () => {
    const note = resNoteInput ? resNoteInput.value.trim() : '';
    store.updateIssueStatus(issue.id, currentStatus, note);
    showToast(`Updated ${issue.id} to ${currentStatus}`, 'success');
    closeModal();
    if (onUpdate) onUpdate();
  });

  // Delete
  overlay.querySelector('.btn-delete-issue').addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete issue ${issue.id}?`)) {
      store.deleteIssue(issue.id);
      showToast(`Deleted ${issue.id}`, 'info');
      closeModal();
      if (onUpdate) onUpdate();
    }
  });

  // Close handlers
  overlay.querySelector('.btn-close-modal').addEventListener('click', closeModal);
  overlay.querySelector('.btn-cancel-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

export function closeModal() {
  if (activeModal) {
    activeModal.classList.remove('visible');
    const el = activeModal;
    setTimeout(() => el.remove(), 200);
    activeModal = null;
  }
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
