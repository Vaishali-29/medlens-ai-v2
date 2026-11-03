# 1. Project Overview

## Introduction
MedLens AI ("Scan. Understand. Stay Informed.") is a web app that reads the printed text on medicine packaging (boxes, strips, bottles), organises it into labelled fields, and explains difficult terms in simple English or Hindi. It is an information-display tool only.

## Problem statement
Medicine labels are dense, small-print and full of abbreviations (IP, B.No., Mfd, Schedule H). People, including elderly users and caregivers, often struggle to find the expiry date, batch number or storage conditions, or to understand what the printed terms mean.

## Existing problem and proposed solution
| Today | With MedLens AI |
|---|---|
| Squint at small print; abbreviations unexplained | Photo is read and organised into clear cards |
| Easy to confuse manufacturing and expiry dates | Dates kept separate; ambiguity flagged, never guessed |
| General AI chatbots may invent details | Every value shows its source line; "Not detected" when missing; AI output rejected if its evidence is not in the OCR text |

## Objectives
1. Extract ten fields from a label photo with visible evidence and confidence.
2. Explain hard terms in plain language, clearly separated from package text.
3. Handle expiry conservatively (expired / not expired / unable to determine).
4. Let users correct and verify every value.
5. Keep data private: no image storage, local-only history, no API key in the browser.
6. Demonstrate responsible AI in a healthcare context.

## Target audience
Elderly patients and caregivers; people managing a household medicine cabinet; non-native readers of English labels; pharmacy and health-literacy volunteers.

## Scope
**In scope:** upload/drag-drop of JPG/JPEG/PNG, English OCR, rule-based extraction, optional Gemini structuring, glossary explanations (EN/HI), expiry evaluation, manual correction, local history, printable report.
**Out of scope / limitations:** diagnosis, prescribing, dosage advice, interaction or treatment advice, safety verdicts, drug databases, user accounts, cloud storage, non-English OCR, regulatory approval. OCR accuracy depends on photo quality.

## Unique selling points
- **Evidence-first:** each value links to its exact source line and OCR confidence.
- **Hallucination guard:** AI values are accepted only when quoted evidence exists verbatim in the OCR text, and AI can only fill gaps, never override.
- **Conservative expiry logic** with explicit ambiguity handling.
- **Works without any API key** (OCR + rules fallback).
- **Privacy by design:** on-device OCR, no stored images, key kept server-side.
