import { createContext, useContext, useState, type ReactNode } from 'react';

interface AccessibilityContextValue {
  accessibilityMode: boolean;
  toggleAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  accessibilityMode: false,
  toggleAccessibility: () => {},
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  const toggleAccessibility = () => setAccessibilityMode((prev) => !prev);

  return (
    <AccessibilityContext.Provider value={{ accessibilityMode, toggleAccessibility }}>
      <div className={accessibilityMode ? 'a11y-mode' : ''}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
