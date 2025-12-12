import { executeSql } from "../services/database";

// Define the structure of the translation strings
export interface Translation {
  welcome: string;
  selectLanguage: string;
  english: string;
  pidgin: string;
  continue: string;
}

// Define the available languages and their translations
const translations: { [key: string]: Translation } = {
  en: {
    welcome: "Welcome to Supamart",
    selectLanguage: "Please select your language",
    english: "English",
    pidgin: "Nigerian Pidgin",
    continue: "Continue",
  },
  pcm: {
    welcome: "Welcome to Supamart",
    selectLanguage: "Abeg, choose your language",
    english: "English",
    pidgin: "Nigerian Pidgin",
    continue: "Continue",
  },
};

// The key for storing the selected language in the database
const LANGUAGE_KEY = "user_language";

let currentLanguage = "en"; // Default language
let currentTranslations = translations[currentLanguage];

export const localizationService = {
  /**
   * Initialize the localization service by loading the saved language
   */
  initialize: async (): Promise<void> => {
    try {
      const savedLanguage = await localizationService.getLanguage();
      if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
        currentTranslations = translations[savedLanguage];
      }
    } catch (error) {
      console.error("Failed to initialize localization:", error);
    }
  },

  /**
   * Set the current language and save it to local storage.
   * @param languageCode The language code (e.g., 'en', 'pcm')
   */
  setLanguage: async (languageCode: string): Promise<void> => {
    if (translations[languageCode]) {
      currentLanguage = languageCode;
      currentTranslations = translations[languageCode];
      try {
        await executeSql(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          [LANGUAGE_KEY, languageCode],
        );
      } catch (error) {
        console.error("Failed to save language setting:", error);
        throw error;
      }
    } else {
      console.warn(`Language '${languageCode}' not found.`);
    }
  },

  /**
   * Retrieve the saved language from local storage.
   */
  getLanguage: async (): Promise<string | null> => {
    try {
      const result = await executeSql(
        "SELECT value FROM settings WHERE key = ?",
        [LANGUAGE_KEY],
      );

      if (result.rows.length > 0) {
        return result.rows.item(0).value;
      }
      return null;
    } catch (error) {
      console.error("Failed to get language setting:", error);
      return null;
    }
  },

  /**
   * Get the translated string for a given key.
   * @param key The key of the translation string
   */
  t: (key: keyof Translation): string => {
    return currentTranslations[key] || key;
  },

  /**
   * Get the current language code.
   */
  getCurrentLanguage: (): string => {
    return currentLanguage;
  },
};

// Initialize the service when the module is loaded
localizationService.initialize();

export const t = localizationService.t;
