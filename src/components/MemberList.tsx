import type { Member } from "../types/scenario";

const STAT_LABELS = [
  ["technical", "技術"],
  ["communication", "コミュ"],
  ["mental", "メンタル"],
  ["luck", "運"],
] as const;

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="rounded-xl border border-line bg-card-raised/50 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl">
          {member.emoji}
        </span>
        <div>
          <div className="text-sm font-bold">{member.name}</div>
          <div className="text-xs text-ink-muted">{member.role}</div>
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed italic text-ink-muted">
        「{member.catchphrase}」
      </p>
      <dl className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink-muted">
        <div>
          <dt className="inline font-medium">性格: </dt>
          <dd className="inline">{member.personality}</dd>
        </div>
        <div>
          <dt className="inline font-medium">得意: </dt>
          <dd className="inline">{member.strengths}</dd>
        </div>
        <div>
          <dt className="inline font-medium">苦手: </dt>
          <dd className="inline">{member.weaknesses}</dd>
        </div>
        <div className="rounded-md bg-accent-soft px-2 py-1 font-medium text-accent-ink">
          ✨ {member.specialSkill}
        </div>
      </dl>
      <div className="mt-2 space-y-1">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-[10px]">
            <span className="w-12 text-ink-muted">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
                style={{ width: `${member.stats[key]}%` }}
              />
            </div>
            <span className="w-6 text-right text-ink-muted">
              {member.stats[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberList({ members }: { members: Member[] }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-ink-muted">👥 メンバー</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </section>
  );
}
