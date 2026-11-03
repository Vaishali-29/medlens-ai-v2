export default function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold text-xl tracking-tight">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#0F5C8E" /><circle cx="14" cy="14" r="6.5" fill="none" stroke="#fff" strokeWidth="2.5" /><path d="M19 19l6 6" stroke="#5FD3DC" strokeWidth="3" strokeLinecap="round" /></svg>
      <span className={light ? 'text-white' : 'text-ink'}>MedLens <span className="text-teal">AI</span></span>
    </span>
  );
}
