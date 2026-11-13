import type { Country } from '../types';
import { elementCreators } from './element-creators';

const { createElement, createButton } = elementCreators;

let image: HTMLImageElement;
let title: HTMLHeadingElement;
let description: HTMLParagraphElement;
let area: HTMLElement;
let borders: HTMLElement;
let languages: HTMLElement;
let currencies: HTMLElement;

export function createDetailsModal(): HTMLDialogElement {
  const dialog = createElement('dialog', {
    className: 'details-dialog',
    parent: document.body,
  });
  const details = createElement('div', {
    className: 'details',
    parent: dialog,
  });

  const closeButton = createButton('✕', 'details__close', details);
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.addEventListener('click', () => dialog.close());

  const media = createElement('div', {
    className: 'details__media',
    parent: details,
  });
  image = createElement('img', { className: 'details__image', parent: media });

  const info = createElement('div', {
    className: 'details__info',
    parent: details,
  });
  const header = createElement('div', {
    className: 'details__header',
    parent: info,
  });
  title = createElement('h2', { className: 'details__title', parent: header });

  createElement('h3', {
    className: 'details__subtitle',
    text: 'Description:',
    parent: info,
  });
  description = createElement('p', {
    className: 'details__description',
    parent: info,
  });

  const stats = createElement('dl', {
    className: 'details__stats',
    parent: info,
  });
  area = createStat('Area:', stats);
  borders = createStat('Borders:', stats);
  languages = createStat('Languages:', stats);
  currencies = createStat('Currency:', stats);

  return dialog;
}

export function initDetailsModal(
  dialog: HTMLDialogElement,
  country: Country
): void {
  image.src = country.flagUrl;
  image.alt = `Flag of ${country.name}`;
  title.textContent = country.name;
  description.textContent = country.description;

  area.textContent =
    country.area === null ? '—' : `${country.area.toLocaleString('en-US')} km²`;
  borders.textContent = joinOrDash(country.borderNames);
  languages.textContent = joinOrDash(country.languages);
  currencies.textContent = joinOrDash(
    country.currencies.map((c) => `${c.name} (${c.symbol}, ${c.code})`)
  );

  dialog.showModal();
}

// creates one "label: value" row and returns the element for the value
function createStat(label: string, parent: HTMLElement): HTMLElement {
  const stat = createElement('div', { className: 'details__stat', parent });
  createElement('dt', {
    className: 'details__label',
    text: label,
    parent: stat,
  });

  return createElement('dd', { className: 'details__value', parent: stat });
}

function joinOrDash(items: readonly string[]): string {
  return items.length > 0 ? items.join(', ') : '—';
}
