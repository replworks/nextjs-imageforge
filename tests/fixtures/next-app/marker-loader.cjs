module.exports = function markerLoader(source) {
  return source.replaceAll("__DEVELOPER_MARKER__", "developer-rule-ran");
};
