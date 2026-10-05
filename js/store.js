// js/store.js - LocalStorage data persistence, seed management & reactivity

const STORAGE_KEY = 'campusfix_issues_v2';
const ROLE_KEY = 'campusfix_active_role_v1';

export const CATEGORIES = [
  'Electrical',
  'Wi-Fi',
  'Cleanliness',
  'Plumbing',
  'Equipment',
  'Infrastructure'
];

export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Pending', 'In Progress', 'Resolved'];

export const SEED_ISSUES = [
  {
    id: 'CF-2041',
    title: 'Sparking switchboard and exposed wiring near Lab 3',
    description: 'There is visible sparking and a burning smell coming from the main 230V socket near workstation 4. Urgent attention required before morning lab sessions to avoid fire hazard.',
    location: 'Engineering Block C, Room 302',
    category: 'Electrical',
    priority: 'High',
    status: 'Pending',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    reporterName: 'Rahul Sharma (CS Dept)',
    tags: ['Safety Hazard', 'Lab Block'],
    smartDetected: true,
    smartReason: 'Detected high-risk keywords: sparking, exposed wiring, burning, fire hazard'
  },
  {
    id: 'CF-2040',
    title: 'Severe water pipe burst flooding 1st floor corridor',
    description: 'Main fresh water supply pipe has burst at the connector joint. Water is rapidly pooling near the emergency exit stairwell creating an immediate slip hazard.',
    location: 'Hostel 3, Ground Floor Corridor',
    category: 'Plumbing',
    priority: 'High',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    reporterName: 'Aisha Patel (Hostel Prefect)',
    tags: ['Flooding', 'Hostel'],
    assignedTo: 'Campus Maintenance Team #2',
    smartDetected: true,
    smartReason: 'Detected high-risk keywords: burst, flooding, water pooling, hazard'
  },
  {
    id: 'CF-2039',
    title: 'Main library 2nd floor Wi-Fi dead zone during exams',
    description: 'Access point AP-LIB-04 has gone offline or dropped signal. Over 50 students studying for midterms are unable to access campus portal and reference repositories.',
    location: 'Central Library, Level 2 Reading Hall',
    category: 'Wi-Fi',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    reporterName: 'Devika Roy',
    tags: ['Connectivity', 'Library'],
    assignedTo: 'IT Network Ops',
    smartDetected: true,
    smartReason: 'Detected operational keywords: wifi dead zone, access point offline'
  },
  {
    id: 'CF-2038',
    title: 'Overhead ceiling projector HDMI port damaged & bent',
    description: 'The wall-mounted HDMI interface port is physically loose and bent. Projection flickers black intermittently during guest lectures.',
    location: 'Lecture Hall 4A (Audi-1)',
    category: 'Equipment',
    priority: 'Medium',
    status: 'Pending',
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    reporterName: 'Prof. S. Narang',
    tags: ['Audiovisual', 'Lecture Hall'],
    smartDetected: true,
    smartReason: 'Detected equipment keywords: projector, hdmi port damaged'
  },
  {
    id: 'CF-2037',
    title: 'Cafeteria recycling waste bins overflow and beverage spills',
    description: 'Beverage station sorting bins are completely overflowing with paper cups and sticky soda residue spilling across the walkway.',
    location: 'Student Activity Center, Food Court',
    category: 'Cleanliness',
    priority: 'Low',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    resolutionNote: 'Housekeeping dispatched team; emptied 4 bins, sanitized tiled floor and placed additional 120L high-capacity bin.',
    reporterName: 'Siddharth Jain',
    tags: ['Sanitation', 'Cafeteria'],
    smartDetected: false
  },
  {
    id: 'CF-2036',
    title: 'Staircase handrail loose and wobbling dangerously',
    description: 'The steel bracket fixing the handrail to the concrete wall on the second flight has broken loose. Students leaning on it could lose balance.',
    location: 'Academic Block A, West Stairwell',
    category: 'Infrastructure',
    priority: 'High',
    status: 'Pending',
    createdAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    reporterName: 'Tanvi Mehta',
    tags: ['Structural', 'Safety'],
    smartDetected: true,
    smartReason: 'Detected safety keywords: handrail loose, wobbling dangerously'
  },
  {
    id: 'CF-2035',
    title: 'Flickering tube light buzzing loudly in study lounge',
    description: 'Fluorescent lamp in quiet study lounge flickers constantly and makes high-pitched ballast buzzing noise.',
    location: 'Girls Hostel Block B, Study Lounge',
    category: 'Electrical',
    priority: 'Low',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    resolutionNote: 'Replaced buzzing choke and upgraded fixture to 20W energy-efficient daylight LED tube.',
    reporterName: 'Ananya Sen',
    tags: ['Lighting', 'Hostel'],
    smartDetected: false
  },
  {
    id: 'CF-2034',
    title: 'Water cooler drain pipe blocked and leaking onto lobby floor',
    description: 'Cooler drain tray overflows when used, creating a slick puddle on polished marble right in front of the elevator.',
    location: 'Management Building, 3rd Floor Lobby',
    category: 'Plumbing',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    resolutionNote: 'Cleared pipe blockage, cleared mineral sediment and replaced silicone drip line.',
    reporterName: 'Karan Verma',
    tags: ['Plumbing', 'Admin Block'],
    smartDetected: true,
    smartReason: 'Detected maintenance keywords: leaking, puddle, cooler drain blocked'
  }
];

class IssueStore {
  constructor() {
    this.listeners = new Set();
    this.issues = [];
    this.role = 'admin'; // 'student' or 'admin'
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.issues = JSON.parse(stored);
      } else {
        this.issues = [...SEED_ISSUES];
        this.save();
      }

      const savedRole = localStorage.getItem(ROLE_KEY);
      if (savedRole && (savedRole === 'student' || savedRole === 'admin')) {
        this.role = savedRole;
      }
    } catch (e) {
      console.warn('Error reading from localStorage, fallback to seed data', e);
      this.issues = [...SEED_ISSUES];
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.issues));
    } catch (e) {
      console.error('Failed to save issues to localStorage', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.issues, this.getStats());
      } catch (err) {
        console.error('Error in store listener', err);
      }
    }
  }

  getIssues() {
    return [...this.issues];
  }

  getIssueById(id) {
    return this.issues.find(item => item.id === id);
  }

  addIssue({ title, description, location, category, priority, reporterName, smartDetected, smartReason, tags }) {
    // Generate next CF- ID
    const count = this.issues.length + 1;
    const nextNum = 2040 + count;
    const newId = `CF-${nextNum}`;

    const newIssue = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category: category || 'Infrastructure',
      priority: priority || 'Medium',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      reporterName: reporterName ? reporterName.trim() : 'Alex Chen (Student)',
      smartDetected: !!smartDetected,
      smartReason: smartReason || '',
      tags: tags || [category]
    };

    this.issues.unshift(newIssue);
    this.save();
    return newIssue;
  }

  updateIssue(id, updates) {
    const idx = this.issues.findIndex(item => item.id === id);
    if (idx !== -1) {
      this.issues[idx] = { ...this.issues[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.issues[idx];
    }
    return null;
  }

  updateIssueStatus(id, newStatus, note = '') {
    const idx = this.issues.findIndex(item => item.id === id);
    if (idx !== -1) {
      const issue = this.issues[idx];
      issue.status = newStatus;
      issue.updatedAt = new Date().toISOString();
      if (newStatus === 'Resolved') {
        issue.resolvedAt = new Date().toISOString();
        if (note) issue.resolutionNote = note;
      }
      this.save();
      return issue;
    }
    return null;
  }

  deleteIssue(id) {
    const initialLength = this.issues.length;
    this.issues = this.issues.filter(item => item.id !== id);
    if (this.issues.length !== initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  resetToSeed() {
    this.issues = JSON.parse(JSON.stringify(SEED_ISSUES));
    this.save();
  }

  getRole() {
    return this.role;
  }

  setRole(newRole) {
    if (newRole === 'student' || newRole === 'admin') {
      this.role = newRole;
      localStorage.setItem(ROLE_KEY, newRole);
      this.notify();
    }
  }

  getStats() {
    const total = this.issues.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let highPriority = 0;

    const byCategory = {
      Electrical: 0,
      'Wi-Fi': 0,
      Cleanliness: 0,
      Plumbing: 0,
      Equipment: 0,
      Infrastructure: 0
    };

    const byPriority = {
      High: 0,
      Medium: 0,
      Low: 0
    };

    for (const item of this.issues) {
      if (item.status === 'Pending') pending++;
      else if (item.status === 'In Progress') inProgress++;
      else if (item.status === 'Resolved') resolved++;

      if (item.priority === 'High') highPriority++;
      if (byPriority[item.priority] !== undefined) {
        byPriority[item.priority]++;
      }

      if (byCategory[item.category] !== undefined) {
        byCategory[item.category]++;
      } else {
        byCategory[item.category] = 1;
      }
    }

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      resolved,
      highPriority,
      resolutionRate,
      byCategory,
      byPriority
    };
  }
}

export const store = new IssueStore();
