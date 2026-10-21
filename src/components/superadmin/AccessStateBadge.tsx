import React from "react";
import type { AccessState } from "../../types/platformAdmin";
import { ACCESS_STATE_LABEL, ACCESS_STATE_TONE } from "../../utils/platformAdmin";

export default function AccessStateBadge({ state }: { state: AccessState }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ACCESS_STATE_TONE[state] ?? ACCESS_STATE_TONE.inactive}`}
    >
      {ACCESS_STATE_LABEL[state] ?? state}
    </span>
  );
}
