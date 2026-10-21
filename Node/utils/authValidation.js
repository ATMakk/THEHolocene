const EMAIL_PATTERN =
  /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' -]{1,49}$/u;
const TAG_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[^\s]{10,72}$/;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidEmail = (email) =>
  typeof email === "string" &&
  email.length <= 254 &&
  EMAIL_PATTERN.test(email);

const isValidName = (name) =>
  typeof name === "string" && NAME_PATTERN.test(name.trim());

const isValidTag = (tag) =>
  tag === undefined ||
  tag === null ||
  tag === "" ||
  (typeof tag === "string" && TAG_PATTERN.test(tag.trim()));

const isValidPassword = (password) =>
  typeof password === "string" &&
  Buffer.byteLength(password, "utf8") <= 72 &&
  PASSWORD_PATTERN.test(password);

module.exports = {
  normalizeEmail,
  isValidEmail,
  isValidName,
  isValidTag,
  isValidPassword,
};
