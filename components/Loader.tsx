import React, { useState, useEffect } from 'react';

const MESSAGES = [
    "Parsing Vibe Syntax...",
    "Looking for Spaghetti Logic...",
    "Predicting Future Refactors...",
    "Analyzing Git Blame potential...",
    "Simulating Production Load..."
];

const Loader: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-tech-surface2 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-tech-accent rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
          <p className="text-tech-accent font-mono text-sm font-medium">
            {MESSAGES[msgIndex]}
          </p>
          <p className="text-[10px] text-tech-muted uppercase tracking-widest">
            AI Processing
          </p>
      </div>
    </div>
  );
};

export default Loader;