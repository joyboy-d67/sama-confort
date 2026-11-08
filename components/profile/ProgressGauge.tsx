"use client";

import React from "react";

interface ProgressGaugeProps {
  value: number; // 0..10
}

export default function ProgressGauge({ value }: ProgressGaugeProps) {
  const segments = Array.from({ length: 10 }).map((_, i) => i + 1);

  return (
    <div className="flex items-center gap-2">
      {segments.map((seg) => {
        const filled = seg <= value;
        return (
          <div
            key={seg}
            className={`w-6 h-6 rounded-sm border ${
              filled ? "bg-primary border-primary" : "border-dark-gray bg-dark-lighter"
            }`}
            title={`${seg} / 10`}
          />
        );
      })}
    </div>
  );
}

