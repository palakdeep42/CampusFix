// js/views/report.js - Issue Reporting Form with Live Smart Priority Detection
import { store, CATEGORIES, PRIORITIES } from '../store.js';
import { Icons, getCategoryIcon } from '../icons.js';
import { analyzePriority } from '../smart-engine.js';

export function renderReportForm(container, navigateTo, initialData = {}) {
  let selectedCategory = initialData.category || 'Electrical';
  let selectedPriority = initialData.priority || 'Medium';
  let isUserOverridden = false;
  let currentSmartResult = null;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div class="view-badge">
          ${Icons.report}
          <span>Central Campus Dispatch</span>
        </div>
        <h1 class="view-title">Report a Campus Issue</h1>
        <p class="view-subtitle">Submit facilities issues for immediate dispatch. The Smart Priority Engine analyzes your inputs to suggest optimal triage levels.</p>
      </div>

      <div class="view-header-actions">
        <button id="back-to-dashboard-btn" class="btn btn-secondary">
          ${Icons.dashboard}
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>

    <div class="report-container">
      <div class="report-main-column">
        <div class="card form-card">
          <form id="campus-report-form" novalidate>
            <!-- Issue Title -->
            <div class="form-group">
              <label for="issue-title" class="form-label required">Issue Title</label>
              <input type="text" id="issue-title" class="form-input" 
                     placeholder="e.g., Sparking socket in Lab 3 or Leaking pipe on 2nd floor" 
                     value="${escapeHtml(initialData.title || '')}" 
                     required maxlength="120" autocomplete="off">
              <span class="form-helper">Be concise and specific. Key terms trigger smart triage recommendations.</span>
              <div class="field-error" id="title-error">Please provide a descriptive title (at least 5 characters).</div>
            </div>

            <!-- Category Selector with Visual Tiles -->
            <div class="form-group">
              <label class="form-label required">Facility Category</label>
              <div class="category-tiles-grid" id="category-tiles-wrapper">
                ${CATEGORIES.map(cat => `
                  <button type="button" class="category-tile ${cat === selectedCategory ? 'selected' : ''}" data-cat="${cat}">
                    <span class="cat-tile-icon cat-${cat.toLowerCase().replace(/[^a-z]/g, '')}">
                      ${getCategoryIcon(cat)}
                    </span>
                    <span class="cat-tile-name">${cat}</span>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="issue-category" value="${selectedCategory}">
              <div class="field-error" id="category-error">Please select an issue category.</div>
            </div>

            <!-- Campus Location -->
            <div class="form-group">
              <label for="issue-location" class="form-label required">Campus Location</label>
              <input type="text" id="issue-location" class="form-input" 
                     placeholder="e.g., Central Library, 2nd Floor Reading Room or Hostel 3, Room 104" 
                     value="${escapeHtml(initialData.location || '')}" 
                     required maxlength="100">
              
              <!-- Quick preset chips -->
              <div class="preset-location-chips">
                <span class="preset-label">Quick select:</span>
                <button type="button" class="chip-btn" data-loc="Central Library, 2nd Floor">Central Library</button>
                <button type="button" class="chip-btn" data-loc="Engineering Block C, Room 302">Eng Block C</button>
                <button type="button" class="chip-btn" data-loc="Student Cafeteria & Food Court">Cafeteria</button>
                <button type="button" class="chip-btn" data-loc="Hostel 3, Ground Floor">Hostel 3</button>
                <button type="button" class="chip-btn" data-loc="Science Block B, Staircase">Science Block B</button>
              </div>
              <div class="field-error" id="location-error">Please specify the exact location where this issue occurred.</div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="issue-description" class="form-label required">Detailed Description</label>
              <textarea id="issue-description" class="form-textarea" rows="4" 
                        placeholder="Describe what is broken, visible hazards, noise, smell or how it affects students..." 
                        required>${escapeHtml(initialData.description || '')}</textarea>
              <div class="flex-between">
                <span class="form-helper">Detailed descriptions improve automated triage accuracy.</span>
                <span class="char-count" id="desc-char-count">0 / 500</span>
              </div>
              <div class="field-error" id="description-error">Please enter at least 15 characters describing the issue.</div>
            </div>

            <!-- LIVE SMART RECOMMENDATION BANNER -->
            <div class="smart-rec-box" id="smart-rec-banner" style="display: none;">
              <div class="smart-rec-header">
                <div class="flex-align gap-8">
                  <div class="smart-rec-icon">${Icons.sparkleSmall}</div>
                  <span class="smart-rec-label">Smart Priority Recommendation Engine</span>
                </div>
                <span class="smart-rec-confidence" id="smart-confidence-badge">94% Confidence</span>
              </div>

              <div class="smart-rec-body">
                <div class="smart-rec-main">
                  <h4 class="smart-rec-headline" id="smart-headline">High Priority Recommended</h4>
                  <p class="smart-rec-reason" id="smart-reason">Safety hazard identified in text keywords.</p>
                </div>
                <div class="smart-rec-keywords" id="smart-keywords-container">
                  <!-- keyword tags injected here -->
                </div>
              </div>

              <div class="smart-rec-footer">
                <span class="smart-override-note" id="smart-override-status">
                  ${Icons.info}
                  <span>Auto-applied to priority selector below. You can manually override at any time.</span>
                </span>
                <button type="button" id="smart-apply-btn" class="btn btn-sm btn-dark">
                  ${Icons.check}
                  <span>Apply Recommended Priority</span>
                </button>
              </div>
            </div>

            <!-- Priority Selector (Low, Medium, High) -->
            <div class="form-group">
              <div class="flex-between">
                <label class="form-label required">Priority Level</label>
                <span class="priority-override-indicator" id="priority-override-indicator" style="display: none;">
                  (User Overridden)
                </span>
              </div>

              <div class="priority-selector-row" id="priority-pills-row">
                <label class="priority-radio-card priority-card-low ${selectedPriority === 'Low' ? 'active' : ''}">
                  <input type="radio" name="priority" value="Low" ${selectedPriority === 'Low' ? 'checked' : ''}>
                  <div class="radio-content">
                    <span class="prio-title">Low Priority</span>
                    <span class="prio-desc">Cosmetic or minor inconvenience. Normal maintenance queue.</span>
                  </div>
                </label>

                <label class="priority-radio-card priority-card-medium ${selectedPriority === 'Medium' ? 'active' : ''}">
                  <input type="radio" name="priority" value="Medium" ${selectedPriority === 'Medium' ? 'checked' : ''}>
                  <div class="radio-content">
                    <span class="prio-title">Medium Priority</span>
                    <span class="prio-desc">Functional disruption for students. Resolution within 24-48 hrs.</span>
                  </div>
                </label>

                <label class="priority-radio-card priority-card-high ${selectedPriority === 'High' ? 'active' : ''}">
                  <input type="radio" name="priority" value="High" ${selectedPriority === 'High' ? 'checked' : ''}>
                  <div class="radio-content">
                    <span class="prio-title">High Priority</span>
                    <span class="prio-desc">Urgent safety hazard, fire/water risk or major campus outage.</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Optional Reporter Details -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label for="reporter-name" class="form-label">Reported By</label>
                <input type="text" id="reporter-name" class="form-input" 
                       placeholder="e.g., Alex Chen (Student / CS Dept)" 
                       value="${escapeHtml(initialData.reporterName || 'Alex Chen (Student)')}">
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions-bar">
              <button type="button" id="cancel-report-btn" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" id="submit-issue-btn" class="btn btn-primary btn-lg">
                ${Icons.report}
                <span>Submit Campus Issue</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Right Guidance Sidebar -->
      <div class="report-side-column">
        <div class="card guide-card">
          <div class="card-header">
            <h3 class="card-title text-sm">Campus Reporting Guidelines</h3>
          </div>
          <ul class="guide-list">
            <li>
              <strong>Immediate Safety Hazards:</strong> For sparking wires, gas smells, or active floods, select <em>High Priority</em> immediately.
            </li>
            <li>
              <strong>Accurate Location:</strong> Include building name, room number, or landmark to guide maintenance crews.
            </li>
            <li>
              <strong>Smart Recommendation:</strong> Our on-device NLP model scans your description and assists dispatch priority automatically.
            </li>
            <li>
              <strong>Tracking:</strong> After submission, monitor live ticket progress on the <em>My Reports</em> Kanban board.
            </li>
          </ul>
        </div>

        <div class="card sample-scenarios-card">
          <div class="card-header">
            <h3 class="card-title text-sm">Try Smart Recommendation Test Prompts</h3>
          </div>
          <p class="text-xs text-muted mb-12">Click any scenario to auto-fill and test the keyword analyzer:</p>
          <div class="scenario-buttons">
            <button type="button" class="btn-scenario" data-scenario="spark">
              ⚡ <strong>Dangerous Sparking</strong> (Triggers High)
            </button>
            <button type="button" class="btn-scenario" data-scenario="flood">
              💧 <strong>Corridor Pipe Burst</strong> (Triggers High)
            </button>
            <button type="button" class="btn-scenario" data-scenario="wifi">
              📶 <strong>Library Wi-Fi Down</strong> (Triggers Medium)
            </button>
            <button type="button" class="btn-scenario" data-scenario="chair">
              🪑 <strong>Squeaky Door Hinge</strong> (Triggers Low)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach elements
  const form = container.querySelector('#campus-report-form');
  const titleInput = container.querySelector('#issue-title');
  const descInput = container.querySelector('#issue-description');
  const locInput = container.querySelector('#issue-location');
  const categoryHidden = container.querySelector('#issue-category');
  const descCharCount = container.querySelector('#desc-char-count');
  const smartBanner = container.querySelector('#smart-rec-banner');
  const smartHeadline = container.querySelector('#smart-headline');
  const smartReason = container.querySelector('#smart-reason');
  const smartConfidence = container.querySelector('#smart-confidence-badge');
  const smartKeywords = container.querySelector('#smart-keywords-container');
  const smartApplyBtn = container.querySelector('#smart-apply-btn');
  const smartOverrideStatus = container.querySelector('#smart-override-status');
  const overrideIndicator = container.querySelector('#priority-override-indicator');
  const priorityRadios = container.querySelectorAll('input[name="priority"]');
  const priorityCards = container.querySelectorAll('.priority-radio-card');

  // Category tile selection
  const categoryTiles = container.querySelectorAll('.category-tile');
  categoryTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      categoryTiles.forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      selectedCategory = tile.dataset.cat;
      categoryHidden.value = selectedCategory;
      runSmartAnalysis();
    });
  });

  // Location preset chips
  container.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      locInput.value = btn.dataset.loc;
      locInput.focus();
    });
  });

  // Priority radio change
  priorityRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      selectedPriority = radio.value;
      updatePriorityCards();
      isUserOverridden = true;
      overrideIndicator.style.display = 'inline-block';
      if (smartOverrideStatus) {
        smartOverrideStatus.innerHTML = `${Icons.info} <span>User custom override active (${selectedPriority} Priority).</span>`;
      }
    });
  });

  function updatePriorityCards() {
    priorityCards.forEach(card => {
      const radio = card.querySelector('input[name="priority"]');
      if (radio.value === selectedPriority) {
        card.classList.add('active');
        radio.checked = true;
      } else {
        card.classList.remove('active');
      }
    });
  }

  // Real-time Smart Analysis Runner
  function runSmartAnalysis() {
    const titleVal = titleInput.value.trim();
    const descVal = descInput.value.trim();

    if (descCharCount) {
      descCharCount.textContent = `${descVal.length} / 500`;
    }

    if (!titleVal && !descVal) {
      smartBanner.style.display = 'none';
      return;
    }

    currentSmartResult = analyzePriority(titleVal, descVal, selectedCategory);

    smartBanner.style.display = 'block';
    smartHeadline.textContent = currentSmartResult.headline;
    smartReason.textContent = currentSmartResult.reason;
    smartConfidence.textContent = `${currentSmartResult.confidence}% Confidence`;
    
    // Style banner depending on priority
    smartBanner.className = `smart-rec-box smart-${currentSmartResult.priority.toLowerCase()}`;

    // Render keyword tags
    if (currentSmartResult.matches && currentSmartResult.matches.length > 0) {
      smartKeywords.innerHTML = currentSmartResult.matches.map(kw => `
        <span class="kw-tag">${kw}</span>
      `).join('');
    } else {
      smartKeywords.innerHTML = `<span class="kw-tag subtle">General Campus Report</span>`;
    }

    // Auto-select priority if user hasn't manually overridden yet
    if (!isUserOverridden) {
      selectedPriority = currentSmartResult.priority;
      updatePriorityCards();
      smartOverrideStatus.innerHTML = `${Icons.info} <span>Auto-applied: <strong>${currentSmartResult.priority} Priority</strong>. You can click another option below to override.</span>`;
    }
  }

  // Apply button
  if (smartApplyBtn) {
    smartApplyBtn.addEventListener('click', () => {
      if (currentSmartResult) {
        selectedPriority = currentSmartResult.priority;
        updatePriorityCards();
        isUserOverridden = false;
        overrideIndicator.style.display = 'none';
        smartOverrideStatus.innerHTML = `${Icons.check} <span>Recommendation applied: <strong>${selectedPriority} Priority</strong>.</span>`;
      }
    });
  }

  // Input listeners for live smart recommendation
  titleInput.addEventListener('input', runSmartAnalysis);
  descInput.addEventListener('input', runSmartAnalysis);

  // Scenario test buttons
  container.querySelectorAll('.btn-scenario').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.scenario;
      if (type === 'spark') {
        titleInput.value = 'Dangerous sparking and burning smell from power strip';
        descInput.value = 'Workstation socket is actively emitting sparks, burning plastic odor, and wire is exposed. Major fire hazard for lab.';
        locInput.value = 'Engineering Block C, Room 302';
        setCategory('Electrical');
      } else if (type === 'flood') {
        titleInput.value = 'Severe water pipe burst flooding restroom';
        descInput.value = 'Main pipe burst under the sink gushing water across the corridor. Slippery hazard and ceiling water damage.';
        locInput.value = 'Hostel 3, Ground Floor';
        setCategory('Plumbing');
      } else if (type === 'wifi') {
        titleInput.value = 'Wi-Fi completely down across 2nd floor';
        descInput.value = 'Library access points are disconnected. Students cannot download course materials or study.';
        locInput.value = 'Central Library, 2nd Floor';
        setCategory('Wi-Fi');
      } else if (type === 'chair') {
        titleInput.value = 'Squeaky study room door hinge';
        descInput.value = 'The door hinges squeak loudly every time someone opens the door. Needs routine oiling or lubrication.';
        locInput.value = 'Main Library, Silent Room 4';
        setCategory('Infrastructure');
      }
      isUserOverridden = false;
      overrideIndicator.style.display = 'none';
      runSmartAnalysis();
    });
  });

  function setCategory(cat) {
    selectedCategory = cat;
    categoryHidden.value = cat;
    categoryTiles.forEach(t => {
      if (t.dataset.cat === cat) t.classList.add('selected');
      else t.classList.remove('selected');
    });
  }

  // Back button
  const backBtn = container.querySelector('#back-to-dashboard-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('dashboard'));

  const cancelBtn = container.querySelector('#cancel-report-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => navigateTo('dashboard'));

  // Form Submission & Validation
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    // Reset errors
    container.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
    container.querySelectorAll('.form-input, .form-textarea').forEach(el => el.classList.remove('invalid'));

    const title = titleInput.value.trim();
    const location = locInput.value.trim();
    const description = descInput.value.trim();
    const reporterName = container.querySelector('#reporter-name').value.trim();

    if (!title || title.length < 5) {
      isValid = false;
      titleInput.classList.add('invalid');
      container.querySelector('#title-error').style.display = 'block';
    }

    if (!location || location.length < 3) {
      isValid = false;
      locInput.classList.add('invalid');
      container.querySelector('#location-error').style.display = 'block';
    }

    if (!description || description.length < 10) {
      isValid = false;
      descInput.classList.add('invalid');
      container.querySelector('#description-error').style.display = 'block';
    }

    if (!selectedCategory) {
      isValid = false;
      container.querySelector('#category-error').style.display = 'block';
    }

    if (!isValid) return;

    // Add to Store
    const smartAnalysis = analyzePriority(title, description, selectedCategory);
    const newIssue = store.addIssue({
      title,
      description,
      location,
      category: selectedCategory,
      priority: selectedPriority,
      reporterName: reporterName || 'Alex Chen (Student)',
      smartDetected: smartAnalysis.matches.length > 0,
      smartReason: smartAnalysis.reason,
      tags: [selectedCategory, ...(smartAnalysis.matches || []).slice(0, 2)]
    });

    // Show toast & redirect
    showToast(`Issue ${newIssue.id} submitted successfully! Facilities team notified.`, 'success');
    navigateTo('kanban');
  });

  // Run initial analysis if preset
  if (initialData.scenario) {
    const targetScenarioBtn = container.querySelector(`.btn-scenario[data-scenario="${initialData.scenario}"]`);
    if (targetScenarioBtn) targetScenarioBtn.click();
  } else if (initialData.title || initialData.description) {
    runSmartAnalysis();
  }
}

export function showToast(message, type = 'info') {
  const existing = document.querySelector('.cf-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `cf-toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'success' ? Icons.check : Icons.info}</span>
      <span class="toast-text">${escapeHtml(message)}</span>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
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
