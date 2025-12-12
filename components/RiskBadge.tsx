import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  let colorClass = '';
  
  // Using bg-opacity-10 for subtle background, solid text, matching border
  switch (level) {
    case RiskLevel.HIGH:
      colorClass = 'bg-[#D66A6A]/10 text-tech-risk-high border-tech-risk-high';
      break;
    case RiskLevel.MEDIUM:
      colorClass = 'bg-[#E6B566]/10 text-tech-risk-medium border-tech-risk-medium';
      break;
    case RiskLevel.LOW:
      colorClass = 'bg-[#6BBF9B]/10 text-tech-risk-low border-tech-risk-low';
      break;
    default:
      colorClass = 'bg-tech-muted/10 text-tech-muted border-tech-muted';
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
      {level}
    </span>
  );
};

export default RiskBadge;