.include "Addresses.inc"
.thumb

.macro blh to, reg=r3
  ldr \reg, =\to
  mov lr, \reg
  .short 0xf800
.endm

@ The help text scroll's new line (r3 = the text, r4 = the proc, r5 = its line number at +0x5C). A line with no
@ text handle (rows 4 and 5 not given, or past row 5) ends the text instead of drawing over other tiles.
.align 2
HelpTextNewLine:
  add r0, r3, #1
  str r0, [r4, #0x2C]
  ldrh r0, [r5]
  add r0, #1
  strh r0, [r5]
  lsl r0, #16
  asr r0, #16
  cmp r0, #4
  bgt 1f
  lsl r1, r0, #2
  add r1, r4
  ldr r1, [r1, #0x34]
  cmp r1, #0
  beq 1f
  ldr r2, =ScrollNextChar
  bx r2
1:
  mov r0, r4
  blh BreakProcLoop
  ldr r2, =ScrollDone
  bx r2
  .ltorg
