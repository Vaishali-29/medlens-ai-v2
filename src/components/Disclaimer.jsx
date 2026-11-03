export default function Disclaimer({ compact = false }) {
  return (
    <div role="note" className={`rounded-xl border border-line bg-mist ${compact ? 'p-3 text-sm' : 'p-5'} text-ink/80`}>
      <p><strong className="text-ink">Safety notice.</strong> MedLens AI reads and explains the text printed on a package. It does not diagnose, prescribe, suggest doses, check interactions, or say a medicine is safe. OCR can make mistakes, so always check details against the original package and ask a pharmacist or doctor about any medical question.</p>
    </div>
  );
}
