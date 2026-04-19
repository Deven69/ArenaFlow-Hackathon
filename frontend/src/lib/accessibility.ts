export const announceToScreenReader = (message: string) => {
  const region = document.getElementById('sr-live-region');
  if (region) { 
    region.textContent = ''; 
    setTimeout(() => { region.textContent = message; }, 50); 
  }
};

export const handleLanguageChange = (lang: 'en' | 'hi' | 'mr') => {
  localStorage.setItem('arenaflow_language', lang);
  document.documentElement.lang = lang;
  announceToScreenReader(
    lang === 'hi' ? 'भाषा हिंदी में बदली गई' : 
    lang === 'mr' ? 'भाषा मराठीत बदलली' : 
    'Language changed to English'
  );
};
