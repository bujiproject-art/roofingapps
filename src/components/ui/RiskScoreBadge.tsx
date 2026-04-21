interface RiskScoreBadgeProps {
  level: "low" | "medium" | "high";
  score?: number;
}

export function RiskScoreBadge({ level, score }: RiskScoreBadgeProps) {
  const styles = {
    low: "risk-low",
    medium: "risk-medium",
    high: "risk-high",
  };

  const labels = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {labels[level]}
      {score && ` (${score})`}
    </div>
  );
}