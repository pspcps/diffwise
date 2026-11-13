import { RESUME } from "../data/resumeData";
import { PROJECT_CASE_STUDIES } from "../data/projectCaseStudies";
export function downloadProfile() {
  const r = RESUME;
  const text = [
    r.name,
    r.title,
    r.email,
    r.linkedin,
    "",
    "PROFESSIONAL SUMMARY",
    r.summary,
    "",
    "TECHNICAL SKILLS",
    ...Object.entries(r.skills).map(([k, v]) => `${k}: ${v.items.join(", ")}`),
    "",
    "PROFESSIONAL EXPERIENCE",
    ...r.experience.flatMap((e) => [
      `${e.company} | ${e.role} | ${e.period}`,
      ...e.bullets.map((b) => `- ${b}`),
      "",
    ]),
    "PROJECTS",
    ...r.projects.flatMap((p) => {
      const s = PROJECT_CASE_STUDIES[p.title];
      return [
        p.title,
        p.subtitle,
        `Technologies: ${p.tech.join(", ")}`,
        `Problem: ${s.problem}`,
        ...p.bullets.map((b) => `- ${b}`),
        `Engineering focus: ${s.engineering}`,
        p.github || "Private repository",
        "",
      ];
    }),
    "OPEN SOURCE",
    ...r.openSource.flatMap((o) => [
      o.project,
      o.contribution,
      o.link === "#" ? "" : o.link,
      "",
    ]),
    "EDUCATION",
    r.education.degree,
    `${r.education.institution} | ${r.education.location} | ${r.education.period}`,
    "",
    "CERTIFICATIONS",
    ...r.certifications.map((c) => `${c.name} | ${c.issuer}`),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "Prakash-Choudhary-Engineering-Profile.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
