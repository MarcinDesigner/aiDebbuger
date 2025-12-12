import React, { useEffect, useRef, useMemo } from 'react';
import { AnalysisItem, RiskLevel } from '../types';

interface CodeViewerProps {
  code: string;
  issues: AnalysisItem[];
  selectedIssueId: string | null;
  onIssueSelect: (id: string | null) => void;
  fixedIssueIds: Set<string>;
}

// --- Syntax Highlighting Logic ---

type Token = {
  text: string;
  type: 'text' | 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'function';
};

const PATTERNS = {
  tsx: {
    // We prioritize strings and comments to avoid matching keywords inside them
    // Strings: Double, Single, Backtick
    strings: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
    comments: /\/\/.*$/gm,
    // Common JS/TS/React keywords
    keywords: /\b(const|let|var|function|return|if|else|for|while|import|export|from|default|type|interface|class|extends|implements|new|this|try|catch|finally|switch|case|break|continue|async|await|void|number|string|boolean|any|React|useState|useEffect|useMemo|useCallback|useRef|useContext)\b/g,
    numbers: /\b\d+\b/g,
    types: /\b[A-Z][a-zA-Z0-9]*\b/g,
    functions: /\b[a-z][a-zA-Z0-9]*\s*(?=\()/g,
  },
  python: {
    strings: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    comments: /#.*$/gm,
    keywords: /\b(def|class|if|else|elif|for|while|return|import|from|as|pass|break|continue|try|except|finally|raise|with|lambda|global|nonlocal|True|False|None)\b/g,
    numbers: /\b\d+\b/g,
    types: /\b[A-Z][a-zA-Z0-9]*\b/g,
    functions: /\b[a-z][a-zA-Z0-9_]*\s*(?=\()/g,
  }
};

const getColorClass = (type: Token['type']) => {
  switch (type) {
    case 'keyword': return 'text-[#C678DD]'; // Purple
    case 'string': return 'text-[#98C379]'; // Green
    case 'comment': return 'text-[#5C6370] italic'; // Grey
    case 'number': return 'text-[#D19A66]'; // Orange
    case 'type': return 'text-[#E5C07B]'; // Yellow
    case 'function': return 'text-[#61AFEF]'; // Blue
    default: return 'text-tech-primary'; // Default
  }
};

const detectLanguage = (code: string): 'tsx' | 'python' => {
  if (code.includes('def ') && (code.includes(':') || code.includes('import '))) return 'python';
  return 'tsx';
};

const tokenizeLine = (line: string, lang: 'tsx' | 'python'): Token[] => {
  // Strategy: We will maintain a list of segments and iteratively split them based on patterns.
  // Order matters: Strings -> Comments -> Keywords -> Types -> Functions -> Numbers
  
  let segments: Token[] = [{ text: line, type: 'text' }];
  const rules = PATTERNS[lang];

  const applyPattern = (pattern: RegExp, type: Token['type']) => {
    const newSegments: Token[] = [];
    segments.forEach(segment => {
      if (segment.type !== 'text') {
        newSegments.push(segment);
        return;
      }
      
      const text = segment.text;
      const matches = Array.from(text.matchAll(pattern));
      
      if (matches.length === 0) {
        newSegments.push(segment);
        return;
      }

      let lastIndex = 0;
      matches.forEach(match => {
        const matchIndex = match.index!;
        const matchText = match[0];

        // Text before match
        if (matchIndex > lastIndex) {
          newSegments.push({ text: text.substring(lastIndex, matchIndex), type: 'text' });
        }
        
        // The match itself
        newSegments.push({ text: matchText, type });
        
        lastIndex = matchIndex + matchText.length;
      });

      // Remaining text
      if (lastIndex < text.length) {
        newSegments.push({ text: text.substring(lastIndex), type: 'text' });
      }
    });
    segments = newSegments;
  };

  // 1. Strings (Highest priority to avoid matching keywords inside)
  applyPattern(rules.strings, 'string');
  
  // 2. Comments
  applyPattern(rules.comments, 'comment');

  // 3. Keywords
  applyPattern(rules.keywords, 'keyword');

  // 4. Types (Capitalized)
  applyPattern(rules.types, 'type');

  // 5. Functions
  applyPattern(rules.functions, 'function');
  
  // 6. Numbers
  applyPattern(rules.numbers, 'number');

  return segments;
};

// --- Component ---

const CodeViewer: React.FC<CodeViewerProps> = ({ code, issues, selectedIssueId, onIssueSelect, fixedIssueIds }) => {
  const lines = code.split('\n');
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Detect language once
  const lang = useMemo(() => detectLanguage(code), [code]);

  // Create a map for fast lookup: line number -> issue
  const issueMap = new Map<number, AnalysisItem>();
  issues.forEach(issue => {
    if (issue.lineStart) {
        // If a security issue exists, it takes precedence
        const existing = issueMap.get(issue.lineStart);
        if (!existing || (existing.whyDetection.includes('Regex') === false && issue.whyDetection.includes('Regex'))) {
            issueMap.set(issue.lineStart, issue);
        }
    }
  });

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
        case RiskLevel.HIGH: return 'bg-[#D66A6A]';
        case RiskLevel.MEDIUM: return 'bg-[#E6B566]';
        case RiskLevel.LOW: return 'bg-[#6BBF9B]';
        default: return 'bg-tech-muted';
    }
  };

  const getBorderColor = (risk: RiskLevel) => {
    switch (risk) {
        case RiskLevel.HIGH: return 'border-[#D66A6A]';
        case RiskLevel.MEDIUM: return 'border-[#E6B566]';
        case RiskLevel.LOW: return 'border-[#6BBF9B]';
        default: return 'border-tech-muted';
    }
  };

  useEffect(() => {
    if (selectedIssueId) {
      const issue = issues.find(i => i.id === selectedIssueId);
      if (issue && lineRefs.current[issue.lineStart - 1]) {
        lineRefs.current[issue.lineStart - 1]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIssueId, issues]);

  return (
    <div className="font-mono text-sm h-full overflow-y-auto bg-tech-bg p-4 custom-scrollbar scroll-smooth">
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        const issue = issueMap.get(lineNumber);
        const hasIssue = !!issue;
        const isSelected = issue?.id === selectedIssueId;
        const isFixed = issue ? fixedIssueIds.has(issue.id) : false;
        
        // Determine background class based on state to highlight the whole line
        let bgClass = 'hover:bg-tech-surface2'; // Default hover
        if (isSelected) {
            bgClass = 'bg-[#242B52]/90'; // Strong active selection
        } else if (hasIssue && issue) {
             if (isFixed) {
                // Fixed = Green subtle background
                bgClass = 'bg-[#6BBF9B]/10 hover:bg-[#6BBF9B]/20';
             } else {
                // Light background based on risk level
                switch (issue.risk) {
                    case RiskLevel.HIGH: bgClass = 'bg-[#D66A6A]/15 hover:bg-[#D66A6A]/25'; break;
                    case RiskLevel.MEDIUM: bgClass = 'bg-[#E6B566]/10 hover:bg-[#E6B566]/20'; break;
                    case RiskLevel.LOW: bgClass = 'bg-[#6BBF9B]/10 hover:bg-[#6BBF9B]/20'; break;
                }
             }
        }
        
        // Tokenize line for syntax highlighting
        // We only tokenize if the line is not extremely long to avoid perf issues on massive minified files
        const tokens = line.length < 500 ? tokenizeLine(line, lang) : [{ text: line, type: 'text' as const }];
        
        // Indicator color Logic
        const indicatorColorClass = isFixed ? 'bg-[#6BBF9B]' : (issue ? getRiskColor(issue.risk) : 'bg-transparent');
        const borderColorClass = isFixed ? 'border-[#6BBF9B]' : (issue ? getBorderColor(issue.risk) : 'border-tech-border');

        return (
          <div 
            key={index} 
            ref={(el) => { lineRefs.current[index] = el; }}
            onClick={() => {
                if (hasIssue && issue) {
                    onIssueSelect(issue.id);
                } else {
                    onIssueSelect(null);
                }
            }}
            className={`
                flex group transition-colors duration-200 relative cursor-pointer
                ${bgClass}
            `}
          >
            {/* Active Indicator (Left Border) */}
            <div className={`
                absolute left-0 top-0 bottom-0 w-[3px] transition-colors
                ${isSelected && issue ? indicatorColorClass : 'bg-transparent'}
            `}></div>

            {/* Line Number & Heatmap Marker */}
            <div className="w-12 flex items-center justify-end pr-3 select-none shrink-0 relative">
                <span className={`
                    text-xs py-[2px] transition-colors
                    ${isSelected ? 'text-tech-primary font-bold' : 'text-tech-muted group-hover:text-tech-secondary'}
                `}>
                    {lineNumber}
                </span>
                
                {/* Heatmap Marker (Pill) - kept for extra visibility */}
                {hasIssue && !isSelected && (
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full ${indicatorColorClass} opacity-60`}></div>
                )}
            </div>

            {/* Code Content with Syntax Highlighting */}
            <pre className={`
                flex-1 whitespace-pre-wrap break-all pl-3 border-l 
                transition-colors py-[1px]
                ${isSelected && issue ? borderColorClass : 'border-tech-border'}
            `}>
                {tokens.map((token, i) => (
                  <span key={i} className={getColorClass(token.type)}>
                    {token.text}
                  </span>
                ))}
            </pre>
          </div>
        );
      })}
    </div>
  );
};

export default CodeViewer;