import React, { useState, useEffect, createContext, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("aegis_theme") || "dark");
  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");
  useEffect(() => { localStorage.setItem("aegis_theme", theme); }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const nextTheme = theme === "dark" ? "light" : "dark";
  return <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`} title={`Switch to ${nextTheme} theme`}><FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} /><span>{theme === "dark" ? "Light" : "Dark"}</span></button>;
};
