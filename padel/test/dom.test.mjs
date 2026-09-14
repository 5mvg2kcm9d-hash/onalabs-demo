import test from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, when, esc, plural, percent, formatDate } from '../js/dom.js';

test('interpolated values are escaped', () => {
  const name = '<img src=x onerror="alert(1)">';
  const out = String(html`<span>${name}</span>`);
  assert.ok(!out.includes('<img'), out);
  assert.ok(out.includes('&lt;img'));
});

test('quotes are escaped so attributes cannot be broken out of', () => {
  assert.equal(String(html`<b title="${'a" onclick="x'}">`), '<b title="a&quot; onclick=&quot;x">');
});

test('a nested html template is not escaped again', () => {
  const inner = html`<b>${'Sam & Noor'}</b>`;
  const out = String(html`<div>${inner}</div>`);
  assert.equal(out, '<div><b>Sam &amp; Noor</b></div>');
});

test('arrays render each item, escaping plain strings', () => {
  const rows = ['Sam', 'Bo & Co'].map((n) => html`<li>${n}</li>`);
  assert.equal(String(html`<ul>${rows}</ul>`), '<ul><li>Sam</li><li>Bo &amp; Co</li></ul>');
  assert.equal(String(html`${['<b>', '<i>']}`), '&lt;b&gt;&lt;i&gt;');
});

test('raw() opts out of escaping and is idempotent', () => {
  assert.equal(String(html`${raw('<hr>')}`), '<hr>');
  assert.equal(String(html`${raw(raw('<hr>'))}`), '<hr>');
});

test('null, undefined and false render as nothing', () => {
  assert.equal(String(html`[${null}${undefined}${false}]`), '[]');
  assert.equal(String(html`[${0}]`), '[0]', 'zero still prints');
});

test('when() renders only on a truthy condition and takes a lazy value', () => {
  assert.equal(String(html`${when(true, () => html`<b>ja</b>`)}`), '<b>ja</b>');
  assert.equal(String(html`${when(false, () => { throw new Error('should not run'); })}`), '');
  assert.equal(String(html`${when(true, '<i>x</i>')}`), '<i>x</i>');
});

test('esc handles non-strings', () => {
  assert.equal(esc(42), '42');
  assert.equal(esc(null), '');
});

test('plural and percent', () => {
  assert.equal(plural(1, 'speler', 'spelers'), '1 speler');
  assert.equal(plural(3, 'speler', 'spelers'), '3 spelers');
  assert.equal(percent(0.666), '67%');
  assert.equal(percent(0), '0%');
});

test('formatDate is empty for a missing timestamp', () => {
  assert.equal(formatDate(null), '');
  assert.ok(formatDate(Date.now()).startsWith('Vandaag'));
});
