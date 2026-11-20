# Review of the generated resume — 20 November 2026

This review covers the project's default HTML resume, its source-backed wording and the exported PDF behavior. It is not an employer ATS assessment, employment verification or a comparison with a supplied job description.

## Assessment

The material is credible for senior software engineering applications when the owner can substantiate the reported outcomes. The strongest evidence is the reverse-geocoding cost reduction, SQL performance improvements, database migration, event-pipeline work and linked projects. The general version covers a broad engineering background; it should not be the only version used for every vacancy.

The site's 95/100 single-column and 80/100 two-column figures are an editorial formatting heuristic. They do not measure keyword relevance, the truth of a claim, an employer's filters or the reading order in every ATS. A real job-match assessment needs the target job description and the actual screening/parser behavior. No new ATS score has been invented for this review.

## Changes made

- Keep a general profile and add six role-focused profiles. Each changes summary, skill emphasis and project selection/order rather than repeating a generic list of every technology.
- Identify the approximately $1M annual saving as reverse-geocoding work using OpenStreetMap/Redis, rather than leaving it as an unspecified platform outcome.
- Separate alert-noise reduction and batched-insert error reduction into distinct bullets.
- Remove the ambiguous combined “exactly-once/at-least-once” pipeline wording. End-to-end exactly-once behavior depends on source, processing, commits and destination handling; it cannot be inferred from Kafka usage alone.
- Use clear Software Engineer / Senior Software Engineer employment titles in the generated resume instead of inferring internal grades from inconsistent source labels. Target-role headers are not substitutions for held employment titles.
- Describe applied AI as recent work within a longer software engineering career. Avoid implying that all years of experience were spent on newer AI stacks.
- Replace the owner’s public contact email and migrate older browser drafts/imports that still use the former address.

## Which version to use

| Profile | Main emphasis | Leading projects |
| --- | --- | --- |
| Common / General | Broad senior engineering background | FleetMind, Project Drishti |
| Backend Engineer | Services, Kafka, databases and integration | Kafbat UI, FleetMind |
| Cloud Engineer | Cloud applications, containers and operations | Kafbat UI, FleetMind |
| Applied AI Engineer | Agents, MCP, RAG and AI application integration | FleetMind, Project Drishti, Ask My Docs, Resume AI |
| Full-Stack Developer | React interfaces, APIs and complete workflows | PSDevTool, Project Drishti |
| Software Architect | System boundaries and event/data flows | Kafbat UI, FleetMind |
| Forward-Deployed Engineer | Hands-on integration and operational problem solving | FleetMind, Project Drishti |

The Cloud profile does not invent Terraform, infrastructure certifications, ownership of an SRE function or other unprovided experience. The Forward-Deployed profile emphasizes existing delivery and diagnostics work; it does not assert onsite deployments or customer-discovery responsibilities. No new employers, degrees, dates, metrics or merged contributions are added.

## ATS and recruiter considerations

1. Prefer Modern, Classic or Minimal for unknown ATS systems. These have single-column text and conventional section headings. Two-column versions can be useful for direct sharing, but parser order varies.
2. Keep contact details as real text and links. The QR is supplemental; it does not replace the portfolio URL. The phone remains blank by the owner's prior request and can be added manually in Edit mode.
3. The one-page A4 version deliberately omits education and certification. If a vacancy explicitly requires a degree, the Legal version includes those fields. Review the actual application requirements before choosing the compact version.
4. Verify all reported outcome metrics, dates and official job titles against the owner's records. For interviews, be ready to explain the baseline and measurement window for the $1M/year, 40%, 60–70%, 2M-record and other supplied claims. No missing baselines have been fabricated.
5. The A4 typography is dense (base body approximately 9.4 pt). One page is a layout preference, not an ATS requirement. If a role needs more evidence or larger typography, a readable longer resume can be preferable to shrinking text or adding keywords to every line.
6. Match the target vacancy with natural, evidenced terms. For example, include RAG/MCP in an applied AI application and Kafka/SQL optimization in a backend application. Do not list a required skill as experience solely because it appears in a job advertisement.
7. Keep verified upstream contributions separate from project customizations. Liquibase PR #2102 is the linked merged contribution; the additional Legal entries retain their customization/fix wording.

## Verification scope

Tests cover seven distinct role contents, stable employers/dates/titles, four/five projects by paper, new contact details, legacy imports, independent profiles, dynamic default career years, preservation of unrelated users, deleted-example behavior and validated backup round trips. Chromium PDF checks inspect page counts and selectable/extracted text. These establish the application's output behavior, not acceptance by a particular ATS or a guarantee of an interview.
