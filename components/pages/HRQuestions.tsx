
import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../../types';
import { analyzeHRAnswers } from '../../services/geminiService';
import { Button, Loader, Card, ArrowRightIcon } from '../ui';

interface HRQuestionsProps {
    setPage: (page: Page) => void;
}

const questions = [
    {
        question: "You discover a critical bug in production just before a major holiday weekend. Your manager is unreachable. What is your most appropriate immediate action?",
        options: [
            "Attempt to fix it yourself immediately, even if it's risky.",
            "Document the bug thoroughly and wait for your manager to return.",
            "Use the established emergency protocol to contact the on-call senior engineer.",
            "Send an email to the entire team asking for suggestions."
        ],
        answer: 2
    },
    {
        question: "A junior colleague is struggling with a task you are familiar with. They have been quiet and haven't asked for help. You should:",
        options: [
            "Wait for them to ask for help to encourage independence.",
            "Report their lack of progress to your manager.",
            "Publicly offer help in a team meeting to show you are a team player.",
            "Privately and gently offer your assistance or guidance."
        ],
        answer: 3
    },
    {
        question: "You are in a meeting and disagree with a decision being made by the team lead. The best course of action is to:",
        options: [
            "Interrupt the lead to voice your concerns immediately.",
            "Remain silent to avoid conflict.",
            "Respectfully state your alternative viewpoint with supporting reasons.",
            "Discuss your disagreement with other colleagues after the meeting."
        ],
        answer: 2
    },
    {
        question: "You've completed your tasks for the current sprint ahead of schedule. What should you do with the extra time?",
        options: [
            "Start working on tasks for the next sprint without telling anyone.",
            "Take the rest of the time off since your work is done.",
            "Ask your team lead or colleagues if anyone needs help with their tasks.",
            "Spend the time on personal learning unrelated to the project."
        ],
        answer: 2
    },
    {
        question: "You receive feedback from a code review that you feel is unfair or incorrect. How do you respond?",
        options: [
            "Ignore the feedback and merge your code anyway.",
            "Start a respectful discussion in the code review comments to understand the reviewer's perspective and explain your reasoning.",
            "Complain about the reviewer to your manager.",
            "Immediately change the code as requested, even if you believe it's wrong."
        ],
        answer: 1
    }
];

export const HRQuestions: React.FC<HRQuestionsProps> = ({ setPage }) => {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ feedback: string[], score: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    const handleAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userAnswersArray = questions.map((_, i) => answers[i] ?? -1); // Default to -1 if not answered
            const analysisResult = await analyzeHRAnswers(questions, userAnswersArray);
            setResult(analysisResult);
            localStorage.setItem('hrAnalysis', JSON.stringify(analysisResult));
        } catch (err) {
            console.error("HR analysis failed:", err);
            setError("Sorry, the AI analysis failed. Please try again.");
            localStorage.setItem('hrAnalysis', JSON.stringify({ error: "AI analysis failed" }));
        } finally {
            setIsLoading(false);
        }
    }, [answers]);

    useEffect(() => {
        if (result || isLoading) return;

        if (timeLeft <= 0) {
            handleAnalysis();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, result, isLoading, handleAnalysis]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleAnswerSelect = (qIndex: number, aIndex: number) => {
        setAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
    };

    if (isLoading) {
        return <Loader message="Analyzing your behavioral answers..." />;
    }

    if (result) {
        return (
            <div className="animate-fade-in text-center">
                <h2 className="text-3xl font-bold text-primary-400 mb-4">HR Assessment Complete</h2>
                <Card borderColor="primary">
                    <h3 className="text-xl font-semibold mb-3">AI Feedback</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 text-left mb-4">
                        {result.feedback.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                    <p className="text-xl">Your Score: <span className="font-bold text-primary-300">{result.score}/10</span></p>
                </Card>
                <Button onClick={() => setPage('prep-voice')} className="mt-8">
                    Next: Voice Assessment <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in relative">
            <div className="absolute top-0 right-0 bg-surface text-white px-3 py-1.5 rounded-lg shadow-lg font-mono text-sm border border-slate-700">
                Time Left: {formatTime(timeLeft)}
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Step 2: HR Questions</h2>
            <p className="text-center text-gray-400 mb-6">Answer the following situational judgment questions.</p>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <Card key={qIndex}>
                        <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((opt, aIndex) => (
                                <label key={aIndex} className={`block p-3 rounded-lg border transition-colors cursor-pointer ${answers[qIndex] === aIndex ? 'bg-primary-900/80 border-primary-500' : 'bg-surface border-slate-700 hover:bg-surface-accent'}`}>
                                    <input
                                        type="radio"
                                        name={`q-${qIndex}`}
                                        checked={answers[qIndex] === aIndex}
                                        onChange={() => handleAnswerSelect(qIndex, aIndex)}
                                        className="hidden"
                                    />
                                    <span className="text-gray-300">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
            <div className="mt-8 text-center">
                <Button onClick={handleAnalysis} disabled={Object.keys(answers).length !== questions.length}>
                    Submit & Analyze
                </Button>
            </div>
        </div>
    );
};
