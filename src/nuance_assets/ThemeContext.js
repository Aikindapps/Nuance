import React, { useState, useContext, createContext } from 'react';

const ThemeContext = createContext();
const ThemeUpdateContext = createContext();

//check local storage for theme
const localTheme = localStorage.getItem('darkTheme');

//if local storage is empty, set to false
if (localTheme === null) {
  localStorage.setItem('darkTheme', false);
}


export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeUpdate() {
  return useContext(ThemeUpdateContext);
}

export function ThemeProvider({ children }) {
  //check local storage for theme
  const localTheme = localStorage.getItem('darkTheme');
  if (localTheme === null) {
    localStorage.setItem('darkTheme', false);
  }

  //set darkTheme to local storage value
  const [darkTheme, setDarkTheme] = useState(localTheme === 'true');
  
  

  function toggleTheme() {
    setDarkTheme((prevDarkTheme) => !prevDarkTheme);
    localStorage.setItem('darkTheme', !darkTheme);
  }

  return (
    <ThemeContext.Provider value={darkTheme}>
      <ThemeUpdateContext.Provider value={toggleTheme}>
        {children}
      </ThemeUpdateContext.Provider>
    </ThemeContext.Provider>
  );
}
