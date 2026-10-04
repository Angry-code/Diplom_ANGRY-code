import { useState } from 'react';

export default function ConfStep({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`conf-step ${open ? 'conf-step_open' : ''}`}>
      <header
        className="conf-step__header"
        onClick={() => setOpen((v) => !v)}
      >
        <h2 className="conf-step__title">{title}</h2>
        <span className="conf-step__arrow" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </header>

      {open && (
        <div className="conf-step__wrapper">
          {children}
        </div>
      )}
    </section>
  );
}