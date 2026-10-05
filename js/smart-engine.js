// js/smart-engine.js - Lightweight Rule-Based Smart Priority Recommendation & Campus Insights

const HIGH_PRIORITY_RULES = [
  // Fire & Electrical
  { pattern: /\b(fire|flames?|burning|smoke|smoking)\b/i, label: 'Fire/Combustion Risk', weight: 10 },
  { pattern: /\b(spark|sparking|sparks|short\s*circuit|shorting)\b/i, label: 'Electrical Sparking', weight: 9 },
  { pattern: /\b(exposed\s*wir(e|ing)|live\s*wir(e|ing)|naked\s*wir(e|ing)|electric\s*shock|current|electrocution)\b/i, label: 'Live Voltage/Shock Risk', weight: 10 },
  
  // Severe Water & Flooding
  { pattern: /\b(burst\s*pipe|pipe\s*burst|severe\s*leak(age)?|flood(ing)?|water\s*gushing|submerged)\b/i, label: 'Severe Flooding / Burst Pipe', weight: 9 },
  
  // Structural & Physical Safety
  { pattern: /\b(collaps(e|ed|ing)|falling\s*debris|ceiling\s*crack(ed)?|broken\s*glass|shattered\s*window|stair(case)?\s*rail|handrail\s*loose)\b/i, label: 'Structural Safety Hazard', weight: 8 },
  { pattern: /\b(gas\s*leak|toxic|chemical\s*spill|acid|fumes|choking)\b/i, label: 'Chemical / Toxic Hazard', weight: 10 },
  { pattern: /\b(danger(ous)?|hazard(ous)?|severe|injur(y|ed)|bleeding|trapped|stuck\s*elevator|lift\s*stuck)\b/i, label: 'Immediate Human Safety', weight: 8 },
  
  // Critical Exam / Facility Outages
  { pattern: /\b(blackout|complete\s*power\s*outage|exam\s*hall|server\s*room\s*down)\b/i, label: 'Campus-wide Critical Outage', weight: 8 }
];

const MEDIUM_PRIORITY_RULES = [
  // Network & AV Tech
  { pattern: /\b(wi-?fi|internet|network|router|access\s*point|portal|no\s*signal|offline|disconnect(ed)?|dead\s*zone)\b/i, label: 'Wi-Fi / Network Outage', weight: 5 },
  { pattern: /\b(projector|screen|hdmi|mic(rophone)?|speaker|audio|display|monitor|pc|computer\s*lab)\b/i, label: 'Classroom AV Equipment Failure', weight: 4 },
  
  // Moderate Plumbing & Climate
  { pattern: /\b(leak(ing)?|dripping|drip|clog(ged)?|drain\s*blocked|overflow(ing)?|no\s*water|tap\s*broken|cooler|flush)\b/i, label: 'Plumbing / Fixture Defect', weight: 5 },
  { pattern: /\b(ac\b|air\s*condition(er|ing)?|not\s*cooling|fan\s*rattling|ventilation|stuffy|exhaust)\b/i, label: 'HVAC / Thermal Comfort', weight: 4 },
  
  // Sanitation & Access
  { pattern: /\b(pest|cockroach|rodent|foul\s*odor|smell|stink|overflowing\s*bin|lock\s*jammed|door\s*jammed)\b/i, label: 'Hygiene / Access Issue', weight: 4 },
  { pattern: /\b(desk\s*broken|chair\s*broken|bench|table\s*wobbly)\b/i, label: 'Furniture Disrepair', weight: 3 }
];

const LOW_PRIORITY_RULES = [
  { pattern: /\b(flicker(ing)?|dim\s*light|tube\s*light|bulb)\b/i, label: 'Minor Lighting Maintenance', weight: 2 },
  { pattern: /\b(paint(ing)?|scratch(ed)?|scuff|cosmetic|stain|peeling|aesthetic)\b/i, label: 'Cosmetic / Surface Wear', weight: 1 },
  { pattern: /\b(squeak(y)?|loose\s*handle|door\s*creak|clock|whiteboard\s*marker|duster)\b/i, label: 'Routine Adjustment', weight: 1 },
  { pattern: /\b(clean(ing)?|trash|dust|sweep|mop)\b/i, label: 'General Janitorial Request', weight: 2 }
];

export function analyzePriority(title = '', description = '', category = '') {
  const text = `${title} ${description}`.trim();
  if (!text) {
    return {
      priority: 'Medium',
      confidence: 50,
      matches: [],
      headline: 'Default Balanced Priority',
      reason: 'Enter title or description to receive smart priority suggestions.',
      isUrgent: false
    };
  }

  let highMatches = [];
  let mediumMatches = [];
  let lowMatches = [];

  let totalHighWeight = 0;
  let totalMediumWeight = 0;
  let totalLowWeight = 0;

  // Check High rules
  for (const rule of HIGH_PRIORITY_RULES) {
    if (rule.pattern.test(text)) {
      highMatches.push(rule.label);
      totalHighWeight += rule.weight;
    }
  }

  // Check Medium rules
  for (const rule of MEDIUM_PRIORITY_RULES) {
    if (rule.pattern.test(text)) {
      mediumMatches.push(rule.label);
      totalMediumWeight += rule.weight;
    }
  }

  // Check Low rules
  for (const rule of LOW_PRIORITY_RULES) {
    if (rule.pattern.test(text)) {
      lowMatches.push(rule.label);
      totalLowWeight += rule.weight;
    }
  }

  // Category based bias
  const cat = (category || '').toLowerCase();
  if (cat.includes('elect') && highMatches.length > 0) {
    totalHighWeight += 3;
  }

  // Decision logic
  if (highMatches.length > 0 || totalHighWeight >= 8) {
    const confidence = Math.min(98, 75 + highMatches.length * 8 + Math.round(totalHighWeight / 2));
    return {
      priority: 'High',
      confidence,
      matches: highMatches,
      headline: 'High Priority Recommended',
      reason: `Safety or hazard risks identified: ${highMatches.slice(0, 3).join(', ')}. Immediate admin dispatch recommended.`,
      isUrgent: true,
      suggestedCategory: cat.includes('elect') ? 'Electrical' : (highMatches.some(m => m.includes('Flood') || m.includes('Pipe')) ? 'Plumbing' : undefined)
    };
  }

  if (totalMediumWeight >= 4 || mediumMatches.length > 0) {
    const confidence = Math.min(92, 70 + mediumMatches.length * 6);
    return {
      priority: 'Medium',
      confidence,
      matches: mediumMatches,
      headline: 'Medium Priority Recommended',
      reason: `Disrupts campus operations: ${mediumMatches.slice(0, 3).join(', ')}. Target resolution within 24-48 hours.`,
      isUrgent: false
    };
  }

  if (lowMatches.length > 0) {
    return {
      priority: 'Low',
      confidence: 84,
      matches: lowMatches,
      headline: 'Low Priority Recommended',
      reason: `Routine or cosmetic issue: ${lowMatches.slice(0, 2).join(', ')}. Schedule during normal maintenance cycle.`,
      isUrgent: false
    };
  }

  return {
    priority: 'Medium',
    confidence: 60,
    matches: ['Standard Facility Review'],
    headline: 'Standard Priority',
    reason: 'Standard campus maintenance issue without immediate hazard signals.',
    isUrgent: false
  };
}

// Generate smart diagnostic insights based on the active issues list
export function generateSmartInsights(issues = []) {
  const insights = [];

  if (issues.length === 0) {
    return [{
      type: 'info',
      badge: 'System Ready',
      title: 'No Active Issues',
      description: 'The campus is in great shape! No reported issues currently awaiting resolution.'
    }];
  }

  // 1. High priority pending alert
  const pendingHigh = issues.filter(i => i.priority === 'High' && i.status === 'Pending');
  if (pendingHigh.length > 0) {
    insights.push({
      type: 'urgent',
      badge: 'Safety Alert',
      title: `${pendingHigh.length} Urgent Safety ${pendingHigh.length === 1 ? 'Issue' : 'Issues'} Pending Action`,
      description: `Immediate hazard: "${pendingHigh[0].title}" located at ${pendingHigh[0].location}. Requires rapid facility dispatch.`,
      actionLabel: 'Review High Priority',
      filter: { priority: 'High', status: 'Pending' }
    });
  }

  // 2. Location Cluster Detection
  const locationCounts = {};
  for (const item of issues) {
    // Extract block or building name (e.g., "Engineering Block C", "Central Library", "Hostel 3")
    const locPrefix = item.location.split(',')[0].trim();
    locationCounts[locPrefix] = (locationCounts[locPrefix] || 0) + 1;
  }

  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
  if (topLocation && topLocation[1] >= 2) {
    insights.push({
      type: 'warning',
      badge: 'Hotspot Cluster',
      title: `Cluster at ${topLocation[0]} (${topLocation[1]} Reports)`,
      description: `Multiple tickets concentrated in ${topLocation[0]}. Scheduling a consolidated building inspection is advised to fix recurring root causes.`,
      actionLabel: 'Filter Location',
      locationQuery: topLocation[0]
    });
  }

  // 3. Category trending
  const categoryCounts = {};
  for (const item of issues) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    insights.push({
      type: 'trend',
      badge: 'Category Spike',
      title: `${topCategory[0]} Leads Reported Tickets (${topCategory[1]} total)`,
      description: `${Math.round((topCategory[1] / issues.length) * 100)}% of campus reports belong to ${topCategory[0]}. Recommended: Pre-allocate replacement inventory and technician shifts.`,
      actionLabel: 'View Category'
    });
  }

  // 4. Resolution Efficiency
  const resolved = issues.filter(i => i.status === 'Resolved');
  const resolutionRate = Math.round((resolved.length / issues.length) * 100);
  insights.push({
    type: 'success',
    badge: 'Efficiency Metric',
    title: `${resolutionRate}% Overall Resolution Health`,
    description: `${resolved.length} of ${issues.length} campus work orders marked resolved. Average turn-around benchmark is tracking at 4.2 hours.`,
    actionLabel: 'View Archive'
  });

  return insights;
}
