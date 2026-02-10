
import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface QuizModuleProps {
  questions: QuizQuestion[];
  locationName: string;
}

const QuizModule: React.FC<QuizModuleProps> = ({ questions, locationName }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-hourglass-start text-slate-400 text-2xl"></i>
        </div>
        <h3 className="text-slate-600 font-medium">Preparing your custom quiz...</h3>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option.toLowerCase() === currentQuestion.answer.toLowerCase()) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (showResult) {
    return (
      <div className="p-6 text-center animate-in fade-in duration-500">
        <div className="mb-6 relative inline-block">
          <div className="w-32 h-32 rounded-full border-8 border-indigo-100 flex items-center justify-center mx-auto">
            <span className="text-4xl font-black text-indigo-600">{Math.round((score / questions.length) * 100)}%</span>
          </div>
          <i className="fa-solid fa-trophy text-yellow-500 text-4xl absolute -top-2 -right-2 transform rotate-12"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Completed!</h2>
        <p className="text-slate-500 mb-8">You scored {score} out of {questions.length} questions about {locationName}.</p>
        <button
          onClick={restartQuiz}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
          Question {currentIdx + 1} / {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= currentIdx ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          ))}
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-8 leading-tight">
        {currentQuestion.question}
      </h3>

      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, i) => {
          const isSelected = selectedOption === option;
          const isCorrect = option.toLowerCase() === currentQuestion.answer.toLowerCase();
          
          let cardStyle = "bg-white border-2 border-slate-100 text-slate-700";
          if (isAnswered) {
            if (isCorrect) cardStyle = "bg-emerald-50 border-emerald-500 text-emerald-700";
            else if (isSelected) cardStyle = "bg-rose-50 border-rose-500 text-rose-700";
          } else if (isSelected) {
            cardStyle = "bg-indigo-50 border-indigo-500 text-indigo-700";
          }

          return (
            <button
              key={i}
              disabled={isAnswered}
              onClick={() => handleAnswer(option)}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all ${cardStyle} active:scale-98 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {isAnswered && isCorrect && <i className="fa-solid fa-circle-check text-emerald-500"></i>}
                {isAnswered && !isCorrect && isSelected && <i className="fa-solid fa-circle-xmark text-rose-500"></i>}
              </div>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="bg-slate-50 p-4 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-slate-600 italic">
            <span className="font-bold text-slate-700 not-italic">Did you know? </span>
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      <button
        disabled={!isAnswered}
        onClick={nextQuestion}
        className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all ${
          isAnswered ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-400 shadow-none'
        }`}
      >
        {currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
      </button>
    </div>
  );
};

export default QuizModule;
