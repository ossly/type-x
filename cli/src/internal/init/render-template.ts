export const renderTemplate = (
  template: string,
  values: Record<string, string>,
): string => {
  return template.replaceAll(/\{\{([A-Z0-9_]+)\}\}/g, (match, key: string) => {
    const value = values[key];

    if (value === undefined) {
      throw new Error(`Missing template value for "${key}" in ${match}.`);
    }

    return value;
  });
};
