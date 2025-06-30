-- Sample scenarios for the scenario library
-- Written in the style of compelling, realistic workplace stories

-- First, insert the categories
INSERT INTO scenario_categories (id, name, description, icon, color, sort_order) VALUES
('tech', 'Technology & IT', 'Software development teams, DevOps, IT support, and tech leadership challenges', 'technology', '#3B82F6', 1),
('healthcare', 'Healthcare', 'Medical teams, patient care, hospital administration, and clinical leadership', 'healthcare', '#EF4444', 2),
('construction', 'Construction', 'Project management, safety protocols, contractor relationships, and site leadership', 'construction', '#F59E0B', 3),
('manufacturing', 'Manufacturing', 'Production lines, quality control, supply chain, and operational excellence', 'manufacturing', '#6B7280', 4),
('retail', 'Retail & Customer Service', 'Store operations, customer experience, sales teams, and retail management', 'retail', '#10B981', 5),
('education', 'Education', 'Teaching teams, administration, curriculum development, and academic leadership', 'education', '#8B5CF6', 6),
('finance', 'Finance & Banking', 'Financial services, investment teams, compliance, and financial leadership', 'finance', '#059669', 7),
('legal', 'Legal Services', 'Law firms, legal teams, client relations, and legal practice management', 'legal', '#7C3AED', 8),
('hospitality', 'Hospitality & Tourism', 'Hotels, restaurants, event management, and hospitality leadership', 'hospitality', '#EC4899', 9),
('transport', 'Transportation & Logistics', 'Shipping, delivery, fleet management, and logistics coordination', 'transport', '#F97316', 10),
('consulting', 'Consulting', 'Client relationships, project delivery, team dynamics, and consulting leadership', 'consulting', '#06B6D4', 11),
('nonprofit', 'Non-Profit', 'Community work, fundraising, volunteer management, and mission-driven leadership', 'nonprofit', '#84CC16', 12);

-- Technology scenarios (20 compelling stories)

INSERT INTO scenarios (
  id, category_id, title, subtitle, difficulty_level, estimated_time_minutes,
  setting, characters, situation, background_context, underlying_tensions,
  learning_objectives, key_antipatterns, suggested_hexies,
  discussion_prompts, intervention_hints, success_indicators,
  complexity_tags, industry_specific_elements
) VALUES

-- Tech Scenario 1: The Perfectionist Developer
('tech_001', 'tech', 'The Code Perfectionist', 'When attention to detail becomes a team bottleneck', 3, 45,
'A fast-growing fintech startup with a 12-person engineering team working on a mobile banking app with tight regulatory deadlines.',
'[
  {"name": "Marcus Chen", "role": "Senior Full-Stack Developer", "personality": "Brilliant, meticulous, but increasingly isolated. Spends hours refactoring code that already works. Believes his standards are what separate good from great.", "background": "10 years experience, previously at Google. Joined the startup for more autonomy."},
  {"name": "Zara Ahmed", "role": "Product Manager", "personality": "Results-driven, practical, feeling frustrated by missed deadlines. Tries to balance quality with delivery.", "background": "Former consultant, good at stakeholder management but new to technical product management."},
  {"name": "Danny Rodriguez", "role": "Junior Developer", "personality": "Eager to learn but intimidated by Marcus. Questions his own abilities when his code gets heavily rewritten.", "background": "Bootcamp graduate, first tech job, strong potential but lacks confidence."},
  {"name": "Kim Taylor", "role": "Engineering Manager", "personality": "Recently promoted from developer to manager. Struggling to balance technical excellence with team productivity.", "background": "5 years at the company, well-liked but still learning management skills."}
]',
'Marcus consistently rewrites teammates'' code to meet his exacting standards, causing a bottleneck in the development pipeline. His pull request reviews are detailed but often take 2-3 days, and he frequently asks for multiple rounds of changes on straightforward features. The team is falling behind on sprint commitments, and tension is building as the regulatory deadline approaches.',
'The startup recently raised Series A funding and is under pressure to launch new features quickly to capture market share. Marcus joined 8 months ago and initially was praised for catching several critical bugs, which reinforced his belief that his thoroughness is essential. However, the team has grown from 5 to 12 developers, and his approach doesn''t scale.',
'Marcus feels unappreciated when his careful work is seen as "slowing things down." Danny is losing confidence and considering quitting. Zara is getting pressure from leadership about delays. Kim is caught between supporting technical excellence and meeting business objectives.',
'["Recognize how perfectionism can mask insecurity and control issues", "Practice giving feedback that balances quality with team dynamics", "Identify when individual brilliance becomes team dysfunction", "Explore the difference between high standards and perfectionism"]',
'["Perfectionism", "Gatekeeping", "Communication Breakdown", "Power Dynamics", "Knowledge Hoarding"]',
'["perfectionism", "communication", "feedback", "leadership", "collaboration"]',
'["How might Marcus''s behavior be affecting team psychological safety?", "What are the business risks of this pattern continuing?", "How can Kim address this without losing Marcus''s valuable contributions?", "What systems could prevent one person from becoming a bottleneck?"]',
'["Consider exploring Marcus''s underlying motivations", "Look for ways to channel his expertise positively", "Address the impact on junior developers specifically", "Think about scalable code review processes"]',
'["More distributed code review process", "Junior developers feeling supported and growing", "Clear standards that the whole team can follow", "Marcus feeling valued while not blocking progress"]',
'["interpersonal", "process", "leadership", "cultural"],
'["Code review processes", "Sprint planning", "Technical debt management", "Regulatory compliance pressure", "Startup growth dynamics"]'
),

-- Tech Scenario 2: The Overcommitted Tech Lead
('tech_002', 'tech', 'The Hero''s Burden', 'When being indispensable becomes a trap', 4, 60,
'A mid-sized software company''s platform team supporting multiple product lines, with the tech lead involved in every major decision.',
'[
  {"name": "Sarah Martinez", "role": "Tech Lead/Principal Engineer", "personality": "Highly capable, works 60+ hours per week, attends every meeting, reviews every design doc. Struggles to delegate because ''it''s faster to do it myself.''", "background": "8 years at the company, promoted to tech lead 2 years ago. Single, no kids, defines herself through work."},
  {"name": "James Park", "role": "Senior Engineer", "personality": "Competent but demoralized. Feels his technical input isn''t valued. Considering leaving.", "background": "6 years experience, joined the team 1 year ago expecting more autonomy."},
  {"name": "Lisa Wong", "role": "Engineering Director", "personality": "Appreciates Sarah''s dedication but starting to see the risks. Wants to promote Sarah to Staff Engineer but concerned about team dependencies.", "background": "Former tech lead herself, understands the trap but struggling to intervene."},
  {"name": "Alex Thompson", "role": "Mid-level Engineer", "personality": "Ambitious but frustrated by lack of opportunities to lead initiatives. Feels professionally stunted.", "background": "3 years experience, high potential but overshadowed by Sarah''s involvement in everything."}
]',
'Sarah is the go-to person for every technical decision, architecture choice, and complex problem. She''s in back-to-back meetings, reviews every design document, and is often coding until midnight to "help the team stay unblocked." While initially seen as helpful, the team has become dependent on her approval for everything, and other senior engineers are feeling underutilized and frustrated.',
'Sarah was promoted to tech lead during a critical product launch where her heroic efforts saved the day. This reinforced her belief that the team needs her constant involvement. The company has grown 3x since then, but Sarah hasn''t adjusted her working style. Leadership praises her dedication, unintentionally reinforcing the problematic pattern.',
'Sarah is burning out but afraid to step back because "things will fall apart." James and Alex feel professionally stifled and are updating their resumes. Lisa recognizes the single point of failure risk but doesn''t want to lose Sarah. The team''s velocity is declining as everything waits for Sarah''s input.',
'["Understand how hero culture develops and persists", "Recognize the difference between being helpful and being controlling", "Practice identifying and addressing single points of failure", "Explore healthy delegation and empowerment strategies"]',
'["Hero Complex", "Micromanagement", "Burnout Culture", "Delegation Failure", "Team Dependency"]',
'["leadership", "delegation", "empowerment", "sustainability", "team-development"]',
'["What makes it hard for Sarah to delegate?", "How is the current dynamic affecting team growth?", "What would healthy leadership look like in this situation?", "How can Lisa intervene without alienating Sarah?"]',
'["Explore Sarah''s fears about letting go", "Consider the team''s perspective on growth opportunities", "Look at systems that could reduce dependencies", "Think about how to reframe Sarah''s role"]',
'["Clear decision-making frameworks that don''t require Sarah", "Other team members taking ownership of initiatives", "Sarah working normal hours while maintaining quality", "Team members feeling empowered and growing"]',
'["leadership", "systemic", "cultural", "burnout"],
'["Technical architecture decisions", "Code review processes", "On-call rotations", "Design documentation", "Cross-team dependencies"]'
),

-- Tech Scenario 3: The Silent Struggle
('tech_003', 'tech', 'The Invisible Contributor', 'When valuable team members fade into the background', 2, 35,
'An agile development team at a growing SaaS company where daily standups have become dominated by a few vocal personalities.',
'[
  {"name": "Priya Patel", "role": "Software Engineer", "personality": "Quiet, thoughtful, produces excellent code but rarely speaks up in meetings. Observes everything but shares little.", "background": "4 years experience, moved to the US 2 years ago, still adjusting to American workplace culture."},
  {"name": "Tyler Brooks", "role": "Scrum Master/Team Lead", "personality": "Energetic, talks fast, good intentions but tends to fill silences quickly. Doesn''t notice when people aren''t participating.", "background": "Former sales, transitioned to tech 3 years ago, very extroverted."},
  {"name": "Rachel Kim", "role": "Senior Engineer", "personality": "Vocal about technical decisions, passionate about best practices, sometimes interrupts others mid-sentence.", "background": "7 years experience, strong opinions, seen as a technical leader."},
  {"name": "David Okafor", "role": "QA Engineer", "personality": "Detail-oriented, finds critical bugs, but his insights about user experience often go unheard in planning meetings.", "background": "5 years in QA, deep understanding of the product but not seen as a ''technical'' voice."}
]',
'In daily standups and planning meetings, the same 2-3 people always speak first and most. Priya has valuable insights about code architecture and has caught several major issues, but she often gets cut off or the conversation moves on before she can contribute. Her pull requests are always high quality, but her ideas in meetings seem to disappear. David has crucial user experience insights from testing, but planning discussions rarely include his perspective.',
'The team moved to remote work 6 months ago, making it even harder for quieter team members to find natural opportunities to contribute. The company culture values "being vocal" and "taking initiative," which inadvertently favors extroverted communication styles. Recent retrospectives have been dominated by process discussions while deeper technical and user experience insights go unexplored.',
'Priya is considering asking for a transfer to another team where she might feel more heard. David is frustrated that UX issues he identifies in testing could have been prevented with earlier input. Tyler thinks the team is functioning well because meetings are "energetic and collaborative." Rachel is unaware that her communication style is affecting others.',
'["Recognize how communication styles affect team dynamics", "Practice inclusive meeting facilitation", "Identify and amplify quiet voices", "Understand cultural differences in workplace communication"]',
'["Communication Imbalance", "Cultural Insensitivity", "Exclusion Patterns", "Meeting Dysfunction", "Overlooked Expertise"]',
'["inclusion", "communication", "facilitation", "cultural-awareness", "team-dynamics"]',
'["What valuable perspectives might the team be missing?", "How do different communication styles affect participation?", "What meeting structures could better include everyone?", "How might cultural differences be affecting dynamics?"]',
'["Pay attention to who speaks and who doesn''t", "Consider the impact of remote work on participation", "Look for ways to gather input outside of meetings", "Think about rotating facilitation or structured turn-taking"]',
'["All team members contributing ideas regularly", "Diverse perspectives informing decisions", "Quieter members feeling valued and heard", "Meeting structures that work for different communication styles"]',
'["interpersonal", "cultural", "process", "communication"],
'["Agile ceremonies", "Remote work dynamics", "Code review processes", "Architecture decisions", "User experience feedback loops"]'
),

-- Tech Scenario 4: The Knowledge Silo
('tech_004', 'tech', 'The Indispensable Expert', 'When specialized knowledge becomes a team vulnerability', 4, 50,
'A fintech startup''s backend team where one developer has become the sole expert on the core payment processing system.',
'[
  {"name": "Michael Torres", "role": "Senior Backend Engineer", "personality": "Extremely knowledgeable about the payment system, but doesn''t document well and explains things in overly technical terms. Enjoys being the expert.", "background": "Built the original payment processing system 3 years ago when the company was 10 people. Now 200+ employees depend on this system."},
  {"name": "Jennifer Liu", "role": "Engineering Manager", "personality": "Strategic thinker who recognizes the knowledge silo risk but struggles to address it without alienating Michael.", "background": "Joined 6 months ago from a larger tech company, trying to bring more structure to the team."},
  {"name": "Carlos Mendez", "role": "DevOps Engineer", "personality": "Responsible for system reliability but constantly blocked by needing Michael''s input on payment infrastructure changes.", "background": "2 years at the company, increasingly frustrated by dependencies."},
  {"name": "Aisha Johnson", "role": "Senior Engineer", "personality": "Wants to contribute to payment features but finds the codebase impenetrable and Michael''s explanations confusing.", "background": "5 years experience, new to the team, feeling excluded from critical projects."}
]',
'Michael is the only person who truly understands the payment processing system that handles $50M in transactions monthly. When payment issues arise (which happens weekly), everything stops until Michael can investigate. He''s reluctant to document the system because "the code is the documentation," and his attempts to explain it to others are filled with jargon and assumptions about background knowledge. The team can''t make changes to payment flows without his review, creating a significant bottleneck.',
'The payment system was built quickly during the startup''s early days with minimal documentation. Michael was rewarded for his deep expertise and rapid problem-solving, reinforcing his identity as the payment guru. As the company scaled, no one else was given time to learn the system, and Michael enjoyed being the go-to expert. Recent compliance requirements mean the team needs to make frequent changes, but the knowledge bottleneck is becoming critical.',
'Michael enjoys his expert status and unconsciously resists knowledge sharing because it threatens his importance. Carlos is stressed about system reliability with only one person who can fix critical issues. Aisha feels excluded from important work and is considering leaving. Jennifer is worried about the business risk but doesn''t want to force documentation that might be superficial.',
'["Understand how knowledge silos develop and persist", "Practice strategies for knowledge transfer and documentation", "Recognize the risks of single points of failure", "Explore ways to distribute expertise without undermining experts"]',
'["Knowledge Hoarding", "Single Point of Failure", "Poor Documentation", "Gatekeeping", "Bus Factor"]',
'["knowledge-sharing", "documentation", "mentorship", "risk-management", "team-resilience"]',
'["What business risks does this knowledge silo create?", "How can the team encourage knowledge sharing without threatening Michael?", "What documentation strategies would be most effective?", "How might the reward system be reinforcing this pattern?"]',
'["Consider Michael''s motivations for maintaining expertise", "Look for structured approaches to knowledge transfer", "Think about pair programming or shadowing opportunities", "Explore ways to make Michael feel valued while distributing knowledge"]',
'["Multiple team members able to handle payment issues", "Comprehensive documentation that others can follow", "Michael feeling valued for mentoring rather than gatekeeping", "Reduced business risk from knowledge dependencies"]',
'["systemic", "process", "knowledge", "risk"],
'["Payment processing systems", "Financial compliance requirements", "System documentation", "Code architecture", "Business continuity planning"]'
),

-- Tech Scenario 5: The Innovation Blocker
('tech_005', 'tech', 'The Status Quo Guardian', 'When experience becomes resistance to necessary change', 3, 40,
'A traditional enterprise software company trying to modernize its development practices while maintaining stability for enterprise clients.',
'[
  {"name": "Robert Harrison", "role": "Senior Architect", "personality": "15 years with the company, deeply knowledgeable about the existing system. Skeptical of new technologies and worried about introducing instability.", "background": "Lived through several failed technology migrations. Highly respected for keeping the system stable through major client deployments."},
  {"name": "Maya Singh", "role": "Senior Developer", "personality": "Passionate about modern development practices, frustrated by outdated tools and processes. Sometimes dismissive of legacy concerns.", "background": "2 years at the company, previously at a startup where rapid iteration was the norm."},
  {"name": "Chris Martinez", "role": "Development Manager", "personality": "Caught between modernization pressure from leadership and stability concerns from experienced team members.", "background": "5 years managing the team, values both innovation and reliability."},
  {"name": "Emily Chen", "role": "Junior Developer", "personality": "Recent graduate excited about modern tools but confused by the resistance to practices she learned in school.", "background": "6 months at the company, first job, eager to contribute but feeling held back."}
]',
'The engineering team is split between those pushing for modern practices (CI/CD, containerization, microservices) and those concerned about disrupting a stable system that serves major enterprise clients. Robert consistently raises concerns about proposed changes, citing past failures and client stability requirements. Maya argues that the current system is becoming unmaintainable and that the company is falling behind competitors. Every technical decision becomes a debate between innovation and stability.',
'The company has operated the same monolithic system for 8 years with 99.9% uptime. Robert was instrumental in several crisis situations and is seen as the stability guardian. Recent market pressure and competitor advances have leadership pushing for modernization, but major clients have contracts requiring specific stability guarantees. A failed migration attempt 3 years ago reinforced Robert''s caution about new technologies.',
'Robert feels his experience and caution are being dismissed as "old-fashioned." Maya is frustrated that legitimate technical debt concerns are being ignored for risk-averse reasons. Chris is pressured by leadership to modernize but worried about team harmony and client relationships. Emily is confused about whether her modern skills are valued.',
'["Understand how past experiences shape current decision-making", "Practice balancing innovation with stability requirements", "Recognize when experience becomes resistance to necessary change", "Explore collaborative approaches to technical decision-making"]',
'["Change Resistance", "Generational Conflict", "Risk Aversion", "Innovation Blocking", "Technical Debt"]',
'["change-management", "technical-decision-making", "legacy-systems", "team-alignment", "innovation"]',
'["How can the team honor past experience while embracing necessary change?", "What are the real risks vs. perceived risks of modernization?", "How might different generations of developers find common ground?", "What incremental approaches could satisfy both stability and innovation needs?"]',
'["Consider the emotional aspects of technical change", "Look for ways to validate both perspectives", "Explore incremental rather than revolutionary approaches", "Think about how to measure and communicate risk"]',
'["Balanced approach that addresses both stability and modernization", "Team alignment on technical direction", "Clear criteria for evaluating technical decisions", "Respect for both experience and innovation"]',
'["generational", "technical", "change", "process"],
'["Legacy system maintenance", "Enterprise client requirements", "Technology migration strategies", "Risk assessment frameworks", "Competitive pressure"]'
);

-- Continue with more technology scenarios... (This is just the first 5 of 20)
-- Due to length constraints, I'll show the pattern and include a few more key scenarios

INSERT INTO scenarios (
  id, category_id, title, subtitle, difficulty_level, estimated_time_minutes,
  setting, characters, situation, background_context, underlying_tensions,
  learning_objectives, key_antipatterns, suggested_hexies,
  discussion_prompts, intervention_hints, success_indicators,
  complexity_tags, industry_specific_elements
) VALUES

-- Tech Scenario 6: The Deadline Pressure
('tech_006', 'tech', 'The Crunch Time Crisis', 'When pressure creates shortcuts that compound problems', 4, 55,
'A mobile app development team at a startup racing to launch before a competitor, with investors watching every milestone.',
'[
  {"name": "Alex Rivera", "role": "CTO/Co-founder", "personality": "Brilliant technical mind but terrible at estimating time. Promises aggressive deadlines to investors without consulting the team.", "background": "First-time founder, technical background but new to management."},
  {"name": "Sam Johnson", "role": "Lead Mobile Developer", "personality": "Experienced, practical, trying to balance quality with speed. Increasingly stressed about technical debt.", "background": "8 years mobile development, joined the startup for equity upside."},
  {"name": "Nicole Zhang", "role": "Backend Developer", "personality": "High performer who''s been working 70-hour weeks. Starting to make mistakes due to fatigue.", "background": "3 years experience, afraid to say no to requests."},
  {"name": "Jordan Taylor", "role": "QA Engineer", "personality": "Thorough tester whose input is increasingly ignored due to time pressure. Worried about launching buggy software.", "background": "5 years in QA, joined from a larger company with robust testing processes."}
]',
'With the competitor launch rumored for next month, Alex has committed to launching two weeks ahead of schedule. The team is cutting corners on testing, skipping code reviews, and accumulating massive technical debt. Jordan keeps finding critical bugs, but there''s pressure to mark them as "ship-blockers only." Nicole hasn''t taken a day off in six weeks and is making errors she normally wouldn''t. Sam is trying to maintain some standards while feeling constant pressure to "just make it work."',
'The startup raised $5M six months ago with promises of launching before the main competitor. Early demos went well, leading to overconfidence about development speed. Alex, having never managed a team through a major launch, doesn''t understand the compounding effects of cutting corners. Investor updates focus on launch dates rather than sustainable development practices.',
'Alex feels the survival of the company depends on beating the competition to market. Nicole is burning out but afraid that saying no will hurt her standing with the founding team. Sam is watching code quality deteriorate and worrying about post-launch maintenance. Jordan feels like quality is being sacrificed and fears the reputational damage of a buggy launch.',
'["Understand how pressure affects decision-making and team dynamics", "Recognize the hidden costs of technical shortcuts", "Practice having difficult conversations about realistic timelines", "Explore sustainable approaches to competitive pressure"]',
'["Deadline Pressure", "Technical Debt", "Burnout Culture", "Quality Shortcuts", "Communication Breakdown"]',
'["pressure-management", "sustainability", "quality", "leadership", "team-health"]',
'["What are the real risks of launching with known quality issues?", "How can teams maintain standards under extreme pressure?", "What conversations need to happen between leadership and engineering?", "How might the pressure be affecting individual team members differently?"]',
'["Consider the long-term consequences of current decisions", "Look for ways to have honest conversations about trade-offs", "Think about what ''minimum viable'' really means", "Explore how to support team members under stress"]',
'["Realistic timeline based on actual capacity", "Sustainable work pace that maintains quality", "Clear communication between leadership and engineering", "Team members feeling supported rather than pressured"]',
'["pressure", "leadership", "sustainability", "quality"],
'["Mobile app development", "Startup funding cycles", "Competitive market dynamics", "Technical debt management", "Launch planning"]'
),

-- Tech Scenario 7: The Remote Work Divide
('tech_007', 'tech', 'The Distance Between Us', 'When remote work amplifies existing team dynamics', 3, 40,
'A distributed development team at a mid-sized tech company, split between office workers and remote employees across different time zones.',
'[
  {"name": "Kevin Park", "role": "Team Lead", "personality": "Prefers in-person collaboration, unconsciously favors office-based team members for important decisions and opportunities.", "background": "10 years at the company, all in-office until the pandemic. Based in San Francisco HQ."},
  {"name": "Maria Gonzalez", "role": "Senior Developer", "personality": "Remote from Austin, highly productive but feels excluded from spontaneous decisions and informal knowledge sharing.", "background": "5 years experience, joined the team remotely 2 years ago."},
  {"name": "Ryan Mitchell", "role": "Mid-level Developer", "personality": "Works from the office, benefits from casual conversations and face-time with leadership but doesn''t realize the advantage.", "background": "3 years at the company, sitting near Kevin''s office."},
  {"name": "Priya Sharma", "role": "DevOps Engineer", "personality": "Remote from India, dealing with significant timezone challenges. Excellent work but struggles to participate in real-time discussions.", "background": "4 years experience, 12.5 hour time difference from HQ."}
]',
'Important technical decisions are often made in impromptu hallway conversations that remote team members miss. Maria consistently delivers high-quality work but learns about major architecture changes through Slack messages after decisions are made. Priya''s DevOps expertise is crucial, but timezone differences mean her input is often sought asynchronously after problems arise. Ryan is unknowingly benefiting from proximity bias, getting more interesting projects and mentoring opportunities.',
'The company transitioned to "hybrid" work post-pandemic but hasn''t updated its collaboration practices. Kevin and other office-based leaders maintain their preference for in-person discussion, seeing it as more efficient. Remote employees were hired with promises of equal treatment, but unconscious biases toward office presence persist. The timezone spread was meant to provide 24/7 coverage but creates collaboration challenges.',
'Maria feels like a second-class team member despite her strong performance. Priya is considering looking for a role with better timezone alignment. Kevin thinks he''s being inclusive but doesn''t realize how many decisions happen informally. Ryan is unaware that his location gives him advantages over equally qualified remote colleagues.',
'["Recognize how physical proximity affects team dynamics", "Understand the invisible advantages of office presence", "Practice inclusive collaboration across time zones", "Identify and address unconscious bias in remote settings"]',
'["Proximity Bias", "Exclusion Patterns", "Communication Inequality", "Timezone Challenges", "Hybrid Work Dysfunction"]',
'["remote-work", "inclusion", "bias", "communication", "equity"]',
'["How might location be affecting opportunities and inclusion?", "What decisions are being made informally that should be formal?", "How can teams ensure equal participation across time zones?", "What advantages do office workers have that remote workers don''t?"]',
'["Pay attention to when and how decisions are made", "Consider the remote experience in all team interactions", "Look for ways to level the playing field", "Think about documentation and async communication"]',
'["Equal participation in decision-making regardless of location", "Inclusive meeting practices that work for all time zones", "Documented decision-making processes", "Remote team members feeling equally valued and included"]',
'["remote-work", "bias", "inclusion", "process"],
'["Distributed team management", "Hybrid work policies", "Cross-timezone collaboration", "Architecture decision records", "Team communication tools"]'
);

-- Add sample scenarios for other industries
-- Healthcare example
INSERT INTO scenarios (
  id, category_id, title, subtitle, difficulty_level, estimated_time_minutes,
  setting, characters, situation, background_context, underlying_tensions,
  learning_objectives, key_antipatterns, suggested_hexies,
  discussion_prompts, intervention_hints, success_indicators,
  complexity_tags, industry_specific_elements
) VALUES

('healthcare_001', 'healthcare', 'The Hierarchy Barrier', 'When medical hierarchy prevents critical communication', 5, 60,
'A busy urban hospital emergency department during a typical evening shift with multiple critical cases.',
'[
  {"name": "Dr. Patricia Williams", "role": "Attending Physician", "personality": "20 years experience, highly skilled, but intimidating presence. Doesn''t tolerate questions she sees as basic.", "background": "Top of her medical school class, used to being the authority. Excellent diagnostician but poor at teaching."},
  {"name": "Maria Santos", "role": "Registered Nurse", "personality": "15 years nursing experience, knows the patients better than anyone, but hesitates to challenge doctors.", "background": "Seen multiple preventable mistakes due to communication failures."},
  {"name": "Dr. James Chen", "role": "Resident", "personality": "Second-year resident, smart but exhausted. Afraid to admit when he doesn''t understand something.", "background": "Medical school focused on knowledge acquisition, not collaborative communication."},
  {"name": "Linda Jefferson", "role": "Charge Nurse", "personality": "Manages the nursing staff, caught between supporting her nurses and maintaining relationships with physicians.", "background": "Former bedside nurse, understands both perspectives."}
]',
'Maria notices that a patient''s symptoms don''t match Dr. Williams'' diagnosis, but she''s afraid to speak up directly. Dr. Chen has questions about a treatment plan but doesn''t want to appear incompetent. When Linda tries to advocate for nursing input, she''s told that medical decisions are "above her pay grade." The traditional hierarchy prevents crucial information from flowing upward, potentially compromising patient care.',
'The hospital has a strong traditional hierarchy where questioning a physician''s decision is seen as insubordination. Previous incidents where nurses raised concerns were met with dismissal or retaliation. Dr. Williams was trained in an era where nurses were expected to follow orders without question. Recent studies on medical errors emphasize communication failures, but changing ingrained cultural patterns is difficult.',
'Dr. Williams believes hierarchy ensures clear decision-making and accountability. Maria has valuable observations but fears professional consequences of speaking up. Dr. Chen is struggling with imposter syndrome and afraid to show any weakness. Linda wants to create a safer environment but faces resistance from both nursing staff and physicians.',
'["Understand how hierarchy affects patient safety", "Practice speaking up across power differentials", "Recognize the value of different professional perspectives", "Explore creating psychological safety in high-stakes environments"]',
'["Hierarchy Dysfunction", "Communication Barriers", "Authority Gradient", "Fear-Based Silence", "Professional Silos"]',
'["hierarchy", "safety", "communication", "collaboration", "healthcare"]',
'["How does medical hierarchy affect patient outcomes?", "What prevents crucial information from being shared?", "How can different professionals feel empowered to contribute?", "What would psychological safety look like in this environment?"]',
'["Consider patient safety as the ultimate goal", "Look for structured ways to encourage input", "Think about how to reframe hierarchy as collaboration", "Explore the costs of silence in healthcare settings"]',
'["Open communication across all professional levels", "Nurses feeling empowered to share observations", "Physicians receptive to input from other professionals", "Improved patient outcomes through better collaboration"]',
'["hierarchy", "safety", "professional", "cultural"],
'["Medical hierarchy", "Patient safety protocols", "Nursing advocacy", "Resident training", "Interprofessional collaboration"]'
);