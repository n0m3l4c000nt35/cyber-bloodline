const THEMES = {
  TERMINAL: 'terminal',
  HTB: 'htb',
  GITHUB: 'github'
};

const THEME_NAMES = {
  [THEMES.TERMINAL]: 'Classic Terminal',
  [THEMES.HTB]: 'Hack The Box',
  [THEMES.GITHUB]: 'GitHub Dark'
};

const STORAGE_KEY = 'social-terminal-theme';

export const getCurrentTheme = () => {
  return localStorage.getItem(STORAGE_KEY) || THEMES.TERMINAL;
};

export const setTheme = (theme) => {
  if (!Object.values(THEMES).includes(theme)) {
    console.error('Invalid theme:', theme);
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
};

export const initTheme = () => {
  const currentTheme = getCurrentTheme();
  setTheme(currentTheme);
};

export const getNextTheme = (currentTheme) => {
  const themes = Object.values(THEMES);
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  return themes[nextIndex];
};

export { THEMES, THEME_NAMES };