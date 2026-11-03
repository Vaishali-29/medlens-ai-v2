// Static plain-language glossary. These are GENERAL definitions, not statements from the package.
// Shown only for terms that actually appear in the OCR text. No dosage, safety or interaction advice.
export const GLOSSARY = [
  { term: 'tablet', en: 'A solid, pressed form of medicine that is usually swallowed.', hi: 'दबाकर बनाई गई ठोस दवा, जिसे आम तौर पर निगला जाता है।' },
  { term: 'capsule', en: 'Medicine inside a dissolvable shell that is usually swallowed whole.', hi: 'घुलने वाले खोल में भरी दवा, जिसे आम तौर पर पूरा निगला जाता है।' },
  { term: 'syrup', en: 'A liquid form of medicine, often sweetened.', hi: 'दवा का तरल रूप, अक्सर मीठा।' },
  { term: 'mg', en: 'Milligram, a very small unit of weight (one thousandth of a gram). It shows how much of an ingredient is in one unit.', hi: 'मिलीग्राम, वज़न की बहुत छोटी इकाई। यह बताती है कि एक इकाई में सामग्री की कितनी मात्रा है।' },
  { term: 'mcg', en: 'Microgram, one thousandth of a milligram.', hi: 'माइक्रोग्राम, एक मिलीग्राम का हज़ारवां हिस्सा।' },
  { term: 'ml', en: 'Millilitre, a unit of liquid volume.', hi: 'मिलीलीटर, तरल की मात्रा की इकाई।' },
  { term: 'iu', en: 'International Unit, a measure used for some vitamins and hormones.', hi: 'अंतर्राष्ट्रीय इकाई, कुछ विटामिन और हार्मोन के लिए प्रयुक्त माप।' },
  { term: ' ip', en: 'Indian Pharmacopoeia: the quality standard the product claims to follow.', hi: 'भारतीय फार्माकोपिया: वह गुणवत्ता मानक जिसका उत्पाद पालन करने का दावा करता है।' },
  { term: 'bp', en: 'British Pharmacopoeia: a quality standard the product claims to follow.', hi: 'ब्रिटिश फार्माकोपिया: एक गुणवत्ता मानक।' },
  { term: 'usp', en: 'United States Pharmacopeia: a quality standard the product claims to follow.', hi: 'यूनाइटेड स्टेट्स फार्माकोपिया: एक गुणवत्ता मानक।' },
  { term: 'contraindication', en: 'A situation in which the label says the medicine should not be used.', hi: 'ऐसी स्थिति जिसमें लेबल के अनुसार दवा का उपयोग नहीं करना चाहिए।' },
  { term: 'batch', en: 'A code for the production lot. It helps the maker trace the product.', hi: 'उत्पादन खेप का कोड, जिससे निर्माता उत्पाद का पता लगा सकता है।' },
  { term: 'b.no', en: 'Batch number: a code for the production lot.', hi: 'बैच नंबर: उत्पादन खेप का कोड।' },
  { term: 'mfg', en: 'Manufacturing date: when the product was made. It is not the expiry date.', hi: 'निर्माण तिथि: उत्पाद कब बना। यह समाप्ति तिथि नहीं है।' },
  { term: 'mfd', en: 'Manufactured (or manufacturing date). It is not the expiry date.', hi: 'निर्मित / निर्माण तिथि। यह समाप्ति तिथि नहीं है।' },
  { term: 'exp', en: 'Expiry date: the date printed by the maker after which they do not stand behind the product.', hi: 'समाप्ति तिथि: निर्माता द्वारा छपी वह तारीख जिसके बाद वे उत्पाद की ज़िम्मेदारी नहीं लेते।' },
  { term: 'schedule h', en: 'In India, a label marking that the medicine is sold only on a registered doctor’s prescription.', hi: 'भारत में, यह चिह्न बताता है कि दवा केवल पंजीकृत डॉक्टर के पर्चे पर बिकती है।' },
  { term: 'rx', en: 'A symbol meaning "prescription". The label indicates it is meant to be used on a doctor’s prescription.', hi: 'पर्चे का चिह्न: यह दवा डॉक्टर के पर्चे पर उपयोग के लिए है।' },
  { term: 'enteric', en: 'A coating designed to pass through the stomach before dissolving.', hi: 'ऐसी परत जो पेट से गुज़रने के बाद घुलती है।' },
  { term: 'uncoated', en: 'A tablet with no outer coating layer.', hi: 'बिना बाहरी परत वाली गोली।' },
  { term: 'excipient', en: 'An ingredient that is not the active medicine, such as a filler or binder.', hi: 'वह सामग्री जो सक्रिय दवा नहीं है, जैसे भराव या बाइंडर।' },
  { term: 'physician', en: 'A medical doctor.', hi: 'चिकित्सक।' },
];

export function explainTerms(ocrText) {
  const t = ' ' + ocrText.toLowerCase().replace(/\s+/g, ' ');
  return GLOSSARY.filter((g) => t.includes(g.term.startsWith(' ') ? g.term : g.term)).map((g) => ({
    term: g.term.trim().toUpperCase(), en: g.en, hi: g.hi, source: 'glossary',
  }));
}
