import type { ResumeProfile } from "../../data/resumeProfiles";
export default function ResumeProfilePicker({
  profiles,
  activeId,
  onSelect,
}: {
  profiles: Pick<ResumeProfile, "id" | "name">[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <label className="resume-profile-picker">
      <span>Profile</span>
      <select
        aria-label="Resume profile"
        value={activeId}
        onChange={(event) => onSelect(event.target.value)}
        disabled={!profiles.length}
      >
        {!activeId && <option value="">Common example</option>}
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </label>
  );
}
