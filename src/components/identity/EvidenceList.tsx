import { CheckCircleIcon } from '@phosphor-icons/react';

export function EvidenceList({ statements }: { statements: string[] }) {
  return (
    <div className="flex flex-col gap-[12px]">
      {statements.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <CheckCircleIcon size={22} weight="fill" color="#6f9e5e" style={{ flexShrink: 0, marginTop: 1 }} />
          <span className="font-hand text-ink" style={{ fontSize: 16, lineHeight: 1.25 }}>{s}</span>
        </div>
      ))}
    </div>
  );
}
