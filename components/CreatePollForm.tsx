'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    // Client-side pre-validation
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim());

    if (!trimmedQuestion) {
      setError('Question is required');
      setLoading(false);
      return;
    }

    if (trimmedOptions.some((o) => !o)) {
      setError('All options must have text');
      setLoading(false);
      return;
    }

    const uniqueCheck = new Set(trimmedOptions.map((o) => o.toLowerCase()));
    if (uniqueCheck.size !== trimmedOptions.length) {
      setError('Duplicate options are not allowed');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/createPoll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedQuestion,
          options: trimmedOptions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        setError(data.error || 'Failed to create poll');
        return;
      }

      router.push(`/poll/${data.id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-scale-in">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400 shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Question */}
      <div className="space-y-2">
        <label htmlFor="question" className="block text-sm font-medium text-gray-300">
          Question
        </label>
        <input
          id="question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What&apos;s your favorite framework?"
          className="input-field"
          maxLength={500}
        />
        {fieldErrors.question && (
          <p className="text-xs text-red-400 mt-1">{fieldErrors.question[0]}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">
            Options
          </label>
          <span className="text-xs text-gray-600">{options.length}/10</span>
        </div>
        <div className="space-y-2.5">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 animate-scale-in">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-medium">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="input-field pl-10"
                  maxLength={200}
                />
              </div>
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="shrink-0 w-12 flex items-center justify-center bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 rounded-xl text-gray-500 hover:text-red-400 transition-all duration-200"
                  title="Remove option"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.499.12l-.5-5.999a.75.75 0 01.72-.78zm2.84 0a.75.75 0 01.72.78l-.5 6a.75.75 0 01-1.499-.12l.5-5.999a.75.75 0 01.78-.72z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {fieldErrors.options && (
          <p className="text-xs text-red-400">{fieldErrors.options[0]}</p>
        )}
        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            className="w-full py-3 border-2 border-dashed border-white/[0.08] hover:border-violet-500/30 rounded-xl text-sm text-gray-500 hover:text-violet-400 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Option
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Submit */}
      <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating poll...
          </span>
        ) : (
          'Create Poll'
        )}
      </button>
    </form>
  );
}
