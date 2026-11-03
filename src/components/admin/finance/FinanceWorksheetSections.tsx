import React, { useId, useState } from 'react';
import { DashboardFilterGroup } from '../DashboardControls';

type FinanceSection = {
  key: string;
  label: string;
  content: React.ReactNode;
};

/** Switch between working surfaces without discarding register search or pagination. */
export function FinanceWorksheetSections({
  label,
  sections,
  defaultSection,
}: {
  label: string;
  sections: FinanceSection[];
  defaultSection?: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState(defaultSection ?? sections[0].key);
  const active = sections.some(section => section.key === selected) ? selected : sections[0].key;
  return (
    <div className="min-w-0 space-y-4">
      <DashboardFilterGroup
        ariaLabel={label}
        value={active}
        options={sections.map(section => ({ value: section.key, label: section.label }))}
        onChange={setSelected}
      />
      {sections.map(section => (
        <section
          key={section.key}
          id={id + '-' + section.key}
          aria-label={section.label}
          hidden={section.key !== active}
          className="min-w-0 space-y-4"
        >
          {section.content}
        </section>
      ))}
    </div>
  );
}
