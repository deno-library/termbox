import TermBox from "./mod.ts";
import { assertThrows } from "https://deno.land/std@0.186.0/testing/asserts.ts";

Deno.test(`test Hello world`, async () => {
  const termbox = new TermBox();

  await termbox.hideCursor();
  await termbox.clearScreen();

  let i = 0;
  for (const char of "Hello world!") {
    termbox.setCell(i++, 0, char);
  }

  await termbox.flush();
  termbox.cursorTo(0, 0);
  await termbox.showCursor();
  termbox.end();
});

Deno.test(`Throw error`, () => {
  const termbox = new TermBox();

  assertThrows((): void => {
    termbox.setCell(0, 0, "Hello world!");
  });

  termbox.end();
});
