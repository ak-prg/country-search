import { COUNTRY_NAMES } from '../codes';
import type { ApiCountry, Country } from '../types';

export function mapCountryResponse(raw: ApiCountry): Country {
  return {
    code: raw.alpha3Code,
    name: raw.name,
    flagUrl: raw.flags.svg,
    capital: raw.capital ?? null,
    region: raw.region,
    population: raw.population,
    description: `${raw.name} is a country in ${raw.subregion ?? raw.region}.`,
    area: raw.area ?? null,
    borderCodes: raw.borders ?? [],
    languages: (raw.languages ?? []).map((lang) => lang.name),
    currencies: raw.currencies ?? [],
    borderNames: (raw.borders ?? []).map(
      (code) => COUNTRY_NAMES.get(code) ?? code
    ),
  };
}
