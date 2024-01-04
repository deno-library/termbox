import TermBox from "./mod.ts";
import { assertThrows } from "https://deno.land/std@0.186.0/testing/asserts.ts";

Deno.test(`test Hello world`, async () => {
  const termbox = new TermBox();

  await termbox.cursorHide();
  await termbox.screenClear();

  let i = 0;
  for (const char of "Hello world!") {
    termbox.setCell(i++, 0, char);
  }

  await termbox.flush();
  termbox.cursorTo(0, 0);
  await termbox.cursorShow();
  termbox.end();
});

Deno.test(`test throw error`, () => {
  const termbox = new TermBox();

  assertThrows((): void => {
    termbox.setCell(0, 0, "Hello world!");
  });

  termbox.end();
});

Deno.test(`test position`, async () => {
  const termbox = new TermBox();
  console.log("stdout isatty: ", Deno.isatty(Deno.stdout.rid));
  console.log("stdin isatty: ", Deno.isatty(Deno.stdin.rid));
  console.log(await termbox.cursorPosition());
  termbox.end();
});
