import React from "react";
import { useTranslation } from "react-i18next";
import {
  BUILT_IN_EXPENSE_CATEGORIES,
  MAX_EXPENSE_CATEGORY_LENGTH,
  validateExpenseCategories,
} from "../../config/expenseCategories";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  /** An error code from validateGymConfig (key: expenseCategories) */
  errorCode?: string;
  disabled?: boolean;
}

// Lets an owner add expense categories of their own to the standard ones.
export default function ExpenseCategoriesEditor({ value, onChange, errorCode, disabled }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const add = () => {
    const name = draft.trim().replace(/\s+/g, " ");
    if (!name) return;
    const problem = validateExpenseCategories([...value, name]);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError(null);
    setDraft("");
    onChange([...value, name]);
  };

  const error = localError ?? errorCode;

  return (
    <div className="space-y-3 text-start">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("expenseCategories.title")}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("expenseCategories.subtitle")}</p>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("expenseCategories.none")}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {value.map((name) => (
            <li
              key={name}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm text-gray-800 dark:text-gray-100"
            >
              {name}
              <button
                type="button"
                className="text-gray-500 dark:text-gray-400 hover:text-red-600"
                aria-label={t("expenseCategories.remove", { name })}
                onClick={() => onChange(value.filter((v) => v !== name))}
                disabled={disabled}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          maxLength={MAX_EXPENSE_CATEGORY_LENGTH + 10}
          onChange={(e) => {
            setDraft(e.target.value);
            setLocalError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={t("expenseCategories.placeholder")}
          aria-label={t("expenseCategories.placeholder")}
          disabled={disabled}
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !draft.trim()}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {t("expenseCategories.add")}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {t(`gymConfig.errors.${error}`)}
        </p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("expenseCategories.standard", { list: BUILT_IN_EXPENSE_CATEGORIES.join(", ") })}
      </p>
    </div>
  );
}
