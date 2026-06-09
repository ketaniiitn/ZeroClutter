import { TranscriptSegmentInput } from '../../types';

export const buildAnalysisPrompt = (
  title: string,
  participants: string[],
  transcript: TranscriptSegmentInput[],
  meetingDate: Date,
): string => {
  const transcriptText = transcript
    .map((seg) => `[${seg.timestamp}] ${seg.speaker}: ${seg.text}`)
    .join('\n');

  const validTimestamps = transcript.map((s) => s.timestamp);

  const meetingDateStr = meetingDate.toISOString().split('T')[0];

  return `You are a precise meeting analysis engine. Your ONLY job is to extract information that is EXPLICITLY stated in the provided transcript. You must NEVER invent, infer, or assume information not directly present.

## MEETING INFORMATION
Title: ${title}
Meeting Date: ${meetingDateStr}
Participants listed: ${participants.join(', ')}

## TRANSCRIPT
${transcriptText}

## VALID TIMESTAMPS
The only valid citation timestamps are: ${validTimestamps.join(', ')}

## CRITICAL RULES (violations disqualify your response)
1. ONLY use information explicitly stated in the transcript above
2. NEVER invent attendees, action items, decisions, or outcomes
3. NEVER add information not directly in the transcript
4. Every single item in every section MUST have at least one citation
5. Citations MUST use timestamps from the VALID TIMESTAMPS list only
6. If there are no decisions in the transcript, return an empty decisions array
7. If there are no action items in the transcript, return an empty actionItems array
8. Keep citations accurate — cite the exact segment(s) that support each insight
9. For dueDate: use ISO 8601 format "YYYY-MM-DD". If an explicit calendar date is mentioned, use it directly. If a relative phrase like "by Friday", "next week", "end of month" is used, resolve it against the Meeting Date (${meetingDateStr}) and output the absolute date. Only set dueDate to null if no time reference at all is given

## OUTPUT FORMAT
Return ONLY a valid JSON object (no markdown, no explanation, no code blocks) matching this exact structure:

{
  "summary": [
    {
      "text": "One factual sentence summarizing a point explicitly discussed",
      "citations": [
        {
          "timestamp": "MM:SS",
          "speaker": "Name from transcript",
          "quote": "Exact or near-exact quote from transcript"
        }
      ]
    }
  ],
  "actionItems": [
    {
      "task": "Specific action item explicitly stated",
      "assignee": "Person who said they will do it (from transcript only)",
      "dueDate": "YYYY-MM-DD or null — resolve relative phrases against meeting date, null if no date mentioned",
      "citations": [
        {
          "timestamp": "MM:SS",
          "speaker": "Name from transcript",
          "quote": "Exact quote"
        }
      ]
    }
  ],
  "decisions": [
    {
      "text": "Decision explicitly made or agreed upon in the transcript",
      "citations": [
        {
          "timestamp": "MM:SS",
          "speaker": "Name from transcript",
          "quote": "Exact quote"
        }
      ]
    }
  ],
  "followUps": [
    {
      "text": "Suggested follow-up based only on what was explicitly discussed",
      "citations": [
        {
          "timestamp": "MM:SS",
          "speaker": "Name from transcript",
          "quote": "Exact quote that motivates this follow-up"
        }
      ]
    }
  ]
}

Return ONLY the JSON object. No other text.`;
};
