interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending_payment: {
    label: "Pending Payment",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  pending_verification: {
    label: "Pending Verification",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  shipped: {
    label: "Shipped",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-50",
    text: "text-green-700",
  },
};

export function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    bg: "bg-gray-50",
    text: "text-gray-700",
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Status timeline steps showing progress from order to completion.
 */
export function OrderStatusTimeline({ status }: { status: string }) {
  const steps = [
    { key: "pending_verification", label: "Pending Verification" },
    { key: "confirmed", label: "Confirmed" },
    { key: "shipped", label: "Shipped" },
    { key: "completed", label: "Completed" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);
  const isRejected = status === "rejected";

  if (isRejected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-sm font-bold">✕</span>
          </div>
          <span className="text-sm font-medium text-red-700">Rejected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted
                    ? "bg-[#4A6B6D] text-white"
                    : "bg-gray-100 text-gray-400"
                } ${isCurrent ? "ring-2 ring-[#4A6B6D] ring-offset-2" : ""}`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs hidden sm:inline ${
                  isCompleted ? "text-[#4A6B6D] font-medium" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 ${
                  index < currentIndex ? "bg-[#4A6B6D]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
