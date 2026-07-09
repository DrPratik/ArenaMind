import { useLanguage } from '../../context/LanguageContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { LANGUAGE_OPTIONS } from '../../types';

export default function Header() {
  const { language, setLanguage } = useLanguage();
  const { accessibilityMode, toggleAccessibility } = useAccessibility();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-navy-900/80 border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏟️</span>
          <h1 className="text-lg font-bold gradient-text">ArenaMind</h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-blue pr-8"
              aria-label="Select language"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-navy-800 text-white">
                  {opt.flag} {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-xs">▼</span>
          </div>

          {/* Accessibility Toggle */}
          <button
            id="accessibility-toggle"
            onClick={toggleAccessibility}
            className={`p-2 rounded-lg border transition-all ${
              accessibilityMode
                ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
            aria-label={accessibilityMode ? 'Disable accessibility mode' : 'Enable accessibility mode'}
            aria-pressed={accessibilityMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="4.5" r="2.5" />
              <path d="m6 21 1.5-9H9" />
              <path d="m18 21-1.5-9H15" />
              <path d="M8.5 12h7" />
              <path d="M12 7v5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
