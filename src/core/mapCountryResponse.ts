import type { ApiCountry, Country } from '../types';

export function mapCountryResponse(raw: ApiCountry): Country {
  void raw;

  return {
    code: '',
    name: '',
    flagUrl: '',
    capital: null,
    region: '',
    population: 0,
    description: '',
    area: null,
    borderCodes: [],
    borderNames: [],
    languages: [],
    currencies: [],
  };
}
