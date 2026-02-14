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
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Question */}
      <div>
        <label
          htmlFor="question"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Question
        </label>
        <input
          id="question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to ask?"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 text-white"
          maxLength={500}
        />
        {fieldErrors.question && (
          <p className="mt-1 text-sm text-red-400">
            {fieldErrors.question[0]}
          </p>
        )}
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Options
        </label>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 text-white"
                maxLength={200}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
                  title="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {fieldErrors.options && (
          <p className="mt-1 text-sm text-red-400">
            {fieldErrors.options[0]}
          </p>
        )}
        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm text-gray-300 transition-colors"
          >
            + Add Option
          </button>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? 'Creating...' : 'Create Poll'}
      </button>
    </form>
  );
}
