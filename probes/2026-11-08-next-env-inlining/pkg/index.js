export function read() {
  return `service=${process.env.IMAGEFORGE_SERVICE}|base=${process.env.IMAGEFORGE_BASE_PATH}`;
}
