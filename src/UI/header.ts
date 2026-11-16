import type { HeaderCallbacks } from '../types';
import { elementCreators } from './element-creators';

const { createElement, createButton } = elementCreators;

let input: HTMLInputElement;

export function createHeader(callbacks: HeaderCallbacks): HTMLElement {
  const header = createElement('header', {
    className: 'header',
    parent: document.body,
  });
  const upper = createElement('div', {
    className: 'header__upper',
    parent: header,
  });
  const search = createElement('div', {
    className: 'header__search',
    parent: upper,
  });

  input = createElement('input', {
    className: 'header__input',
    attrs: {
      type: 'text',
      placeholder: 'Type a country name',
      'aria-label': 'Country name',
    },
    parent: search,
  });
  const clearButton = createButton('Clear', 'header__button', search);

  input.addEventListener('input', () => callbacks.onChange(input.value.trim()));
  clearButton.addEventListener('click', () => {
    input.value = '';
    input.focus();
    callbacks.onChange('');
  });

  return header;
}

export function setHeaderInput(value: string): void {
  input.value = value;
}
