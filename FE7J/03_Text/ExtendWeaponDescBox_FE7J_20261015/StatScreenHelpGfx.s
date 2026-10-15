.include "Addresses.inc"
.thumb

.macro blh to, reg=r3
  ldr \reg, =\to
  mov lr, \reg
  .short 0xf800
.endm

@ The stat screen's help setup ("Rメニューの設定"), after its push {r4, r5, lr} and mov r4, r0 (r1 = its second
@ argument, kept in r5). The game loads the help box's graphics at the default 0x6013000 there, but the stat screen
@ draws its page title, page arrows and portrait frame with the OBJ tiles after that box (0x6014800 on), where a
@ 5-row box's rows 4 and 5 go. Its box goes to 0x6011000 instead: tiles 0x80 to 0x1BF with rows 4 and 5, which no
@ page of the stat screen uses (the map's unit sprites are there, and the stat screen hides the map).
.align 2
StatScreenHelpGfx:
  push {lr}
  mov r5, r1
  ldr r0, =0x06011000
  mov r1, #1
  neg r1, r1
  blh LoadDialogueBoxGfx
  pop {r0}
  bx r0
  .ltorg
