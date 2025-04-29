import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Theme types
export type ThemeType = 'default' | 'minecraft';

// Theme context
interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  toggleTheme: () => {}
});

// Theme provider component
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Check if theme is stored in localStorage
  const storedTheme = localStorage.getItem('theme') as ThemeType;
  const [theme, setTheme] = useState<ThemeType>(storedTheme || 'default');
  
  // Toggle between themes
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'default' ? 'minecraft' : 'default';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
  }, [theme]);
  
  // Set body class on initial load
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => useContext(ThemeContext);

// Theme switcher component
export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="theme-switcher">
      <button onClick={toggleTheme} className={`theme-button ${theme}`}>
        {theme === 'default' ? '🎮 Minecraft Theme' : '🏥 Default Theme'}
      </button>
    </div>
  );
};
