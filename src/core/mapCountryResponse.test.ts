import { describe, expect, it } from 'vitest';
import type { ApiCountry } from '../types';
import { mapCountryResponse } from './mapCountryResponse';

// Prepared examples of the API response
const austria: ApiCountry = {
  name: 'Austria',
  nativeName: 'Österreich',
  alpha2Code: 'AT',
  alpha3Code: 'AUT',
  numericCode: '040',
  cioc: 'AUT',
  flag: '🇦🇹',
  flags: {
    png: 'https://flagcdn.com/w320/at.png',
    svg: 'https://flagcdn.com/at.svg',
  },
  capital: 'Vienna',
  region: 'Europe',
  subregion: 'Central Europe',
  latlng: [47.33333333, 13.33333333],
  area: 83871,
  population: 8917205,
  populationDensity: 106.32,
  gini: 30.8,
  demonym: 'Austrian',
  independent: true,
  borders: ['CZE', 'DEU', 'HUN', 'ITA', 'LIE', 'SVK', 'SVN', 'CHE'],
  languages: [
    { name: 'German', iso639_1: 'de', iso639_2: 'deu', nativeName: 'Deutsch' },
  ],
  currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
  timezones: ['UTC+01:00'],
  callingCodes: ['43'],
  topLevelDomain: ['.at'],
};

// Only the required fields: every optional field is missing
const minimal: ApiCountry = {
  name: 'Antarctica',
  nativeName: 'Antarctica',
  alpha2Code: 'AQ',
  alpha3Code: 'ATA',
  flag: '🇦🇶',
  flags: {
    png: 'https://flagcdn.com/w320/aq.png',
    svg: 'https://flagcdn.com/aq.svg',
  },
  region: 'Polar',
  population: 1000,
  timezones: ['UTC-03:00'],
  callingCodes: ['672'],
  topLevelDomain: ['.aq'],
};

const switzerland: ApiCountry = {
  ...minimal,
  name: 'Switzerland',
  alpha3Code: 'CHE',
  languages: [
    { name: 'German', iso639_2: 'deu', nativeName: 'Deutsch' },
    { name: 'French', iso639_2: 'fra', nativeName: 'français' },
    { name: 'Italian', iso639_2: 'ita', nativeName: 'Italiano' },
  ],
};

describe('mapCountryResponse', () => {
  describe('card fields', () => {
    it('maps the code, name and flag', () => {
      const country = mapCountryResponse(austria);

      expect(country.code).toBe('AUT');
      expect(country.name).toBe('Austria');
      expect(country.flagUrl).toBe('https://flagcdn.com/at.svg');
    });

    it('maps the capital, region and population', () => {
      const country = mapCountryResponse(austria);

      expect(country.capital).toBe('Vienna');
      expect(country.region).toBe('Europe');
      expect(country.population).toBe(8917205);
    });
  });

  describe('details fields', () => {
    it('maps the area', () => {
      expect(mapCountryResponse(austria).area).toBe(83871);
    });

    it('builds the description from the name and subregion', () => {
      expect(mapCountryResponse(austria).description).toBe(
        'Austria is a country in Central Europe.'
      );
    });

    it('maps border codes in the original order', () => {
      expect(mapCountryResponse(austria).borderCodes).toEqual([
        'CZE',
        'DEU',
        'HUN',
        'ITA',
        'LIE',
        'SVK',
        'SVN',
        'CHE',
      ]);
    });

    it('maps border codes to country names', () => {
      expect(mapCountryResponse(austria).borderNames).toEqual([
        'Czech Republic',
        'Germany',
        'Hungary',
        'Italy',
        'Liechtenstein',
        'Slovakia',
        'Slovenia',
        'Switzerland',
      ]);
    });

    it('keeps the code when a border country is unknown', () => {
      const raw: ApiCountry = { ...minimal, borders: ['DEU', 'XXX'] };

      expect(mapCountryResponse(raw).borderNames).toEqual(['Germany', 'XXX']);
    });

    it('maps languages to their names', () => {
      expect(mapCountryResponse(austria).languages).toEqual(['German']);
      expect(mapCountryResponse(switzerland).languages).toEqual([
        'German',
        'French',
        'Italian',
      ]);
    });

    it('maps currencies', () => {
      expect(mapCountryResponse(austria).currencies).toEqual([
        { code: 'EUR', name: 'Euro', symbol: '€' },
      ]);
    });
  });

  describe('missing optional fields', () => {
    it('uses null for a missing capital and area', () => {
      const country = mapCountryResponse(minimal);

      expect(country.capital).toBeNull();
      expect(country.area).toBeNull();
    });

    it('uses empty arrays for missing borders, languages and currencies', () => {
      const country = mapCountryResponse(minimal);

      expect(country.borderCodes).toEqual([]);
      expect(country.borderNames).toEqual([]);
      expect(country.languages).toEqual([]);
      expect(country.currencies).toEqual([]);
    });

    it('uses the region in the description when subregion is missing', () => {
      expect(mapCountryResponse(minimal).description).toBe(
        'Antarctica is a country in Polar.'
      );
    });

    it('still maps the required fields', () => {
      const country = mapCountryResponse(minimal);

      expect(country.code).toBe('ATA');
      expect(country.name).toBe('Antarctica');
      expect(country.flagUrl).toBe('https://flagcdn.com/aq.svg');
      expect(country.region).toBe('Polar');
      expect(country.population).toBe(1000);
    });
  });

  describe('purity', () => {
    it('returns the same result for the same input', () => {
      expect(mapCountryResponse(austria)).toEqual(mapCountryResponse(austria));
    });

    it('returns a new object on each call', () => {
      expect(mapCountryResponse(austria)).not.toBe(mapCountryResponse(austria));
    });

    // Mutating a frozen object throws, so any mutation makes the test fail.
    it('does not mutate the input', () => {
      const frozen: ApiCountry = Object.freeze({
        ...austria,
        flags: Object.freeze({ ...austria.flags }),
        borders: Object.freeze([...(austria.borders ?? [])]) as string[],
      });
      const copy = structuredClone(frozen);

      expect(() => mapCountryResponse(frozen)).not.toThrow();
      expect(frozen).toEqual(copy);
    });

    it('returns exactly the fields of a card', () => {
      expect(Object.keys(mapCountryResponse(austria)).sort()).toEqual(
        [
          'area',
          'borderCodes',
          'borderNames',
          'capital',
          'code',
          'currencies',
          'description',
          'flagUrl',
          'languages',
          'name',
          'population',
          'region',
        ].sort()
      );
    });
  });
});
