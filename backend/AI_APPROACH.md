# AI Approach

## Overview

The `POST /api/meetings/:id/analyze` endpoint uses Google Gemini 1.5 Flash to extract structured meeting intelligence from a raw transcript. The design prioritizes grounded outputs over creative generation — every insight must be traceable to a specific transcript segment.

---

## Prompt Design

The prompt follows a structured template with four distinct sections:

### 1. Context Injection
```
Title: <meeting title>
Participants listed: <participants>

TRANSCRIPT:
[00:10] John: We should launch next Friday.
[00:20] Alice: I will prepare release notes.
```

Transcript segments are formatted as `[timestamp] speaker: text` to make timestamps easily citable.

### 2. Valid Timestamps Constraint
```
VALID TIMESTAMPS: 00:10, 00:20
```

The prompt explicitly enumerates all valid timestamps from the transcript. The AI is instructed to cite only from this list, enabling the validation layer to reject hallucinated timestamps.

### 3. Anti-Hallucination Rules (Critical)
```
CRITICAL RULES:
1. ONLY use information explicitly stated in the transcript
2. NEVER invent attendees, action items, decisions, or outcomes
3. NEVER add information not directly in the transcript
4. Every single item MUST have at least one citation
5. Citations MUST use timestamps from the VALID TIMESTAMPS list only
6. If there are no decisions, return an empty decisions array
```

These rules are placed prominently and framed as disqualifiers ("violations disqualify your response") to leverage the model's instruction-following bias.

### 4. Strict JSON Output Format
```
Return ONLY a valid JSON object matching this exact structure: ...
```

Using Gemini's `responseMimeType: 'application/json'` in the generation config further constrains output format, eliminating the need to strip markdown code fences.

---

## Citation Strategy

Each generated insight carries a `citations` array containing:
```json
{
  "timestamp": "00:20",
  "speaker": "Alice",
  "quote": "I will prepare release notes."
}
```

Citations link back to specific transcript segments, allowing readers to verify the AI's claims independently.

**Citation fields:**
- `timestamp`: Required. Must match a valid segment timestamp.
- `speaker`: Optional but encouraged for clarity.
- `quote`: Optional near-verbatim excerpt from the transcript.

---

## Hallucination Prevention

Three layers of protection:

### Layer 1: Prompt Engineering
- Explicit "NEVER invent" instructions repeated in the prompt.
- Valid timestamp enumeration prevents fabricated time references.
- Instruction to return empty arrays when content is absent (rather than generating placeholder content).
- Temperature set to `0.1` — low randomness for factual extraction.

### Layer 2: Output Validation (Post-generation)
The `validateAndCleanResult()` function in `analysis.service.ts`:
1. Verifies every summary/decision/followUp has `text` (string) and `citations` (non-empty array).
2. Verifies every action item has `task`, `assignee`, and `citations`.
3. **Validates every citation's `timestamp` against the original transcript's timestamp list.**
4. Citations with invalid timestamps are removed.
5. If an item has no valid citations after filtering, the entire analysis is rejected with an `AIError`.

### Layer 3: Strict JSON Schema
Gemini's `responseMimeType: 'application/json'` prevents the model from embedding prose around the JSON, reducing parse errors and off-topic content.

---

## Output Validation Strategy

```
callGemini() → rawText
  ↓
JSON.parse(cleaned rawText)
  ↓
validateAndCleanResult(parsed, validTimestamps)
  ├── validates structure (fields present, correct types)
  ├── validates citation timestamps against transcript
  ├── removes citations with invalid timestamps
  └── throws AIError if any item has 0 valid citations after filtering
  ↓
Save to database (analysis + action items persisted)
```

---

## Action Items Auto-Persistence

When analysis is complete, AI-extracted action items are automatically saved to the `ActionItem` collection with:
- `status: PENDING` (initial state)
- `citations` from the AI output
- `meetingId` linking back to the source meeting

This enables the overdue detection and reminder workflow to process AI-extracted items without manual entry.

---

## Known Limitations

1. **Long transcripts:** Gemini 1.5 Flash has a 1M token context, but very long meetings may produce truncated outputs. A chunking strategy would be needed for 8+ hour transcripts.

2. **Ambiguous attribution:** When multiple people agree on a decision, the AI cites the most recent relevant segment. The first speaker may not always be cited.

3. **Timestamp format dependency:** The current implementation assumes `MM:SS` format timestamps. Non-standard formats (e.g., `1:30:45` for hour-long meetings) are supported by string matching, but the valid timestamps list may need normalization in production.

4. **Assignee matching:** The AI extracts assignees by name from the transcript. If the transcript uses nicknames not in the `participants` list, the assignee will still be the nickname. A fuzzy-matching step against the participants list could improve accuracy.

5. **Single-pass generation:** There is no feedback loop or re-prompting on validation failure. A retry with error context could improve success rates for edge-case transcripts.

6. **No confidence scores:** The current design does not emit a confidence score per insight. Production systems should include uncertainty quantification.
