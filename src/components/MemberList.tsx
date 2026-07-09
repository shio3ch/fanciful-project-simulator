import type { Member } from "../types/scenario";

const STAT_LABELS = [
  ["technical", "技術"],
  ["communication", "コミュ"],
  ["mental", "メンタル"],
  ["luck", "運"],
] as const;

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{member.emoji}</span>
        <div>
          <div className="text-sm font-bold">{member.name}</div>
          <div className="text-xs text-slate-500">{member.role}</div>
        </div>
      </div>
      <p className="mt-2 text-xs italic text-slate-600">「{member.catchphrase}」</p>
      <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
        <div>性格: {member.personality}</div>
        <div>得意: {member.strengths} / 苦手: {member.weaknesses}</div>
        <div className="font-medium text-indigo-700">✨ {member.specialSkill}</div>
      </dl>
      <div className="mt-2 space-y-1">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-[10px]">
            <span className="w-12 text-slate-500">{label}</span>
            <div className="h-1.5 flex-1 rounded bg-slate-100">
              <div
                className="h-1.5 rounded bg-indigo-400"
                style={{ width: `${member.stats[key]}%` }}
              />
            </div>
            <span className="w-6 text-right text-slate-500">{member.stats[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberList({ members }: { members: Member[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">👥 メンバー</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </section>
  );
}
