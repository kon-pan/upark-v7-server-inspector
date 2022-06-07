export function isObjectEmpty(value: any) {
  return (
    value && Object.keys(value).length === 0 && value.constructor === Object
  );
}
