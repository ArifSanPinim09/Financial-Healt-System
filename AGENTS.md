# AGENTS.md

## AI AGENT DEVELOPMENT RULES

Anda adalah AI coding agent yang bekerja pada repository ini.

Tujuan utama Anda adalah mengembangkan project **secara terstruktur, aman, terdokumentasi, dan 100% mengacu pada PRD** yang tersedia di repository.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 1. SOURCE OF TRUTH

The following hierarchy determines the source of truth:

1. `/docs` — official project requirements and PRD
2. `/docs/plans/` — approved implementation plans
3. `/docs/AI-PROGRESS.md` — project handover/progress context
4. Existing source code and architecture
5. Git history

The PRD has the highest authority for product requirements.

### ABSOLUTE RULE

**DO NOT implement anything that contradicts the PRD.**

Do not invent features, flows, business rules, permissions, UI behavior, database structures, or integrations unless they are required by the PRD or technically necessary.

If something is unclear:

* inspect the relevant PRD;
* inspect the implementation plan;
* inspect existing code;
* inspect the database;
* document the ambiguity;
* ask for clarification if the ambiguity materially affects implementation.

Never silently invent requirements.

---

# 2. MANDATORY WORKFLOW

Every task MUST follow this lifecycle:

```text
READ PRD
    ↓
UNDERSTAND REQUIREMENTS
    ↓
READ RELEVANT PLAN
    ↓
INSPECT EXISTING IMPLEMENTATION
    ↓
INSPECT DATABASE IF NEEDED
    ↓
IMPLEMENT
    ↓
TEST
    ↓
VERIFY AGAINST PRD
    ↓
UPDATE DOCUMENTATION
    ↓
UPDATE AI-PROGRESS.md
    ↓
GIT COMMIT
    ↓
GIT PUSH
    ↓
NEXT TASK
```

Never skip the documentation or Git stages.

---

# 3. PLANNING FIRST

If `/docs/plans/` does not contain a plan for the requested work:

**DO NOT immediately start coding.**

Create the required plan first.

The plan must explain:

* objective;
* PRD reference;
* scope;
* out of scope;
* architecture;
* database changes;
* backend changes;
* frontend changes;
* UI/UX requirements;
* validation;
* authorization;
* edge cases;
* testing;
* dependencies;
* acceptance criteria.

Large features should have their own planning file.

---

# 4. DO NOT CODE FROM ASSUMPTIONS

Before changing code, inspect the existing project.

At minimum determine:

* framework version;
* package manager;
* project structure;
* existing architecture;
* existing components;
* existing services;
* existing API layer;
* existing authentication;
* existing authorization;
* database schema;
* environment configuration;
* testing setup.

Do not replace existing architecture just because another approach is personally preferred.

Prefer:

> understand → extend → improve

instead of:

> ignore → rewrite → break existing functionality

---

# 5. NEXT.JS RULES

This project uses Next.js.

Because this project may use a Next.js version with breaking changes, **do not rely on historical knowledge of Next.js APIs or conventions.**

Before implementing Next.js-related code:

1. inspect `package.json`;
2. determine the installed Next.js version;
3. read relevant documentation in:

```text
node_modules/next/dist/docs/
```

4. follow the installed version's conventions;
5. respect deprecation warnings;
6. do not assume APIs from previous Next.js versions are still valid.

When uncertain about a Next.js API, inspect the installed package/documentation before implementing it.

---

# 6. SUPABASE IS THE BACKEND SOURCE OF TRUTH

This project uses Supabase.

For all Supabase-related tasks, use the available **Supabase MCP**.

Do not guess the database state.

Before modifying the database:

1. inspect existing tables;
2. inspect columns;
3. inspect relationships;
4. inspect indexes;
5. inspect constraints;
6. inspect RLS policies;
7. inspect relevant functions/triggers;
8. compare the current state against the PRD;
9. determine the minimal required change.

### NEVER

* create duplicate tables;
* create duplicate columns;
* overwrite existing schema blindly;
* disable RLS simply to make something work;
* bypass authorization;
* expose service-role credentials to the client;
* place sensitive database operations directly in client-side code;
* delete production-like data without explicit authorization.

Database changes must be deliberate and documented.

---

# 7. SECURITY

Security is mandatory.

Never expose:

* Supabase service role keys;
* private API keys;
* secrets;
* passwords;
* access tokens;
* private credentials.

Never commit secrets into Git.

Use environment variables for secrets.

For authentication and authorization:

* verify the authenticated user;
* verify permissions;
* verify resource ownership where applicable;
* enforce authorization server-side;
* do not trust client-side authorization.

For Supabase:

* respect RLS;
* verify policies;
* avoid unnecessarily broad access.

---

# 8. FRONTEND RULES

Frontend implementation must follow the PRD.

Do not create generic template UI just to complete a task.

Every page should consider:

* information hierarchy;
* usability;
* navigation;
* responsive layout;
* loading state;
* empty state;
* error state;
* success state;
* validation state;
* accessibility;
* mobile behavior.

Do not add unnecessary animations, gradients, visual effects, or decorative components unless they serve a clear UX purpose or are explicitly required.

---

# 9. UI/UX MUST MATCH PRODUCT REQUIREMENTS

When implementing UI:

```text
PRD requirement
      ↓
User flow
      ↓
Information architecture
      ↓
Component structure
      ↓
Responsive behavior
      ↓
Implementation
```

Do not simply copy an existing SaaS/dashboard template.

Think about how the actual user will complete the task.

For every important interaction consider:

* What does the user need to know?
* What action should the user take?
* What happens after the action?
* What happens if it fails?
* What happens if there is no data?
* What happens if the user does not have permission?

---

# 10. COMPONENT & CODE QUALITY

Prefer:

* small focused components;
* reusable components where reuse is real;
* clear naming;
* predictable data flow;
* typed interfaces;
* maintainable services;
* minimal duplication;
* clear separation of concerns.

Avoid:

* giant components;
* duplicated business logic;
* unnecessary abstraction;
* unnecessary dependencies;
* premature optimization;
* magic values;
* dead code.

Do not over-engineer.

---

# 11. DATABASE & BUSINESS LOGIC

Business rules must not exist only in the UI.

Important business rules must be enforced at the appropriate backend/database layer.

Frontend validation improves UX.

Backend/database validation provides actual protection.

For every important rule ask:

> "Can this rule be bypassed by directly calling the API?"

If yes, the rule likely needs server-side enforcement.

---

# 12. ERROR HANDLING

Do not silently swallow errors.

Handle errors intentionally.

Every relevant operation should have appropriate:

* loading state;
* success state;
* error state;
* retry behavior where appropriate;
* user-friendly error message.

Do not expose internal stack traces, secrets, SQL details, or sensitive implementation information to users.

---

# 13. TESTING

After implementing a task, test it.

At minimum verify:

### Functional

Does the feature behave according to the PRD?

### Validation

Are invalid inputs handled correctly?

### Authorization

Can unauthorized users access restricted functionality?

### Database

Are data relationships and constraints correct?

### UI

Check:

* desktop;
* tablet where relevant;
* mobile.

### Regression

Ensure existing functionality still works.

---

# 14. PRD COMPLIANCE CHECK

Before marking a task as complete:

```text
[ ] PRD requirement implemented
[ ] Acceptance criteria satisfied
[ ] Business rules correct
[ ] Database changes correct
[ ] Authorization verified
[ ] Validation verified
[ ] Error handling implemented
[ ] Loading/empty/success states handled
[ ] Responsive behavior checked
[ ] Existing functionality not broken
[ ] No unnecessary feature added
[ ] Documentation updated
[ ] AI-PROGRESS.md updated
[ ] Git commit created
[ ] Git push successful
```

If any important item is incomplete, the task is **NOT DONE**.

---

# 15. AI-PROGRESS.md IS MANDATORY

The file:

```text
/docs/AI-PROGRESS.md
```

is the handover memory between AI agents.

Update it after every meaningful task or milestone.

Record:

* current phase;
* completed tasks;
* current task;
* implementation details;
* database changes;
* API changes;
* frontend changes;
* known issues;
* decisions;
* important context;
* last commit;
* last push;
* next task;
* next step.

The next AI must be able to understand the project state without relying on previous conversation history.

---

# 16. GIT IS MANDATORY

Every meaningful change MUST be committed.

After completing a change:

```bash
git status
git diff
git add <relevant-files>
git commit -m "..."
git push
```

Prefer targeted `git add` rather than blindly staging unrelated files.

Before committing:

* inspect the diff;
* ensure no secrets are included;
* ensure no unrelated changes are included;
* ensure the implementation matches the plan.

After pushing:

* verify the push succeeded;
* record the commit hash in `/docs/AI-PROGRESS.md`.

### IMPORTANT

**Never leave completed work only in the local working tree.**

If the task is complete, it must be pushed to GitHub.

---

# 17. COMMIT MESSAGE CONVENTION

Use clear conventional commit messages.

Examples:

```text
feat: implement authentication flow
feat: add user management module
feat: implement invoice creation
fix: resolve duplicate submission issue
fix: correct authorization check
refactor: simplify user service
test: add authentication tests
docs: update implementation plan
chore: update dependencies
```

Do not use meaningless commits such as:

```text
update
fix
changes
test
asdf
```

---

# 18. DO NOT FORCE PUSH

Never use:

```bash
git push --force
```

unless explicitly authorized and the consequences are understood.

Do not rewrite shared Git history unnecessarily.

---

# 19. PROGRESS CHECKPOINT

At the end of each task:

1. verify implementation;
2. run relevant tests;
3. inspect Git diff;
4. update `/docs/AI-PROGRESS.md`;
5. commit;
6. push;
7. verify GitHub push;
8. only then continue to the next task.

---

# 20. IF SOMETHING FAILS

When encountering an error:

```text
ERROR
 ↓
REPRODUCE
 ↓
UNDERSTAND ROOT CAUSE
 ↓
CHECK DOCUMENTATION
 ↓
IMPLEMENT FIX
 ↓
TEST
 ↓
DOCUMENT
 ↓
COMMIT
 ↓
PUSH
```

Do not repeatedly apply random fixes.

Do not hide errors.

Do not mark a task complete while a known critical issue remains.

---

# 21. CHANGE MINIMIZATION

When modifying an existing system:

Prefer the smallest safe change that fulfills the requirement.

Before changing something:

* determine why the existing implementation exists;
* identify dependencies;
* check whether other features use it;
* assess regression risk.

Avoid unnecessary rewrites.

---

# 22. DEPENDENCY RULE

Do not install a new package simply because it is convenient.

Before installing a dependency:

1. verify whether the project already has an equivalent;
2. verify whether the requirement actually needs it;
3. check compatibility with the current stack;
4. consider maintenance and security;
5. document the reason.

Avoid dependency bloat.

---

# 23. ENVIRONMENT RULES

Do not modify:

* production configuration;
* deployment configuration;
* secrets;
* environment variables;

without understanding the impact.

Never commit `.env` files containing secrets.

Use `.env.example` for documented configuration requirements when appropriate.

---

# 24. TASK BOUNDARIES

Only work on the current task.

Do not silently expand the scope.

If you discover another problem:

### Critical blocker

Fix it if necessary to complete the current task, then document it.

### Non-critical issue

Document it in:

```text
/docs/AI-PROGRESS.md
```

and continue with the current task.

Do not turn every discovered issue into an unrelated refactoring project.

---

# 25. NO FEATURE CREEP

The following are NOT valid reasons to add functionality:

* "this is more modern";
* "users might like it";
* "this is common in SaaS";
* "this would be nice to have";
* "other applications have this";
* "I think this is better".

The requirement must come from:

1. PRD;
2. approved planning;
3. explicit user instruction;
4. necessary technical/security implementation.

Otherwise, do not implement it.

---

# 26. HANDOVER REQUIREMENT

Before ending a session, ensure another AI can continue the project.

The repository must contain enough information through:

```text
/docs/
├── PRD files
├── plans/
│   ├── 00-master-plan.md
│   └── ...
└── AI-PROGRESS.md
```

The progress file must clearly state:

```text
WHAT WAS DONE
WHAT IS CURRENTLY BEING DONE
WHAT IS NOT DONE
WHAT FAILED
WHAT DECISIONS WERE MADE
WHAT THE NEXT AI SHOULD DO
WHICH COMMIT CONTAINS THE WORK
```

---

# 27. FINAL PRINCIPLE

The agent must optimize for:

```text
PRD COMPLIANCE
        ↓
CORRECTNESS
        ↓
SECURITY
        ↓
MAINTAINABILITY
        ↓
USER EXPERIENCE
        ↓
PERFORMANCE
        ↓
CONVENIENCE
```

Not the other way around.

The agent's job is **not to be creative with requirements**.

The agent's job is to **correctly transform the approved PRD into a working, tested, maintainable system.**

---

# 28. STARTUP CHECKLIST

Whenever an AI agent starts working on this repository:

```text
[ ] Read AGENTS.md
[ ] Read /docs
[ ] Read /docs/AI-PROGRESS.md
[ ] Read /docs/plans/00-master-plan.md
[ ] Identify current task
[ ] Read current task planning file
[ ] Check git status
[ ] Inspect relevant existing implementation
[ ] Inspect Supabase when applicable
[ ] Check installed Next.js version
[ ] Read relevant Next.js documentation
[ ] Implement only the planned scope
[ ] Test
[ ] Verify against PRD
[ ] Update AI-PROGRESS.md
[ ] Commit
[ ] Push
```

---

# ABSOLUTE RULES

These rules have priority throughout the entire project:

### RULE 1

**PRD IS THE SOURCE OF TRUTH.**

### RULE 2

**DO NOT CODE BEFORE UNDERSTANDING THE PLAN.**

### RULE 3

**SUPABASE MUST BE INSPECTED THROUGH THE AVAILABLE SUPABASE MCP FOR SUPABASE WORK.**

### RULE 4

**EVERY MEANINGFUL CHANGE MUST BE COMMITTED AND PUSHED TO GITHUB.**

### RULE 5

**EVERY MEANINGFUL PROGRESS MUST BE DOCUMENTED IN `/docs/AI-PROGRESS.md`.**

### RULE 6

**DO NOT INVENT FEATURES OR BUSINESS LOGIC.**

### RULE 7

**DO NOT IGNORE EXISTING ARCHITECTURE WITHOUT A VALID REASON.**

### RULE 8

**DO NOT MARK A TASK DONE UNTIL IT HAS BEEN TESTED AND VERIFIED AGAINST THE PRD.**

### RULE 9

**WHEN ANOTHER AI CONTINUES THE PROJECT, IT MUST BE ABLE TO RECOVER THE PROJECT STATE FROM THE REPOSITORY.**

### RULE 10

**WHEN IN DOUBT, FOLLOW THE PRD AND DOCUMENT THE UNCERTAINTY.**
