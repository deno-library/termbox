/**
 * Constants for ANSI escape sequences.
 */
const ESC = "\x1B[";

const SAVE = "\x1B7"; // "\x1B[s"
const RESTORE = "\x1B8"; // "\x1B[u"
const HIDE = "?25l";
const SHOW = "?25h";
const POSITION = "6n";

const CLEAR_SCREEN = "2J";

const HOME = "H";

const isTTY = Deno.stdout.isTerminal;

/**
 * Interface representing the size of the terminal.
 */
interface Size {
  columns: number;
  rows: number;
}

/**
 * A class for managing terminal operations using ANSI escape sequences.
 */
export default class TermBox {
  /**
   * Encoder for converting strings to Uint8Array.
   */
  private encoder = new TextEncoder();

  /**
   * Writer for writing to the terminal.
   */
  private writer = Deno.stdout.writable.getWriter();

  /**
   * Two-dimensional array representing the terminal cells.
   */
  private cells: string[][];

  /**
   * Number of columns in the terminal.
   */
  private columns: number;

  /**
   * Number of rows in the terminal.
   */
  private rows: number;

  /**
   * Constructs a new TermBox instance.
   * @param size Optional size of the terminal. If not provided, it will be determined automatically.
   */
  constructor(size?: Size) {
    const { columns, rows } = size ?? this.size();
    this.columns = columns;
    this.rows = rows;
    this.cells = new Array(rows)
      .fill(null)
      .map(() => new Array(columns).fill(null).map(() => " "));
  }

  /**
   * Moves the cursor to a specified position.
   * @param action The ANSI escape sequence for cursor movement.
   * @returns A promise that resolves when the operation is complete.
   */
  private cursor(action: string): Promise<void> {
    return this.write(ESC + action);
  }

  /**
   * Writes a message to the terminal.
   * @param msg The message to write.
   * @returns A promise that resolves when the operation is complete.
   */
  private write(msg: string): Promise<void> {
    return this.writer.write(this.encoder.encode(msg));
  }

  /**
   * Flushes the current state of the terminal cells to the terminal.
   * @returns A promise that resolves when the operation is complete.
   */
  async flush(): Promise<void> {
    await this.cursorTo(0, 0);
    return this.write(this.cells.map((v) => v.join("")).join("\n"));
  }

  /**
   * Sets the content of a specific cell in the terminal grid.
   * @param x The column index.
   * @param y The row index.
   * @param char The character to set.
   */
  setCell(x: number, y: number, char: string): void {
    if (x >= this.columns || x < 0) return;
    if (y >= this.rows || y < 0) return;
    if (stripAnsiCode(char).length > 1) {
      throw new Error("char length cannot be greater than 1");
    }
    this.cells[y][x] = char;
  }

  /**
   * Hides the cursor.
   * @returns A promise that resolves when the operation is complete.
   */
  cursorHide(): Promise<void> {
    return this.cursor(HIDE);
  }

  /**
   * Shows the cursor.
   * @returns A promise that resolves when the operation is complete.
   */
  cursorShow(): Promise<void> {
    return this.cursor(SHOW);
  }

  /**
   * Saves the current cursor position.
   * @returns A promise that resolves when the operation is complete.
   */
  cursorSave(): Promise<void> {
    return this.write(SAVE);
  }

  /**
   * Restores the saved cursor position.
   * @returns A promise that resolves when the operation is complete.
   */
  cursorRestore(): Promise<void> {
    return this.write(RESTORE);
  }

  /**
   * Moves the cursor to a specific position.
   * @param x The column index.
   * @param y The row index.
   * @returns A promise that resolves when the operation is complete.
   */
  cursorTo(x: number, y: number): Promise<void> {
    return this.cursor(`${y};${x}${HOME}`);
  }

  /**
   * Gets the current cursor position.
   * @returns A promise that resolves with the cursor position.
   */
  async cursorPosition(): Promise<Size> {
    if (!isTTY) {
      return { columns: 0, rows: 0 };
    }

    this.cursor(POSITION);

    Deno.stdin.setRaw(true);

    const buf = new Uint8Array(100);
    await Deno.stdin.read(buf);

    Deno.stdin.setRaw(false);

    const output = new TextDecoder().decode(buf);
    const match = output.match(/\[(\d+);(\d+)R/);

    if (match) {
      const rows = parseInt(match[1]);
      const columns = parseInt(match[2]);
      return { columns, rows };
    } else {
      throw new Error("cannot get cursor position");
    }
  }

  /**
   * Clears the screen.
   * @returns A promise that resolves when the operation is complete.
   */
  screenClear(): Promise<void> {
    return this.cursor(CLEAR_SCREEN);
  }

  /**
   * Resets the screen to its initial state.
   * @returns A promise that resolves when the operation is complete.
   */
  screenReset(): Promise<void> {
    return this.write(ESC + (this.rows - 1) + "A\r\x1b[?0J");
  }

  /**
   * Gets the size of the terminal.
   * @returns The size of the terminal.
   */
  size(): Size {
    if (!isTTY) return { columns: 100, rows: 50 };
    return {
      columns: Deno.consoleSize().columns,
      rows: Deno.consoleSize().rows,
    };
  }

  /**
   * Ends the session and releases any resources.
   */
  end(): void {
    this.writer.releaseLock();
  }
}

/**
 * Regular expression pattern for matching ANSI escape codes.
 */
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))",
  ].join("|"),
  "g",
);

/**
 * Strips ANSI escape codes from a string.
 * @param string The string to strip.
 * @returns The stripped string.
 */
function stripAnsiCode(string: string): string {
  return string.replace(ANSI_PATTERN, "");
}