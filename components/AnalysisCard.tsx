import React from 'react';
import { AnalysisItem, RiskLevel, UserMode } from '../types';
import RiskBadge from './RiskBadge';
import { Wrench, Search, Eye, ArrowRight, AlertTriangle, CheckCircle2, Clock, CheckSquare, Sparkles, Check } from 'lucide-react';

interface AnalysisCardProps {
  item: AnalysisItem;
  userMode: UserMode;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onFix: (item: AnalysisItem) => void; // New prop for fixing
  isFixed: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ item, userMode, isActive, onHover, onSelect, onFix, isFixed }) => {
  const isHighRisk = item.risk === RiskLevel.HIGH;
  
  // Container styling
  let containerClasses = 'rounded-lg border transition-all duration-200 relative cursor-pointer flex flex-col gap-4 ';
  
  // Color Logic
  let borderColor = '';
  let shadowColor = '';

  if (isFixed) {
     borderColor = 'border-tech-risk-low';
     shadowColor = 'shadow-[0_0_20px_rgba(107,191,155,0.15)]'; // Greenish shadow
  } else if (isHighRisk) {
     borderColor = 'border-tech-risk-high';
     shadowColor = 'shadow-[0_0_20px_rgba(214,106,106,0.15)]';
  } else {
     borderColor = 'border-tech-accent'; 
     shadowColor = 'shadow-[0_0_20px_rgba(91,108,255,0.15)]';
  }
  
  if (isActive) {
      // User requested #101010 for active state
      containerClasses += `bg-[#101010] shadow-xl z-10 translate-x-1 ${borderColor} ${shadowColor} `;
  } else {
      if (isFixed) {
          containerClasses += 'bg-tech-risk-low/5 border-tech-risk-low/50 hover:bg-[#101010] ';
      } else {
          // User requested #101010 for hover state
          containerClasses += 'bg-tech-surface1 hover:bg-[#101010] ';
          if (isHighRisk) {
              containerClasses += 'border-tech-risk-high/30 hover:border-tech-risk-high/50';
          } else {
              containerClasses += 'border-tech-border hover:border-tech-accent/40';
          }
      }
  }

  return (
    <div 
        className={`p-5 ${containerClasses}`}
        onMouseEnter={() => onHover(item.id)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(item.id)}
    >
      {/* 1. Header Section */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.id);
                }}
                className={`
                    mt-1 p-1.5 rounded-md transition-colors shrink-0
                    ${isActive ? 'bg-tech-accent text-white' : 'bg-tech-surface2 text-tech-secondary hover:text-tech-primary border border-tech-border'}
                `}
                title={`Jump to line ${item.lineStart}`}
            >
                <Eye className="w-4 h-4" />
            </button>
            <div>
                <h3 className={`text-base font-bold leading-tight ${isHighRisk ? 'text-white' : 'text-tech-primary'}`}>
                    {item.problem}
                </h3>
                <p className="text-xs text-tech-muted font-mono mt-1.5 flex items-center gap-2">
                    <span>Line {item.lineStart}</span>
                    {/* Only show technical detection reason in Senior Mode */}
                    {userMode === UserMode.SENIOR && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-tech-border"></span>
                            <span className="italic opacity-70">{item.whyDetection}</span>
                        </>
                    )}
                </p>
            </div>
        </div>
        <div className="shrink-0">
            <RiskBadge level={item.risk} />
        </div>
      </div>

      {/* 2. Explanation Block */}
      <div className={`
          p-4 rounded-md border text-sm leading-relaxed
          ${isActive 
            ? 'bg-tech-bg border-tech-border/60 text-tech-primary' 
            : 'bg-tech-bg/40 border-tech-border/40 text-tech-secondary'}
      `}>
          {userMode === UserMode.JUNIOR ? (
              <div className="flex gap-2">
                  <span className="shrink-0 text-xl">💡</span>
                  <p>{item.simplifiedExplanation}</p>
              </div>
          ) : (
              <p className="font-mono text-xs md:text-sm">{item.vibeSmell}</p>
          )}
      </div>

      {/* 3. Improved Timeline UX - Grid Layout */}
      <div className="mt-1">
        <p className="text-[10px] text-tech-muted uppercase font-bold mb-3 flex items-center gap-2 tracking-wider">
            <Clock className="w-3 h-3" /> Failure Timeline
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Phase 1: Now */}
            <div className="bg-tech-bg/30 rounded border-l-2 border-tech-risk-low p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-3 h-3 text-tech-risk-low" />
                    <span className="text-[10px] font-bold text-tech-risk-low uppercase">Works Now</span>
                </div>
                <p className="text-xs text-tech-secondary leading-snug">{item.timeline.now}</p>
            </div>

            {/* Phase 2: Soon */}
            <div className="bg-tech-bg/30 rounded border-l-2 border-tech-risk-medium p-2.5">
                 <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-3 h-3 text-tech-risk-medium" />
                    <span className="text-[10px] font-bold text-tech-risk-medium uppercase">Soon</span>
                </div>
                <p className="text-xs text-tech-secondary leading-snug">{item.timeline.soon}</p>
            </div>

            {/* Phase 3: Later (Concrete) */}
            <div className="bg-tech-bg/30 rounded border-l-2 border-tech-risk-high p-2.5 relative overflow-hidden">
                {/* Subtle BG Gradient for high risk */}
                <div className="absolute inset-0 bg-tech-risk-high/5 pointer-events-none"></div>
                 <div className="flex items-center gap-2 mb-1.5 relative z-10">
                    <AlertTriangle className="w-3 h-3 text-tech-risk-high" />
                    <span className="text-[10px] font-bold text-tech-risk-high uppercase">Later</span>
                </div>
                <p className="text-xs text-tech-primary relative z-10 leading-snug font-medium">
                    {item.timeline.later}
                </p>
            </div>
        </div>
      </div>

      {/* 4. Fix Section - Checklist & Button */}
      <div className="pt-3 mt-1 border-t border-tech-border flex flex-col gap-3">
          <div className="flex items-center gap-2">
             <Wrench className="w-3.5 h-3.5 text-tech-accent" />
             <span className="text-[10px] font-bold text-tech-accent uppercase tracking-wider">Recommended Fix</span>
          </div>
          
          {item.fixChecklist && item.fixChecklist.length > 0 ? (
              <ul className="space-y-1.5">
                  {item.fixChecklist.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-tech-secondary">
                          <CheckSquare className="w-3 h-3 mt-0.5 text-tech-muted shrink-0" />
                          <span>{step}</span>
                      </li>
                  ))}
              </ul>
          ) : (
             <code className="text-xs text-tech-primary font-mono bg-tech-bg px-2 py-1 rounded border border-tech-border inline-block">
                {item.minimalFix}
            </code>
          )}

          {/* AI Fix Button */}
          {isFixed ? (
             <div className="mt-1 w-full flex items-center justify-center gap-2 bg-tech-risk-low/10 border border-tech-risk-low text-tech-risk-low py-2 rounded-md transition-all text-xs font-bold uppercase tracking-wide">
                <Check className="w-3.5 h-3.5" />
                Fixed
             </div>
          ) : (
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onFix(item);
                }}
                className="mt-1 w-full flex items-center justify-center gap-2 bg-tech-surface2 hover:bg-tech-accent hover:text-white border border-tech-border hover:border-tech-accent text-tech-primary py-2 rounded-md transition-all text-xs font-semibold uppercase tracking-wide group"
             >
                <Sparkles className="w-3.5 h-3.5 text-tech-accent group-hover:text-white transition-colors" />
                Fix with AI
             </button>
          )}
      </div>
    </div>
  );
};

export default AnalysisCard;