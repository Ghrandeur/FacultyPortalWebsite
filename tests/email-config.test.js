const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveEmailConfig } = require('../backend/config/email');

test('resolveEmailConfig falls back to a valid newsletter sender when env values are missing', () => {
  delete process.env.EMAIL_FROM;
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASSWORD;
  delete process.env.NEWSLETTER_FROM_NAME;

  const config = resolveEmailConfig();

  assert.equal(config.fromAddress, 'fahssauniuyoeditorialboard@gmail.com');
  assert.equal(config.user, 'fahssauniuyoeditorialboard@gmail.com');
  assert.equal(config.pass, '');
  assert.equal(config.fromName, 'FAHSSA Newsletter');
});

test('resolveEmailConfig trims whitespace from email settings', () => {
  process.env.EMAIL_FROM = ' fahssauniuyoeditorialboard@gmail.com ';
  process.env.EMAIL_USER = ' promiseetok211@gmail.com ';
  process.env.EMAIL_PASSWORD = ' NOMKLSUXGPGJUDHM ';
  process.env.NEWSLETTER_FROM_NAME = ' FAHSSA Newsletter ';

  const config = resolveEmailConfig();

  assert.equal(config.fromAddress, 'fahssauniuyoeditorialboard@gmail.com');
  assert.equal(config.user, 'promiseetok211@gmail.com');
  assert.equal(config.pass, 'NOMKLSUXGPGJUDHM');
  assert.equal(config.fromName, 'FAHSSA Newsletter');
});
