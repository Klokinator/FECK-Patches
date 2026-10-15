.include "Addresses.inc"
.thumb

.macro blh to, reg=r3
  ldr \reg, =\to
  mov lr, \reg
  .short 0xf800
.endm

@ ClearHelpBoxText's three row clears (r0 = HelpTextHandles+0x18, r4 = HelpTextHandles), then rows 4 and 5 for a
@ box taller than 3 rows when they fit; a box with no room for them is cut to 3 rows.
.align 2
ClearHelpBoxRows:
  push {r4-r7, lr}
  mov r5, r4
  blh ClearTextRow
  mov r0, r5
  add r0, #0x20
  blh ClearTextRow
  mov r0, r5
  add r0, #0x28
  blh ClearTextRow
  @ Room: the box's first tile + 0x140 (rows 4 and 5) must not pass the end of OBJ VRAM (tile 0x400).
  mov r6, #0
  ldrh r0, [r5, #0x30]
  ldr r1, =0x3FF
  and r0, r1
  ldr r1, =0x400 - 0x140
  cmp r0, r1
  bgt 1f
  mov r6, #1
1:
  mov r7, #0
  ldr r0, =HelpBoxProc
  bl FitBox
  ldr r0, =HelpBoxProc2
  bl FitBox
  cmp r7, #0
  beq 2f
  mov r0, r5
  add r0, #0x38
  blh ClearTextRow
  mov r0, r5
  add r0, #0x40
  blh ClearTextRow
2:
  pop {r4-r7}
  pop {r0}
  bx r0

@ r0 = a help box proc script. A running box of that kind taller than 3 rows sets r7 when r6 says rows 4 and 5 fit,
@ and is cut to 3 rows when they do not.
FitBox:
  push {lr}
  blh FindProc
  cmp r0, #0
  beq 2f
  add r0, #0x46
  ldrh r1, [r0]
  cmp r1, #0x30
  ble 2f
  cmp r6, #0
  beq 1f
  mov r7, #1
  b 2f
1:
  mov r1, #0x30
  strh r1, [r0]
2:
  pop {r0}
  bx r0
  .ltorg
