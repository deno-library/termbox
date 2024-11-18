# termbox

[![JSR Version](https://jsr.io/badges/@deno-library/termbox)](https://jsr.io/@deno-library/termbox)

Termbox is a deno package that provides a cell based view for text terminals.

## Usage

```ts
import TermBox from "jsr:@deno-library/termbox";
// or
// import TermBox from "https://deno.land/x/termbox@v0.2.1/mod.ts";

const termbox = new TermBox();

termbox.setCell(x, y, "a");
```

## Interface

```ts
class TermBox {
  constructor(size?: Size);
  flush(): Promise<void>;
  size(): Size;
  end(): void;

  setCell(x: number, y: number, char: string): void;

  cursorHide(): Promise<void>;
  cursorShow(): Promise<void>;
  cursorSave(): Promise<void>;
  cursorRestore(): Promise<void>;
  cursorTo(x: number, y: number): Promise<void>;
  cursorPosition(): Promise<Size>;

  screenClear(): Promise<void>;
  screenReset(): Promise<void>;
}

interface Size {
  columns: number;
  rows: number;
}
```

## example

> https://github.com/deno-library/sl
