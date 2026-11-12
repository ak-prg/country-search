export interface ApiFlags {
  png: string;
  svg: string;
}

export interface ApiLanguage {
  name: string;
  iso639_1?: string;
  iso639_2: string;
  nativeName: string;
}

export interface ApiCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface ApiCountry {
  name: string;
  nativeName: string;
  alpha2Code: string;
  alpha3Code: string;
  numericCode?: string;
  cioc?: string;

  // emoji
  flag: string;
  flags: ApiFlags;

  capital?: string;
  region: string;
  subregion?: string;
  latlng?: [number, number];
  area?: number;
  population: number;
  populationDensity?: number;
  gini?: number;
  demonym?: string;
  independent?: boolean;

  // alpha-3 codes, e.g. "DEU"
  borders?: string[];
  languages?: ApiLanguage[];
  currencies?: ApiCurrency[];
  timezones: string[];
  callingCodes: string[];
  topLevelDomain: string[];
}

export type ApiCountriesResponse = ApiCountry[];

// names of countries

export interface ApiCountryName {
  name: string;
  alpha3Code: string;
}

export type ApiCountryNamesResponse = ApiCountryName[];

export type SearchFn = (query: string) => void;

export type DebouncedFn = {
  (query: string): void;
  cancel(): void;
};
