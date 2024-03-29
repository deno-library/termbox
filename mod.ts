const ESC = "\x1B[";

const SAVE = "\x1B7"; // "\x1B[s"
const RESTORE = "\x1B8"; // "\x1B[u"
const HIDE = "?25l";
const SHOW = "?25h";
const POSITION = "6n";

const CLEAR_SCREEN = "2J";

const HOME = "H";

const isTTY = Deno.isatty(Deno.stdout.rid) && Deno.isatty(Deno.stdin.rid);

interface Size {
  columns: number;
  rows: number;
}

export default class TermBox {
  private encoder = new TextEncoder();
  private writer = Deno.stdout.writable.getWriter();
  private cells: string[][];
  private columns: number;
  private rows: number;

  constructor(size?: Size) {
    const { columns, rows } = size ?? this.size();
    this.columns = columns;
    this.rows = rows;
    this.cells = new Array(rows)
      .fill(null)
      .map(() => new Array(columns).fill(null).map(() => " "));
  }

  private cursor(action: string): Promise<void> {
    return this.write(ESC + action);
  }

  private write(msg: string): Promise<void> {
    return this.writer.write(this.encoder.encode(msg));
  }

  async flush(): Promise<void> {
    await this.cursorTo(0, 0);
    return this.write(this.cells.map((v) => v.join("")).join("\n"));
  }

  setCell(x: number, y: number, char: string): void {
    if (x >= this.columns || x < 0) return;
    if (y >= this.rows || y < 0) return;
    if (stripAnsiCode(char).length > 1) {
      throw new Error("char length cannot be greater than 1");
    }
    this.cells[y][x] = char;
  }

  cursorHide(): Promise<void> {
    return this.cursor(HIDE);
  }

  cursorShow(): Promise<void> {
    return this.cursor(SHOW);
  }

  cursorSave(): Promise<void> {
    return this.write(SAVE);
  }

  cursorRestore(): Promise<void> {
    return this.write(RESTORE);
  }

  cursorTo(x: number, y: number): Promise<void> {
    return this.cursor(`${y};${x}${HOME}`);
  }

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

  screenClear(): Promise<void> {
    return this.cursor(CLEAR_SCREEN);
  }

  screenReset(): Promise<void> {
    return this.write(ESC + (this.rows - 1) + "A\r\x1b[?0J");
  }

  size(): Size {
    if (!isTTY) return { columns: 100, rows: 50 };
    return {
      columns: Deno.consoleSize().columns,
      rows: Deno.consoleSize().rows,
    };
  }

  end(): void {
    this.writer.releaseLock();
  }
}

// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))",
  ].join("|"),
  "g",
);

function stripAnsiCode(string: string): string {
  return string.replace(ANSI_PATTERN, "");
}
