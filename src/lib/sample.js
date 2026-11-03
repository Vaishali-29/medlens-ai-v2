// DEMO DATA ONLY. Fictional product, not a real scan, not a real medicine label.
export const SAMPLE_LINES = [
  'DEMO TABLETS IP 500 mg',
  'Each uncoated tablet contains:',
  'Demo Ingredient IP 500 mg',
  'Mfd. by: Sample Pharma Ltd.',
  'Indore, M.P.',
  'B.No.: DEMO0001',
  'Mfg. Date: 03/2025',
  'Exp. Date: 02/2028',
  'Dosage: As directed by the physician.',
  'Warning: Keep out of reach of children. Do not exceed the stated dose.',
  'Store in a cool, dry place below 25°C. Protect from light.',
].map((text) => ({ text, conf: null }));
