/**
 * Smart job description parser — extracts structured sections and performs
 * resume matching using the About Me knowledge base.
 */

export interface ParsedJob {
  requirements: string[];
  responsibilities: string[];
  preferred: string[];
  companyInfo: string;
  compensation: string;
  keySkills: string[]; // Extracted skill/tool keywords
}

const SECTION_PATTERNS: Record<string, RegExp[]> = {
  requirements: [
    /^(?:requirements|qualifications|what you.?ll need|what we.?re looking for|must have|minimum qualifications|what makes you a great fit|technical proficiency|about you)/i,
    /^(?:you have|you bring|your background|skills? (?:&|and) experience|key requirements)/i,
  ],
  responsibilities: [
    /^(?:responsibilities|what you.?ll do|what you.?ll be doing|the role|job description|about the role|in this role|the opportunity|your impact)/i,
    /^(?:you will|day to day|key responsibilities|what you.?ll own|areas of focus)/i,
  ],
  preferred: [
    /^(?:preferred|nice to have|bonus|ideal|plus|desired|additionally|it.?s a plus|bonus points|extra credit)/i,
    /^(?:bonus if you|you.?ll thrive|preferred qualifications|standout candidates)/i,
  ],
  company: [
    /^(?:about the company|about us|who we are|company overview|about \w+|our mission)/i,
  ],
  compensation: [
    /^(?:compensation|salary|pay range|benefits|perks|total rewards|what we offer)/i,
  ],
};

// Common GTM/tech skill keywords to extract
const SKILL_KEYWORDS = [
  // CRM & GTM
  'salesforce', 'hubspot', 'marketo', 'outreach', 'salesloft', 'gong', 'clari',
  'leandata', 'zoominfo', 'apollo', '6sense', 'clearbit', 'clay', 'customer.io',
  // Dev
  'next.js', 'nextjs', 'react', 'typescript', 'javascript', 'node.js', 'nodejs',
  'python', 'sql', 'graphql', 'rest api', 'webhook',
  // AI
  'openai', 'anthropic', 'claude', 'gpt', 'llm', 'ai sdk', 'rag',
  'vector search', 'embeddings', 'prompt engineering', 'ai agent', 'multi-agent',
  'cursor', 'claude code', 'github copilot', 'v0',
  // Data
  'snowflake', 'bigquery', 'databricks', 'postgresql', 'redis', 'supabase',
  'dbt', 'data warehouse', 'etl', 'retl',
  // Infra & tools
  'vercel', 'aws', 'gcp', 'google cloud', 'docker', 'kubernetes',
  'github actions', 'ci/cd', 'terraform',
  // Middleware
  'zapier', 'tray', 'make', 'n8n', 'workato', 'temporal', 'airflow',
  'hightouch', 'polytomic', 'rudderstack', 'segment',
  // Salesforce specific
  'apex', 'lwc', 'lightning web components', 'visualforce', 'sfdx', 'soql',
  'cpq', 'field service',
];

export function parseJobDescription(description: string): ParsedJob {
  const result: ParsedJob = {
    requirements: [],
    responsibilities: [],
    preferred: [],
    companyInfo: '',
    compensation: '',
    keySkills: [],
  };

  // Split into lines and clean
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  let currentSection = '';

  for (const line of lines) {
    // Check if line is a section header
    let isHeader = false;
    for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
      if (patterns.some(p => p.test(line))) {
        currentSection = section;
        isHeader = true;
        break;
      }
    }
    if (isHeader) continue;

    // Clean bullet points
    const bullet = line.replace(/^[-•·*▪▸►→]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
    if (!bullet || bullet.length < 5) continue;

    switch (currentSection) {
      case 'requirements':
        result.requirements.push(bullet);
        break;
      case 'responsibilities':
        result.responsibilities.push(bullet);
        break;
      case 'preferred':
        result.preferred.push(bullet);
        break;
      case 'company':
        result.companyInfo += (result.companyInfo ? ' ' : '') + bullet;
        break;
      case 'compensation':
        result.compensation += (result.compensation ? '\n' : '') + bullet;
        break;
    }
  }

  // Extract salary if not found in sections
  if (!result.compensation) {
    const salaryMatch = description.match(/\$[\d,]+(?:k)?(?:\s*[-–—to]\s*\$[\d,]+(?:k)?)?(?:\s*(?:per year|annually|\/year|\/yr|base|USD))?/gi);
    if (salaryMatch) result.compensation = salaryMatch.join('; ');
  }

  // Extract key skills mentioned
  const descLower = description.toLowerCase();
  result.keySkills = SKILL_KEYWORDS.filter(skill =>
    descLower.includes(skill.toLowerCase())
  );

  return result;
}

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedAboutMe: Array<{ topic: string; proficiency: string; details: string }>;
  gapSkills: string[]; // Skills in job but not in resume or about-me
  tailoringTips: string[];
}

export function analyzeMatch(
  jobSkills: string[],
  resumeSkills: string[],
  aboutMe: Array<{ topic: string; details: string; proficiency: string | null }>,
  jobDescription: string,
): MatchResult {
  const descLower = jobDescription.toLowerCase();
  const resumeLower = resumeSkills.map(s => s.toLowerCase());
  const aboutMeTopics = aboutMe.map(a => a.topic.toLowerCase());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const matchedAboutMe: MatchResult['matchedAboutMe'] = [];
  const gapSkills: string[] = [];
  const tailoringTips: string[] = [];

  for (const skill of jobSkills) {
    const skillLower = skill.toLowerCase();

    // Check resume
    const inResume = resumeLower.some(r => r.includes(skillLower) || skillLower.includes(r));

    // Check about-me
    const aboutEntry = aboutMe.find(a =>
      a.topic.toLowerCase().includes(skillLower) || skillLower.includes(a.topic.toLowerCase())
    );

    if (inResume) {
      matchedSkills.push(skill);
    } else if (aboutEntry) {
      matchedAboutMe.push({
        topic: aboutEntry.topic,
        proficiency: aboutEntry.proficiency || 'unknown',
        details: aboutEntry.details,
      });
      if (aboutEntry.proficiency === 'expert' || aboutEntry.proficiency === 'proficient') {
        tailoringTips.push(`Add "${aboutEntry.topic}" to resume — you're ${aboutEntry.proficiency} but it's not on your current resume`);
      } else if (aboutEntry.proficiency === 'familiar' || aboutEntry.proficiency === 'learning') {
        tailoringTips.push(`"${aboutEntry.topic}" is mentioned — you're ${aboutEntry.proficiency}. Consider highlighting related experience.`);
      }
    } else {
      gapSkills.push(skill);
      missingSkills.push(skill);
    }
  }

  // Score: matched from resume (full points) + matched from about-me (partial) / total
  const total = jobSkills.length || 1;
  const resumePoints = matchedSkills.length;
  const aboutMePoints = matchedAboutMe.filter(a => a.proficiency === 'expert' || a.proficiency === 'proficient').length * 0.8;
  const aboutMeFamiliar = matchedAboutMe.filter(a => a.proficiency === 'familiar' || a.proficiency === 'learning').length * 0.4;
  const score = Math.min(100, Math.round(((resumePoints + aboutMePoints + aboutMeFamiliar) / total) * 100));

  // Generate additional tailoring tips
  if (gapSkills.length > 0 && gapSkills.length <= 3) {
    tailoringTips.push(`Only ${gapSkills.length} gap skill(s): ${gapSkills.join(', ')}. Consider addressing in cover letter.`);
  }

  return { score, matchedSkills, missingSkills, matchedAboutMe, gapSkills, tailoringTips };
}
