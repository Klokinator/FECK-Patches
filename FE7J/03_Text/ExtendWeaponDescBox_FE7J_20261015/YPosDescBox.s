.include "Addresses.inc"
.thumb

.macro blh to, reg=r3
  ldr \reg, =\to
  mov lr, \reg
  .short 0xf800
.endm

@ The help box's y, eased as the game does (r0 = end time, r1/r2 = start/end, r12 = time, r5 = the easing, r6 =
@ the box proc), but never above the screen: a 5-row box over an item near the top would start at a negative y.
.align 2
YPosDescBox:
  push {r4, lr}
  sub sp, #4
  str r0, [sp]
  mov r0, r5
  mov r3, r12
  blh EasingValue, r4
  cmp r0, #0
  bge 1f
  mov r0, #0
1:
  strh r0, [r6, #0x32]
  add sp, #4
  pop {r4}
  pop {r0}
  bx r0
  .ltorg
