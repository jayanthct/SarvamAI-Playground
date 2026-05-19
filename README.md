<div align="center">

<img src="https://www.sarvam.ai/favicon.svg" alt="SarvamAI Playground" height="80" />

# SarvamAI — On-Device Frontend Intern Assignment

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG%20AA-16A05A?style=flat-square)](#accessibility)

[**GitHub**](https://github.com/jayanthct/SarvamAI-Playground) · [**Figma Design**](https://www.figma.com/design/Ci9ix2eiqDKkAKxQwhgblm/SarvamAI---Playground?node-id=0-1&t=7amzDbsnxuVXxdDZ-1) · [**Live Demo**](https://sarvam-ai-playground.vercel.app/) · [**Video Walkthrough**](https://drive.google.com/file/d/1P9zR8YFwaMx0Iw6UDNPr4RLvWgMAo2oa/view?usp=sharing)

</div>

---

## Overview

SarvamAI Playground is a frontend developer portal built as part of a frontend intern assignment for an on-device AI company. It provides enterprise engineers with a browser-based interface to:

- **Test** on-device mock Two models inference through a live streaming playground
- **Inspect** and compare model outputs using a token-level diff view
- **Monitor** real-time inference metrics as tokens stream in
  
---

## Features

### Part A — Inference Playground

#### Multi-Modal Input
Switch between text and audio input modes. The audio mode uses the Web Speech API for real-time speech-to-text, appending transcribed speech to any existing text in the prompt field.

#### Token-by-Token Streaming
Responses stream live using the **Fetch API** and **ReadableStream** — tokens appear word by word without waiting for the full response. The stream is parsed from SSE-formatted chunks (`data: {...}`) identical to the OpenAI chat completions format.

#### Live Metrics
While streaming, two metrics update continuously with every arriving token:
- **Token counter** — total tokens received so far
- **Tokens per second** — calculated from elapsed time since stream started

#### Error Handling
The playground handles mid-stream failures gracefully:

| Scenario | Behaviour |
|---|---|
| Network drop | Partial output preserved, error banner shown |
| Model timeout | Timeout message shown, no blank screen |
| User interrupted | Output preserved up to the stop point |
| Malformed chunk | Silently skipped, stream continues |

#### Accessibility
- Fully keyboard navigable — `Tab` to move, `Enter` to submit, `Esc` to stop
- All interactive elements have `aria-label` and `title` attributes
- Live regions (`aria-live="polite"`) announce streaming state to screen readers
- WCAG AA colour contrast on all text and UI elements
- Focus-visible rings on all interactive controls

---

### Part B — Model Output Diff View

Side-by-side comparison interface for inspecting outputs from two model versions on the same prompt.

#### Token-Level Diffing
Differences are highlighted at the **individual word/token level** — not by line. Changed, added, and removed words are colour-coded:

| Colour | Meaning |
|---|---|
| 🟢 Green highlight | Token added in updated model |
| 🔴 Red + strikethrough | Token removed from baseline |

#### Custom Diff Algorithm
The diffing algorithm is implemented from scratch — no external diff libraries used.

**Algorithm: Word-level Longest Common Subsequence (LCS) via Dynamic Programming**

Both outputs are split into word token arrays. A DP table of size `(m+1) × (n+1)` is filled where `m` and `n` are the word counts of each output. The table is then backtracked to classify each token as unchanged, added, or removed.

```
Time complexity:  O(m × n)  — DP table construction
Space complexity: O(m × n)  — DP table storage
```

**Why LCS over alternatives:**

- **Myers diff** — optimised for line-level code diffs. Overkill and harder to implement for short AI output paragraphs where word-level is the right granularity.
- **Levenshtein distance** — gives edit distance as a number but doesn't produce the token-by-token diff sequence needed for highlighting.
- **Simple split + compare** — O(n) but misses non-contiguous matches entirely (e.g. a word that moved position would show as both deleted and added).
- **LCS on words** — finds the longest sequence of words common to both outputs, making it the minimum set of changes needed. Simple to implement, correct output, fast enough for the text lengths involved.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Component model fits the playground/diff split naturally |
| Build tool | Vite 5 | Fast HMR, first-class TypeScript support |
| Styling | Tailwind CSS | Utility-first, consistent spacing and colour tokens |
| Streaming | Fetch API + ReadableStream | Native browser APIs, no library dependency |
| Speech | Web Speech API | Built-in browser, no third-party SDK |
| State | React Context + useState | Lightweight, no external store needed for this scope |
| Fonts | Matter (primary) · Season (display) | As per Sarvam.ai design system |

---

## Project Structure

```
src/
├── Assets/
│   ├── Icons/          # mic, send, mute SVGs
│   └── Images/         # logo
├── components/
│   └── Textarea/       # Multi-modal input with speech recognition
├── context/
│   └── ChatContext/    # Shared prompt + submission state
├── lib/
│   ├── mockResponse.ts # SSE chunk builders + mock token arrays
│   ├── mockStream.ts   # ReadableStream factory (drop-in for real fetch)
│   └── inferenceStream.ts # Core streaming + metrics logic
├── pages/
│   ├── Chat/           # Part A — Inference playground
│   └── Diff/           # Part B — Token-level diff view
└── main.tsx
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/jayanthct/SarvamAI-Playground.git
cd SarvamAI-Playground

# Install
npm install

# Run dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Switching from Mock to Real API

The streaming function uses a `mockFetch()` that returns a `Response` with a `ReadableStream` body in the same SSE format as a real API. To switch to a live model, replace one line:

```ts
// mockStream.ts — swap this line
const response = mockFetch('gemma-2-2b-it-v1');

// with a real fetch call
const response = await fetch('/api/inference', {
  method: 'POST',
  body: JSON.stringify({ prompt }),
  signal,
});
```

Everything downstream — the SSE parser, metrics, error handling — stays the same.

---

## Design

The UI is designed around the [Sarvam.ai](https://www.sarvam.ai) design language

**Figma:** [View full design file →](https://www.figma.com/design/Ci9ix2eiqDKkAKxQwhgblm/SarvamAI---Playground?node-id=0-1&t=7amzDbsnxuVXxdDZ-1)

Fonts used: **Matter** (UI text) and **Season** (display headings).

---

## Accessibility

- All buttons have `aria-label` and `title`
- Textarea has `aria-multiline="true"` and `aria-label`
- Metrics section uses `aria-live="polite"` and `aria-atomic="false"` for live updates
- Error banners use `role="alert"` and `aria-live="assertive"`
- Audio waveform bars are `aria-hidden="true"` (decorative)
- Focus rings on all interactive elements via `focus-visible:ring-2`
- Colour contrast tested to WCAG AA on all text combinations

---
