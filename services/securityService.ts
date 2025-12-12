import { AnalysisItem, RiskLevel } from "../types";

// Patterns for detecting secrets
const PATTERNS = [
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/g, fix: 'const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;' },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g, fix: 'const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;' },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/g, fix: 'const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;' },
  { name: 'Firebase Secret', regex: /AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}/g, fix: 'const FCM_KEY = process.env.FCM_SERVER_KEY;' },
  { name: 'Generic Private Key', regex: /-----BEGIN PRIVATE KEY-----/g, fix: 'const PRIVATE_KEY = process.env.PRIVATE_KEY;' },
];

export interface SecurityScanResult {
  maskedCode: string;
  securityIssues: AnalysisItem[];
}

export const scanAndMaskSecrets = (code: string): SecurityScanResult => {
  let maskedCode = code;
  const securityIssues: AnalysisItem[] = [];
  
  PATTERNS.forEach((pattern) => {
    // Find matches
    let match;
    // We use a fresh regex instance or reset lastIndex if global
    const regex = new RegExp(pattern.regex); 
    
    while ((match = regex.exec(code)) !== null) {
      const matchValue = match[0];
      const matchIndex = match.index;
      
      // Calculate line number
      const codeBeforeMatch = code.substring(0, matchIndex);
      const lineStart = codeBeforeMatch.split('\n').length;
      
      // Create a masked version for display/AI
      const maskedValue = matchValue.substring(0, 4) + '****' + matchValue.substring(matchValue.length - 4);
      maskedCode = maskedCode.replace(matchValue, maskedValue);

      // Create an issue item
      securityIssues.push({
        id: `sec-${Date.now()}-${Math.random()}`,
        problem: `Exposed ${pattern.name}`,
        lineStart: lineStart,
        vibeSmell: `Security Critical: Hardcoded ${pattern.name} detected. This credential is now compromised if this code was committed.`,
        simplifiedExplanation: `You left a secret key in the code. Hackers can use this to steal data or charge your credit card.`,
        // Updated wording per request
        whyDetection: "Known high-risk pattern in production code", 
        timeline: {
          now: "Key is exposed",
          soon: "Bots scrape GitHub",
          // Concrete consequence
          later: "Account takeover, $50k+ unexpected bill" 
        },
        risk: RiskLevel.HIGH,
        minimalFix: "Revoke key & move to env",
        suggestedFixCode: pattern.fix, // Added code fix
        // Added checklist
        fixChecklist: [
            `Revoke ${pattern.name} in provider console immediately`,
            "Rotate credentials for all connected services",
            "Move configuration to process.env or Secret Manager",
            "Redeploy application"
        ]
      });
    }
  });

  return { maskedCode, securityIssues };
};