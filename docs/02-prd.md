# 2. Product Requirements Document (PRD)

## User roles
| Role | Description |
|---|---|
| Primary user | Patient, caregiver or household member scanning a package |
| Reviewer (future) | Pharmacist who validates extracted data |
| Developer/assessor | Runs demo mode and tests |

## Functional requirements
| ID | Requirement |
|---|---|
| FR1 | Accept JPG/JPEG/PNG up to 10 MB by file picker, camera capture (mobile) or drag-and-drop |
| FR2 | Show image preview before scanning |
| FR3 | Run OCR in the browser with a progress indicator |
| FR4 | Extract: name, ingredients, strength, manufacturer, batch, mfg date, expiry, printed dosage, warnings, storage |
| FR5 | Show "Not detected" for absent fields; never invent values |
| FR6 | Show source line and OCR confidence per field; flag low confidence (<70%) |
| FR7 | Evaluate expiry: expired / not expired / unable to determine; handle ambiguous formats |
| FR8 | Never use manufacturing date as expiry |
| FR9 | Display warnings, storage and printed dosage verbatim in distinct cards |
| FR10 | Explain known terms present in the text in English and Hindi, labelled as general definitions |
| FR11 | Allow manual edit and per-field "checked against package" |
| FR12 | Optional AI enhancement (Gemini by default, Claude switchable) via server proxy with evidence validation |
| FR13 | Save, view, delete one and delete all scans (LocalStorage; text only) |
| FR14 | Export printable report marking unverified fields |
| FR15 | Show disclaimer on landing, scanner, results and footer; medical questions redirect to a pharmacist/doctor |
| FR17 | Optional on-device image enhancement (contrast stretch + upscale), off by default, with fallback to the original image |
| FR18 | Expiry results that look implausible (more than 10 years ahead, or earlier than the manufacturing date) are reported as "unable to determine" |
| FR16 | Clearly labelled demo sample for demonstrations |

## Non-functional requirements
| ID | Requirement |
|---|---|
| NFR1 | Responsive at 375 px, tablet and desktop |
| NFR2 | Accessible: labelled controls, keyboard focus, skip link, alert/status roles, reduced-motion respect |
| NFR3 | Privacy: images never stored or uploaded by default; API key only on server |
| NFR4 | Graceful degradation when AI/network unavailable |
| NFR5 | Clear loading, empty, error and success states |
| NFR6 | No hard dependency on paid services |

## User stories and acceptance criteria
| Story | Acceptance criteria |
|---|---|
| US1 As a caregiver I want to upload a photo so that I can read the label clearly. | Valid image shows preview; invalid type/size shows a specific error. |
| US2 As a user I want the expiry date found so that I can check it. | Expiry shown with status; if absent, "Not detected" and "Unable to determine". |
| US3 As a user I want unclear terms explained so that I understand the label. | Only terms present in text are explained; marked Glossary or AI-generated. |
| US4 As a user I want to correct mistakes so that my record is accurate. | Edited field shows "Edited by you"; expiry recalculates. |
| US5 As a user I want to keep past scans so that I can refer back. | Saved scans persist after reload; can delete one or all with confirmation for all. |
| US6 As a user I want a printable report so that I can show a pharmacist. | Report lists all fields, marks unverified ones, includes OCR text and disclaimer. |
| US7 As a user I must not be misled about safety. | No screen states a medicine is safe; expiry card warns "not expired ≠ safe". |

## Feature specification highlights
- **Confidence:** per-line Tesseract confidence; a field uses the minimum across its source lines.
- **Name field:** heuristic, always "Needs checking".
- **AI merge:** only fills fields still "Not detected"; output labelled "Needs checking".
- **Expiry end-of-period:** month/year dates are valid through the last day of that month.
