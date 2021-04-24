import {distanceSquared} from './math.js';

export let INPUT: Input;

const DOWN_KEYS = Object.freeze(['s', 'ArrowDown']);
const UP_KEYS = Object.freeze(['w', 'ArrowUp']);
const LEFT_KEYS = Object.freeze(['a', 'ArrowLeft']);
const RIGHT_KEYS = Object.freeze(['d', 'ArrowRight']);

export class Input {
  up = 0;
  right = 0;
  readonly mouse = {x: 0, y: 0};
  readonly leftAxis = {x: 0, y: 0};
  readonly rightAxis = {x: 0, y: 0};
  leftTrigger = 0;
  rightTrigger = 0;

  private readonly heldKeys = new Set<string>();

  // on Firefox, triggers return zero until they're moved, then released, at which point they return -1.
  private leftTriggerMin = 0;
  private rightTriggerMin = 0;

  aimMode: 'mouse'|'joystick' = 'mouse';

  constructor() {
    INPUT = this;
    addEventListener('mousemove', evt => {
      this.aimMode = 'mouse';
      this.mouse.x = evt.clientX;
      this.mouse.y = evt.clientY;
    });

    addEventListener('keydown', evt => this.heldKeys.add(evt.key));
    addEventListener('keyup', evt => this.heldKeys.delete(evt.key));
    addEventListener('blur', () => this.heldKeys.clear());
  }

  tick() {
    this.updateGamepads();
    this.up = this.rightTrigger - this.leftTrigger + this.readKeyboardAxis(DOWN_KEYS, UP_KEYS);
    this.right = this.leftAxis.x + this.readKeyboardAxis(LEFT_KEYS, RIGHT_KEYS);
  }

  private readKeyboardAxis(negativeBindings: readonly string[], positiveBindings: readonly string[]) {
    let isNegative = false;
    let isPositive = false;
    for(let i = 0; i < negativeBindings.length; i++) isNegative = isNegative || this.heldKeys.has(negativeBindings[i]);
    for(let i = 0; i < positiveBindings.length; i++) isPositive = isPositive || this.heldKeys.has(positiveBindings[i]);
    return Number(isNegative) * -1 + Number(isPositive);
  }

  private updateGamepads() {
    const [firstGamepad] = navigator.getGamepads();

    if(!firstGamepad) {
      this.aimMode = 'mouse';
      return;
    }

    const oldRight = {x: this.rightAxis.y, y: this.rightAxis.y};

    // everyone agrees that the left stick is 0 and 1.
    this.leftAxis.x = firstGamepad.axes[0];
    this.leftAxis.y = firstGamepad.axes[1];

    if(firstGamepad.mapping === 'standard') {
      this.rightAxis.x = firstGamepad.axes[2];
      this.rightAxis.y = firstGamepad.axes[3];
      this.leftTrigger = firstGamepad.buttons[6].value;
      this.rightTrigger = firstGamepad.buttons[7].value;
    } else {
      this.rightAxis.x = firstGamepad.axes[3];
      this.rightAxis.y = firstGamepad.axes[4];

      // firefox on linux groups the left and right halves of the controller.
      this.leftTriggerMin = Math.min(firstGamepad.axes[2], this.leftTriggerMin);
      this.rightTriggerMin = Math.min(firstGamepad.axes[5], this.rightTriggerMin);

      this.leftTrigger = (firstGamepad.axes[2] - this.leftTriggerMin) / (1 - this.leftTriggerMin);
      this.rightTrigger = (firstGamepad.axes[5] - this.rightTriggerMin) / (1 - this.rightTriggerMin);
    }

    if(this.aimMode !== 'joystick' && distanceSquared(oldRight, this.rightAxis) > 0.1) {
      this.aimMode = 'joystick';
    }
  }
}
