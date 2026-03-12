import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'job-tracker.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    url TEXT,
    original_description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    location TEXT,
    remote_type TEXT, -- remote, hybrid, onsite
    status TEXT DEFAULT 'Saved', -- Saved, Applied, Interview, Offer, Rejected, Withdrawn
    date_found TEXT DEFAULT (date('now')),
    date_applied TEXT,
    notes TEXT,
    -- AI parsed fields
    parsed_requirements TEXT, -- JSON array
    parsed_responsibilities TEXT, -- JSON array
    parsed_preferred TEXT, -- JSON array
    parsed_company_info TEXT,
    parsed_compensation TEXT,
    parsed_match_score INTEGER, -- 0-100
    parsed_match_analysis TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resume_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_type TEXT NOT NULL, -- summary, experience, skills, education, certifications, projects, community, contact
    section_order INTEGER DEFAULT 0,
    title TEXT,
    content TEXT NOT NULL, -- JSON
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS job_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'general', -- general, interview, followup
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  -- Tailored resume versions per job
  CREATE TABLE IF NOT EXISTS resume_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    version_name TEXT NOT NULL,
    sections TEXT NOT NULL, -- Full JSON of all resume sections (snapshot)
    tailoring_notes TEXT, -- What was changed and why
    page_break_before TEXT DEFAULT 'certifications', -- Which section starts page 2
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  -- About Me knowledge base — things Warren tells us about his experience
  CREATE TABLE IF NOT EXISTS about_me (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL, -- tools, skills, experience, preferences, strengths
    topic TEXT NOT NULL, -- e.g. "Snowflake", "Team leadership", "Python"
    details TEXT NOT NULL, -- What Warren said about it
    proficiency TEXT, -- expert, proficient, familiar, learning, none
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Check if resume is seeded
const resumeCount = db.prepare('SELECT COUNT(*) as count FROM resume_sections').get() as { count: number };
if (resumeCount.count === 0) {
  seedResume(db);
}

function seedResume(db: Database.Database) {
  const insert = db.prepare('INSERT INTO resume_sections (section_type, section_order, title, content) VALUES (?, ?, ?, ?)');

  const seed = db.transaction(() => {
    insert.run('contact', 0, 'Contact Information', JSON.stringify({
      name: 'Warren Walters',
      location: 'North Carolina, United States',
      email: 'warren@walters954.com',
      phone: '954-464-6941',
      linkedin: 'in/walters954',
      github: 'github.com/walters954',
    }));

    insert.run('summary', 1, 'Summary', JSON.stringify({
      text: 'Software Engineer with 10+ years building revenue systems and optimizing GTM technology infrastructure. Built scalable automation platforms serving 400+ users with integrated CRM, marketing automation, and data pipeline solutions, reducing manual processes. Led cross-functional teams of developers while managing end-to-end system integrations across sales, marketing, and customer success operations. Salesforce MVP with deep expertise in API integrations, workflow automation, and translating complex business requirements into technical solutions that accelerate revenue growth and operational efficiency.',
    }));

    insert.run('experience', 2, 'Experience', JSON.stringify([
      {
        company: 'Vercel',
        title: 'GTM Systems Engineer (Contract)',
        startDate: 'November 2025',
        endDate: 'Present',
        bullets: [
          'Ship daily code improvements to GTM System\'s infrastructure using Vercel AI Cloud, Next.js, and AI SDK to automate revenue workflows across teams.',
          'Partner with Sales, Marketing, and Success teams to identify process bottlenecks and ship AI-powered solutions that streamline operations and drive revenue.',
          'Build and deploy AI-driven workflows using Next.js, v0, and AI SDK to automate repetitive GTM tasks, reducing manual effort across cross-functional teams.',
          'Administer and develop on a 1,600+ object Salesforce org, building Apex test classes, custom metadata types, and validation rules.',
        ],
      },
      {
        company: 'Cloud Code Academy',
        title: 'Founder/GTM Engineer',
        startDate: 'May 2023',
        endDate: 'November 2025',
        bullets: [
          'Built and scaled developer training organization serving 400+ Salesforce professionals across 15+ countries, generating $150K+ annual revenue.',
          'Led cross-functional team of 8 instructors, marketing, sales and support.',
          'Trained 80+ students to complete certification training, development programs, or secure new technology opportunities.',
          'Implemented scalable learning management system supporting 3+ concurrent programs with automated tracking and progress monitoring capabilities.',
        ],
      },
      {
        company: 'Blackthorn.io',
        title: 'Senior Salesforce Engineer',
        startDate: 'September 2022',
        endDate: 'July 2024',
        bullets: [
          'Led Events AppExchange application roadmap delivering customer-requested features by collaborating with product and engineering teams.',
          'Optimized CI/CD & DevOps deployment processes decreasing manual release interventions and enabling faster feature delivery to enterprise customers.',
          'Enabled team adoption of emerging technologies including GitHub Copilot/AI Coding and Salesforce platform updates through hands-on training sessions.',
        ],
      },
      {
        company: 'Ad Victoriam Solutions',
        title: 'Engineering Manager',
        startDate: 'September 2019',
        endDate: 'April 2022',
        bullets: [
          'Led 10+ developers across multiple time zones, achieving an increase in on-time delivery.',
          'Supported pre-sales activities by creating proof-of-concepts, solution documentation, and technical presentations for prospective clients.',
          'Collaborated with sales and delivery teams on pre-sales to post-sales handoff, ensuring smooth project transitions and alignment with client expectations.',
        ],
      },
      {
        company: 'Various',
        title: 'Salesforce Engineer',
        startDate: 'August 2015',
        endDate: 'September 2019',
        bullets: [
          'fullOpp: Delivered Salesforce solutions spanning CPQ, Field Service Lightning, and custom integrations for 15+ client orgs.',
          'Nearpod: Developed and maintained Salesforce platform using Apex, LWC, Visualforce for 100K+ education users.',
          'Sheridan Healthcare: Developed Apex classes, triggers supporting operations for 500+ physicians.',
          'Ryder: Improved user adoption by creating workflows, custom pages and validation rules.',
        ],
      },
    ]));

    insert.run('skills', 3, 'Skills', JSON.stringify({
      categories: [
        { name: 'Development', skills: ['Apex', 'Lightning Web Components', 'JavaScript', 'Node.js', 'Next.js', 'React', 'TypeScript', 'Vercel AI/Workflows/Sandbox', 'Webhooks'] },
        { name: 'Developer Tools', skills: ['Cursor', 'Claude Code', 'AI Skills/Hooks', 'AI APIs (OpenAI, Anthropic, Vercel AI Gateway)', 'v0'] },
        { name: 'DevOps/DX', skills: ['Git/GitHub Actions', 'CI/CD pipelines', 'Jira/Confluence/Bitbucket APIs', 'Vercel Platform', 'Postman', 'Automated testing'] },
        { name: 'GTM Systems', skills: ['Salesforce (Admin + SFDX)', 'Linear', 'Zapier', 'Tray.ai', 'Gong', 'Slack Workflows & Agents', 'Claude Desktop', 'Notion'] },
        { name: 'Data & Infrastructure', skills: ['Vercel Blob', 'Supabase', 'Neon', 'PostgreSQL', 'Snowflake', 'Docker'] },
      ],
    }));

    insert.run('education', 4, 'Education', JSON.stringify({
      degree: 'Bachelor of Science in Information Technology',
      school: 'Florida International University',
      location: 'Miami, FL',
      years: '2012-2016',
    }));

    insert.run('certifications', 5, 'Certifications', JSON.stringify({
      summary: '17x Salesforce Certified',
      certs: ['Integration Architect', 'Platform Developer II (PD2)', 'Platform Developer I (PD1)', 'JavaScript Developer I', 'Application Architect', 'Data Architecture', 'Sharing and Visibility Designer', 'Field Service Lightning Consultant', 'Service Cloud Consultant', 'Platform App Builder', 'Advanced Administrator', 'Administrator', 'Community Cloud Consultant', 'Sales Cloud Consultant'],
    }));

    insert.run('projects', 6, 'Projects', JSON.stringify([
      { name: 'Salesforce 2.0', company: 'Vercel', url: 'github.com/vercel/vercel_salesforce', date: 'February 2026 - Present', description: 'Led Vercel\'s "Salesforce 2.0" initiative to transform GTM operations from UI-based workflows to a developer-first CLI/SFDX model.' },
      { name: 'Vercelforce/Socrates', company: 'Vercel', url: 'github.com/vercel/vercelforce', date: 'November 2025 - Present', description: 'Salesforce Governance App + GTM Integration Platform connecting Salesforce, Slack, Snowflake, and other systems through 15+ Vercel Workflows.' },
      { name: 'Partner Portal (PRM) 2.0', company: 'Vercel', url: 'github.com/vercel/partner-portal', date: 'November 2025 - January 2026', description: 'Full-stack Salesforce Partner Portal using Next.js 16, v0, and Vercel AI SDK for automated lead data entry.' },
      { name: 'Certifyforce', company: '', url: 'www.certifyforce.com', date: 'July 2025 - December 2025', description: 'AI-powered Salesforce certification platform using Vercel, Next.js, Stripe, NeonDB, and OpenAI.' },
      { name: 'Lightning Challenges', company: '', url: 'www.lightningchallenges.com', date: 'January 2025 - December 2025', description: 'Salesforce developer training platform with live Apex coding practice.' },
      { name: 'Why Salesforce', company: '', url: 'Chrome Web Store', date: 'November 2022 - December 2024', description: 'Chrome extension to enhance Salesforce setup navigation.' },
    ]));

    insert.run('community', 7, 'Community & Honors', JSON.stringify([
      { title: 'Salesforce MVP', org: 'Salesforce', years: '2023-Present', description: 'Recognition for developer ecosystem contributions.' },
      { title: 'Salesforce Community Advisory Board Member', org: 'Salesforce', years: '2025' },
    ]));
  });

  seed();
}

export default db;

// Migration: add page_break_before column if missing
try {
  db.prepare("SELECT page_break_before FROM resume_versions LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE resume_versions ADD COLUMN page_break_before TEXT DEFAULT 'certifications'");
}
