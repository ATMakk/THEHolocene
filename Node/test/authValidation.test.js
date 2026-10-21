const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail,
  isValidEmail,
  isValidName,
  isValidTag,
  isValidPassword,
} = require("../utils/authValidation");

test("normalizes valid email addresses and rejects malformed addresses", () => {
  assert.equal(normalizeEmail("  News.User+1@Example.com "), "news.user+1@example.com");
  assert.equal(isValidEmail("news.user+1@example.com"), true);
  assert.equal(isValidEmail("person..name@example.com"), false);
  assert.equal(isValidEmail("person@example"), false);
  assert.equal(isValidEmail("person@-example.com"), false);
  assert.equal(isValidEmail(`a${"b".repeat(250)}@example.com`), false);
});

test("validates names and optional username tags", () => {
  assert.equal(isValidName("Zoë O'Neil"), true);
  assert.equal(isValidName("A"), false);
  assert.equal(isValidName("<script>"), false);
  assert.equal(isValidTag(undefined), true);
  assert.equal(isValidTag("reader_42"), true);
  assert.equal(isValidTag("bad tag"), false);
});

test("requires a strong password within bcrypt's byte-length limit", () => {
  assert.equal(isValidPassword("longPassword42"), true);
  assert.equal(isValidPassword("short1"), false);
  assert.equal(isValidPassword("longpassword"), false);
  assert.equal(isValidPassword("longPassword 42"), false);
  assert.equal(isValidPassword(`${"é".repeat(36)}A1`), false);
});
