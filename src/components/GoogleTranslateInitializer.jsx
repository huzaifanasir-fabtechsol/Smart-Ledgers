import { useEffect } from "react";

const GoogleTranslateInitializer = () => {
  useEffect(() => {
    const initializeGoogleTranslate = () => {
      const includedLanguages = "en,zh-CN,ja";
      
      try {
        if (window.google && window.google.translate) {
          const translateElement = document.getElementById("google_translate_element");
          if (translateElement && !translateElement.hasChildNodes()) {
             new window.google.translate.TranslateElement(
              {
                pageLanguage: "en",
                includedLanguages: includedLanguages,
                autoDisplay: false,
              },
              "google_translate_element"
            );
          }
        }
      } catch (error) {
        console.error("Error initializing Google Translate:", error);
      }
    };

    window.googleTranslateElementInit = initializeGoogleTranslate;

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
        if (window.google && window.google.translate) {
            initializeGoogleTranslate();
        }
    }
  }, []);

  return null;
};

export default GoogleTranslateInitializer;
