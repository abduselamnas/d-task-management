import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      // Add dark mode classes to html and body
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark-mode");
      document.body.style.backgroundColor = "#0F172A";
      document.body.style.color = "#F8FAFC";
    } else {
      // Remove dark mode classes
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark-mode");
      document.body.style.backgroundColor = "#F9FAFB";
      document.body.style.color = "#111827";
    }

    // Force a re-render of all components
    window.dispatchEvent(new Event("themechange"));
  };

  useEffect(() => {
    // Apply saved theme on mount
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark-mode");
      document.body.style.backgroundColor = "#0F172A";
      document.body.style.color = "#F8FAFC";
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
