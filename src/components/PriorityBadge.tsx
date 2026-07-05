export default function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" | null }) {
  if (!priority) return null;

  const styles = {
    low: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Low",
      dot: "bg-green-500",
    },
    medium: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Medium",
      dot: "bg-yellow-500",
    },
    high: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "High",
      dot: "bg-red-500",
    },
  };

  const s = styles[priority];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}