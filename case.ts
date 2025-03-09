export function camelCase(underscored: string) {
  return underscored.split("_").reduce((acc, cur, idx) => {
    if (idx === 0) {
      return acc + cur.toLowerCase();
    }

    return acc + cur.charAt(0).toUpperCase() + cur.slice(1).toLowerCase();
  }, "");
}

export function snakeCase(camelCased: string) {
  return camelCased.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
