.include "Addresses.inc"
.thumb

.macro blh to, reg=r3
  ldr \reg, =\to
  mov lr, \reg
  .short 0xf800
.endm

@ The help text proc's start, where it takes the text handles (r4 = the proc, r5 = HelpTextHandles, r9/r8/r6 =
@ its rows 1 to 3). Rows 4 and 5 get their handles when the box was given them, else none (HelpTextNewLine stops).
.align 2
InitProcTextHandles:
  push {r6, lr}
  str r5, [r4, #0x30]
  mov r0, r9
  str r0, [r4, #0x34]
  mov r1, r8
  str r1, [r4, #0x38]
  str r6, [r4, #0x3C]
  mov r6, #0
  str r6, [r4, #0x40]
  str r6, [r4, #0x44]
  bl TallBox
  cmp r0, #0
  beq 1f
  mov r6, r5
  add r6, #0x38
  mov r0, #0
  mov r1, #6
  strb r0, [r6, #2]   @ x cursor
  strb r1, [r6, #3]   @ colour, as Text_SetColorId
  str r6, [r4, #0x40]
  add r6, #8
  strb r0, [r6, #2]
  strb r1, [r6, #3]
  str r6, [r4, #0x44]
1:
  pop {r6}
  pop {r0}
  bx r0

@ r0 = 1 when a help box taller than 3 rows is running (ClearHelpBoxRows has cut the ones without room).
TallBox:
  push {lr}
  ldr r0, =HelpBoxProc
  bl BoxHeight
  cmp r0, #0x30
  bgt 1f
  ldr r0, =HelpBoxProc2
  bl BoxHeight
  cmp r0, #0x30
  bgt 1f
  mov r0, #0
  b 2f
1:
  mov r0, #1
2:
  pop {r1}
  bx r1

@ r0 = a help box proc script: the running box's target height, or 0.
BoxHeight:
  push {lr}
  blh FindProc
  cmp r0, #0
  beq 1f
  add r0, #0x46
  ldrh r0, [r0]
1:
  pop {r1}
  bx r1
  .ltorg
