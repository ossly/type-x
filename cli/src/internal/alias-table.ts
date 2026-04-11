export interface AliasRow {
  alias: string;
  command: string;
}

export const printAliasTable = (rows: AliasRow[]): void => {
  if (rows.length === 0) {
    console.log("No aliases configured.");
    return;
  }

  const aliasWidth = getColumnWidth(
    "ALIAS",
    rows.map((row) => row.alias),
  );
  const commandWidth = getColumnWidth(
    "COMMAND",
    rows.map((row) => row.command),
  );

  console.log(
    [
      "ALIAS".padEnd(aliasWidth),
      "COMMAND".padEnd(commandWidth),
    ].join("  "),
  );

  for (const row of rows) {
    console.log(
      [
        row.alias.padEnd(aliasWidth),
        row.command.padEnd(commandWidth),
      ].join("  "),
    );
  }
};

const getColumnWidth = (header: string, values: string[]): number => {
  return values.reduce(
    (width, value) => Math.max(width, value.length),
    header.length,
  );
};
