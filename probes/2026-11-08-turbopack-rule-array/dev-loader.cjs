module.exports = function (source) {
  return source.replaceAll("__DEV_MARKER__", "dev-rule-ran");
};
