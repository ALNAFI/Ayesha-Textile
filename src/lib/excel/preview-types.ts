export type PreviewMerge = {
  r: number;
  c: number;
  rows: number;
  cols: number;
};

export type PreviewSheet = {
  name: string;
  /** Display text for each cell, including blanks inside the used range. */
  rows: string[][];
  /** 0-based Excel row index of the first previewed row. */
  originRow: number;
  /** 0-based Excel column index of the first previewed column. */
  originCol: number;
  rowCount: number;
  colCount: number;
  truncated: boolean;
  merges: PreviewMerge[];
};

export function columnLabel(index: number): string {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}
