import React from "react";
import { useTranslation } from "react-i18next";
import { applyRegionPreset, type ConfigErrors, type GymConfigInput } from "../../config/gymConfig";
import { combinedRate, MAX_TAX_COMPONENTS, type TaxComponent } from "../../utils/taxMath";
import {
  REGION_PRESETS,
  countryName,
  currencyName,
  getRegionPreset,
  listCurrencies,
  listTimezones,
} from "../../config/regions";

interface Props {
  value: GymConfigInput;
  onChange: (next: GymConfigInput) => void;
  errors?: ConfigErrors;
  disabled?: boolean;
}

const inputClass =
  "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60";
const selectClass = `${inputClass} ps-4 pe-9`;
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

function FieldError({ code }: { code?: string }) {
  const { t } = useTranslation();
  if (!code) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-600">
      {t(`gymConfig.errors.${code}`)}
    </p>
  );
}

// One tax: name, rate, and (for every tax after the first) whether it is
// charged on top of the taxes before it. The rate is edited as text so "7." and
// "" are possible mid-typing.
function TaxRow({
  index,
  component,
  errors,
  disabled,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  component: TaxComponent;
  errors: ConfigErrors;
  disabled: boolean;
  canRemove: boolean;
  onChange: (next: TaxComponent) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const [rateText, setRateText] = React.useState(String(component.rate));
  React.useEffect(() => {
    // NaN means the field was cleared mid-edit: leave what is typed alone.
    setRateText((current) => {
      if (Number.isNaN(component.rate)) return current;
      return Number(current) === component.rate && current !== "" ? current : String(component.rate);
    });
  }, [component.rate]);

  const nameId = `gc-tax-name-${index}`;
  const rateId = `gc-tax-rate-${index}`;
  const compoundId = `gc-tax-compound-${index}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_9rem_auto] gap-4 items-start rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div>
        <label htmlFor={nameId} className={labelClass}>{t("gymConfig.taxName")}</label>
        <input
          id={nameId}
          type="text"
          className={inputClass}
          value={component.name}
          onChange={(e) => onChange({ ...component, name: e.target.value })}
          placeholder="VAT"
          disabled={disabled}
        />
        <FieldError code={errors[`taxName${index}`]} />
      </div>
      <div>
        <label htmlFor={rateId} className={labelClass}>{t("gymConfig.taxRate")}</label>
        <input
          id={rateId}
          type="text"
          inputMode="decimal"
          className={inputClass}
          value={rateText}
          onChange={(e) => {
            setRateText(e.target.value);
            onChange({ ...component, rate: e.target.value.trim() === "" ? Number.NaN : Number(e.target.value) });
          }}
          disabled={disabled}
        />
        <FieldError code={errors[`taxRate${index}`]} />
      </div>
      <div className="flex items-center gap-4 md:pt-8">
        {index > 0 && (
          <div className="flex items-center gap-2">
            <input
              id={compoundId}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={component.compound}
              onChange={(e) => onChange({ ...component, compound: e.target.checked })}
              disabled={disabled}
            />
            <label htmlFor={compoundId} className="text-xs text-gray-600 dark:text-gray-400">{t("gymConfig.taxCompound")}</label>
          </div>
        )}
        {canRemove && (
          <button
            type="button"
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
            onClick={onRemove}
            disabled={disabled}
            aria-label={t("gymConfig.taxRemove", { name: component.name || index + 1 })}
          >
            {t("gymConfig.taxRemoveShort")}
          </button>
        )}
      </div>
    </div>
  );
}

// Region, currency, tax and business details. Shared by the setup wizard and
// Settings > Business & tax so a gym is configured the same way in both.
// Choosing a country pre-fills currency, timezone and tax as SUGGESTIONS; every
// field stays editable.
export default function GymConfigForm({ value, onChange, errors = {}, disabled = false }: Props) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const currencies = React.useMemo(() => listCurrencies(), []);
  const timezones = React.useMemo(() => listTimezones(), []);
  const countries = React.useMemo(
    () =>
      REGION_PRESETS.map((r) => ({ code: r.code, name: countryName(r.code, language) })).sort((a, b) =>
        a.name.localeCompare(b.name, language),
      ),
    [language],
  );

  const suggestion = getRegionPreset(value.country);
  const combinedPercent = value.tax.enabled ? combinedRate(value.tax.components) : null;

  const set = (patch: Partial<GymConfigInput>) => onChange({ ...value, ...patch });
  const setTax = (patch: Partial<GymConfigInput["tax"]>) => set({ tax: { ...value.tax, ...patch } });
  const setBusiness = (patch: Partial<GymConfigInput["business"]>) =>
    set({ business: { ...value.business, ...patch } });

  const handleCountry = (code: string) => {
    const preset = getRegionPreset(code);
    if (!preset) {
      set({ country: "" });
      return;
    }
    onChange(applyRegionPreset(value, preset));
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4" aria-labelledby="gymconfig-region">
        <h3 id="gymconfig-region" className="text-base font-semibold text-gray-900 dark:text-white">
          {t("gymConfig.regionTitle")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="gc-country" className={labelClass}>{t("gymConfig.country")}</label>
            <select
              id="gc-country"
              className={selectClass}
              value={value.country}
              onChange={(e) => handleCountry(e.target.value)}
              disabled={disabled}
            >
              <option value="">{t("gymConfig.countryOther")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("gymConfig.countryHint")}</p>
            <FieldError code={errors.country} />
          </div>
          <div>
            <label htmlFor="gc-currency" className={labelClass}>{t("gymConfig.currency")}</label>
            <select
              id="gc-currency"
              className={selectClass}
              value={value.currency}
              onChange={(e) => set({ currency: e.target.value })}
              disabled={disabled}
            >
              {!currencies.includes(value.currency) && <option value={value.currency}>{value.currency}</option>}
              {currencies.map((code) => (
                <option key={code} value={code}>{code} - {currencyName(code, language)}</option>
              ))}
            </select>
            <FieldError code={errors.currency} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="gc-timezone" className={labelClass}>{t("gymConfig.timezone")}</label>
            <select
              id="gc-timezone"
              className={selectClass}
              value={value.timezone}
              onChange={(e) => set({ timezone: e.target.value })}
              disabled={disabled}
            >
              {!timezones.includes(value.timezone) && <option value={value.timezone}>{value.timezone}</option>}
              {timezones.map((zone) => (
                <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("gymConfig.timezoneHint")}</p>
            <FieldError code={errors.timezone} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6" aria-labelledby="gymconfig-tax">
        <h3 id="gymconfig-tax" className="text-base font-semibold text-gray-900 dark:text-white">
          {t("gymConfig.taxTitle")}
        </h3>
        <div className="flex items-center gap-3">
          <input
            id="gc-tax-enabled"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={value.tax.enabled}
            onChange={(e) => setTax({ enabled: e.target.checked })}
            disabled={disabled}
          />
          <label htmlFor="gc-tax-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("gymConfig.taxEnabled")}
          </label>
        </div>

        {suggestion && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {suggestion.taxRate > 0
              ? t("gymConfig.taxSuggestion", {
                  country: countryName(suggestion.code, language),
                  name: suggestion.taxName,
                  rate: suggestion.taxRate,
                })
              : t("gymConfig.taxVaries", { country: countryName(suggestion.code, language) })}
          </p>
        )}

        {value.tax.enabled && (
          <div className="space-y-3">
            {value.tax.components.map((component, index) => (
              <TaxRow
                key={index}
                index={index}
                component={component}
                errors={errors}
                disabled={disabled}
                canRemove={value.tax.components.length > 1}
                onChange={(next) =>
                  setTax({ components: value.tax.components.map((c, i) => (i === index ? next : c)) })
                }
                onRemove={() => setTax({ components: value.tax.components.filter((_, i) => i !== index) })}
              />
            ))}
            <FieldError code={errors.taxCount} />
            <FieldError code={errors.taxCombined} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {value.tax.components.length < MAX_TAX_COMPONENTS && (
                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                  onClick={() =>
                    setTax({ components: [...value.tax.components, { name: "", rate: 0, compound: false }] })
                  }
                  disabled={disabled}
                >
                  {t("gymConfig.taxAdd")}
                </button>
              )}
              {value.tax.components.length > 1 && combinedPercent !== null && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("gymConfig.taxCombined", { rate: combinedPercent })}
                </p>
              )}
            </div>
          </div>
        )}

        {value.tax.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="gc-tax-number" className={labelClass}>{t("gymConfig.taxNumber")}</label>
              <input
                id="gc-tax-number"
                type="text"
                className={inputClass}
                value={value.tax.number}
                onChange={(e) => setTax({ number: e.target.value })}
                placeholder={t("gymConfig.taxNumberPlaceholder")}
                disabled={disabled}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("gymConfig.taxNumberHint")}</p>
              <FieldError code={errors.taxNumber} />
            </div>
            <div className="flex items-start gap-3 md:pt-8">
              <input
                id="gc-prices-include-tax"
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={value.tax.pricesIncludeTax}
                onChange={(e) => setTax({ pricesIncludeTax: e.target.checked })}
                disabled={disabled}
              />
              <label htmlFor="gc-prices-include-tax" className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{t("gymConfig.pricesIncludeTax")}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">{t("gymConfig.pricesIncludeTaxHint")}</span>
              </label>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6" aria-labelledby="gymconfig-business">
        <div>
          <h3 id="gymconfig-business" className="text-base font-semibold text-gray-900 dark:text-white">
            {t("gymConfig.businessTitle")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("gymConfig.businessHint")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="gc-legal-name" className={labelClass}>{t("gymConfig.legalName")}</label>
            <input
              id="gc-legal-name"
              type="text"
              className={inputClass}
              value={value.business.legalName}
              onChange={(e) => setBusiness({ legalName: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div>
            <label htmlFor="gc-phone" className={labelClass}>{t("gymConfig.phone")}</label>
            <input
              id="gc-phone"
              type="tel"
              className={inputClass}
              value={value.business.phone}
              onChange={(e) => setBusiness({ phone: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="gc-address" className={labelClass}>{t("gymConfig.address")}</label>
            <textarea
              id="gc-address"
              rows={2}
              className={inputClass}
              value={value.business.address}
              onChange={(e) => setBusiness({ address: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div>
            <label htmlFor="gc-email" className={labelClass}>{t("gymConfig.email")}</label>
            <input
              id="gc-email"
              type="email"
              className={inputClass}
              value={value.business.email}
              onChange={(e) => setBusiness({ email: e.target.value })}
              disabled={disabled}
            />
            <FieldError code={errors.email} />
          </div>
          <div>
            <label htmlFor="gc-website" className={labelClass}>{t("gymConfig.website")}</label>
            <input
              id="gc-website"
              type="url"
              className={inputClass}
              value={value.business.website}
              onChange={(e) => setBusiness({ website: e.target.value })}
              placeholder="https://"
              disabled={disabled}
            />
            <FieldError code={errors.website} />
          </div>
        </div>
      </section>
    </div>
  );
}
