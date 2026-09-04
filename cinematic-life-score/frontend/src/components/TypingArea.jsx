import { useState, useRef } from 'react';
import './TypingArea.css';

// Cinematic prompts — type these naturally, no need to hammer keys
const PROMPTS = [
  { text: 'The deadline is tonight. Every second counts.', mood: 'tense' },
  { text: 'Write about what you are working on right now.', mood: 'focused' },
  { text: 'Describe the last decision that kept you up at night.', mood: 'intense' },
  { text: 'The scene opens. You are the protagonist. Begin.', mood: 'cinematic' },
  { text: 'What would you do if today were your last day?', mood: 'intense' },
  { text: 'Summarise your current project in one sentence.', mood: 'focused' },
  { text: 'The clock ticks. The cursor blinks. You must decide.', mood: 'tense' },
  { text: 'Write the opening line of your life story.', mood: 'cinematic' },
];

export default function TypingArea({ disabled }) {
  const [promptIdx, setPromptIdx] = useState(
    () => Math.floor(Math.random() * PROMPTS.length)
  );
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const prompt = PROMPTS[promptIdx];

  const nextPrompt = () => {
    setPromptIdx(i => (i + 1) % PROMPTS.length);
    setValue('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className={`typing-area-wrap ${disabled ? 'typing-area-wrap--disabled' : ''}`}>
      <div className="typing-area-header">
        <div className="typing-area-label">
          <span className="typing-area-dot" />
          LIVE INPUT — TYPE HERE
        </div>
        <button
          className="typing-area-next"
          onClick={nextPrompt}
          disabled={disabled}
          title="New prompt"
        >
          ↻ NEW PROMPT
        </button>
      </div>

      {/* Prompt shown above textarea */}
      <div className={`typing-prompt typing-prompt--${prompt.mood}`}>
        "{prompt.text}"
      </div>

      <textarea
        ref={textareaRef}
        className="typing-area"
        placeholder="Start typing your response…"
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        rows={3}
        aria-label="Typing area for drama score detection"
      />

      <p className="typing-area-note">
        Type naturally — speed and rhythm are measured, not your words.
      </p>
    </div>
  );
}
