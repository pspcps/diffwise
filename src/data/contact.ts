/** Public professional contact requested by the site owner. */
export const CONTACT_EMAIL = "prakash63kumar@gmail.com";
/** Used only to update the owner's existing browser drafts and imported backups. */
export const LEGACY_RESUME_EMAIL = "prakash.seervi9460@gmail.com";
export function migrateResumeEmail(email: string) {
  return email.trim().toLowerCase() === LEGACY_RESUME_EMAIL
    ? CONTACT_EMAIL
    : email;
}
