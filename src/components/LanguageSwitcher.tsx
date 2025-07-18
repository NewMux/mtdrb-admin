import React from 'react';
import { useTranslation } from 'react-i18next';

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'العربية' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const setLang = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="flex gap-2">
      {langs.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLang(lang.code)}
          className={`px-3 py-1 rounded font-semibold transition-all duration-200 border border-transparent focus:outline-none ${current === lang.code ? 'bg-[#155FD9] text-white' : 'bg-white/10 text-[#7BBDFE] hover:bg-[#489BFA]/20'}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
} 