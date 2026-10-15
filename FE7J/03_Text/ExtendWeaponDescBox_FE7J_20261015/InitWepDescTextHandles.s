.include "Addresses.inc"
.thumb

.macro blh to, reg=r3
  ldr \reg, =\to
  mov lr, \reg
  .short 0xf800
.endm

@ LoadDialogueBoxGfx, after the first text handle: r0 = HelpTextHandles+0x20, r6 = HelpTextHandles.
.align 2
InitWepDescTextHandles:
  push {lr}
  blh Text_Init
  mov r0, r6
  add r0, #0x28
  blh Text_Init
  mov r0, r6
  add r0, #0x38
  blh Text_Init
  mov r0, r6
  add r0, #0x40
  blh Text_Init
  pop {r0}
  bx r0
  .ltorg
