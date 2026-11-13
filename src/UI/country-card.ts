import type { Country } from '../types';
import { elementCreators } from './element-creators';

const { createElement, createButton } = elementCreators;

export function createCountryCard(
  country: Country,
  onOpen: (code: string) => void
): HTMLElement {
  const card = createElement('div', { className: 'search-item' });

  const media = createElement('div', {
    className: 'search-item__media',
    parent: card,
  });
  createElement('img', {
    className: 'search-item__image',
    attrs: { src: country.flagUrl, alt: `Flag of ${country.name}` },
    parent: media,
  });

  const stats = createElement('div', {
    className: 'search-item__stats',
    parent: card,
  });
  createStat('Capital:', country.capital ?? '—', stats);
  createStat('Region:', country.region, stats);
  createStat('Population:', country.population.toLocaleString('en-US'), stats);

  createElement('h3', {
    className: 'search-item__title',
    text: country.name,
    parent: card,
  });
  createButton('more...', 'search-item__button', card);

  // the button is inside the card, so one listener covers both
  card.addEventListener('click', () => onOpen(country.code));

  return card;
}

function createStat(label: string, value: string, parent: HTMLElement): void {
  const stat = createElement('span', {
    className: 'search-item__stat',
    parent,
  });
  createElement('span', {
    className: 'search-item__label',
    text: label,
    parent: stat,
  });
  stat.append(value);
}
