import i18next from 'i18next';
import HttpApi from 'i18next-http-backend';
import de from 'locale/de.json';
import en from 'locale/en.json';
import es from 'locale/es.json';
import esMX from 'locale/esMX.json';
import fr from 'locale/fr.json';
import it from 'locale/it.json';
import ja from 'locale/ja.json';
import ko from 'locale/ko.json';
import pl from 'locale/pl.json';
import ptBR from 'locale/ptBR.json';
import ru from 'locale/ru.json';
import zhCHS from 'locale/zhCHS.json';
import zhCHT from 'locale/zhCHT.json';
import { humanBytes } from './storage/human-bytes';

export const DIM_LANG_INFOS = {
  de: { pluralOveride: false, latinBased: true },
  en: { pluralOveride: false, latinBased: true },
  es: { pluralOveride: false, latinBased: true },
  'es-mx': { pluralOveride: false, latinBased: true },
  fr: { pluralOveride: false, latinBased: true },
  it: { pluralOveride: false, latinBased: true },
  ja: { pluralOveride: true, latinBased: false },
  ko: { pluralOveride: true, latinBased: false },
  pl: { pluralOveride: true, latinBased: true },
  'pt-br': { pluralOveride: false, latinBased: true },
  ru: { pluralOveride: true, latinBased: false },
  'zh-chs': { pluralOveride: true, latinBased: false },
  'zh-cht': { pluralOveride: true, latinBased: false },
};

const DIM_LANGS = Object.keys(DIM_LANG_INFOS);

// Try to pick a nice default language
export function defaultLanguage(): string {
  const storedLanguage = localStorage.getItem('dimLanguage');
  if (storedLanguage && DIM_LANGS.includes(storedLanguage)) {
    return storedLanguage;
  }
  const browserLang = (window.navigator.language || 'en').toLowerCase();
  return DIM_LANGS.find((lang) => browserLang.startsWith(lang)) || 'en';
}

export function initi18n(): Promise<unknown> {
  const lang = defaultLanguage();
  return new Promise((resolve, reject) => {
    // See https://github.com/i18next/i18next
    i18next.use(HttpApi).init(
      {
        initImmediate: true,
        debug: $DIM_FLAVOR === 'dev',
        lng: lang,
        fallbackLng: 'en',
        lowerCaseLng: true,
        supportedLngs: DIM_LANGS,
        load: 'currentOnly',
        interpolation: {
          escapeValue: false,
          format(val: string, format) {
            switch (format) {
              case 'pct':
                return `${Math.min(100, Math.floor(100 * parseFloat(val)))}%`;
              case 'humanBytes':
                return humanBytes(parseInt(val, 10));
              case 'number':
                return parseInt(val, 10).toLocaleString();
              default:
                return val;
            }
          },
        },
        backend: {
          loadPath([lng]: string[]) {
            const path = {
              de,
              en,
              es,
              'es-mx': esMX,
              fr,
              it,
              ja,
              ko,
              pl,
              'pt-br': ptBR,
              ru,
              'zh-chs': zhCHS,
              'zh-cht': zhCHT,
            }[lng] as unknown as string;
            if (!path) {
              throw new Error(`unsupported language ${lng}`);
            }
            return path;
          },
        },
        returnObjects: true,
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(undefined);
        }
      }
    );
    if (DIM_LANG_INFOS[lang]?.pluralOveride) {
      i18next.services.pluralResolver.addRule(lang, i18next.services.pluralResolver.getRule('en'));
    }
  });
}
