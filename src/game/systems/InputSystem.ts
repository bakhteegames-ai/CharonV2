import { hasCapability } from "../config/movementProfile";

export class InputSystem {
  // Unified command interface (true for exactly one frame)
  public moveLeft: boolean = false;
  public moveRight: boolean = false;
  public jump: boolean = false;
  public slide: boolean = false;
  public pause: boolean = false;

  // Internal keyboard tracking to prevent key-repeat triggers
  private keysDown: Record<string, boolean> = {};

  // Touch tracking
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private hasSwiped: boolean = false;
  private readonly SWIPE_THRESHOLD = 30; // pixels
  // If both axes exceed threshold and ratio is within this range => diagonal (trigger both)
  private readonly DIAGONAL_MIN_RATIO = 0.55; // dx/dy >= 0.55
  private readonly DIAGONAL_MAX_RATIO = 1.8; // dx/dy <= 1.8

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    // Mobile support
    window.addEventListener("touchstart", this.onTouchStart, {
      passive: false,
    });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd);
  }

  public dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);

    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchEnd);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Prevent the browser from scrolling the page when using arrows/space.
    if (
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight" ||
      e.code === "ArrowUp" ||
      e.code === "ArrowDown" ||
      e.code === "Space"
    ) {
      e.preventDefault();
    }

    if (this.keysDown[e.code]) return; // Prevent OS-level key repeat
    this.keysDown[e.code] = true;

    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = true;
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight = true;
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        if (hasCapability("jump")) this.jump = true;
        break;
      case "ArrowDown":
      case "KeyS":
        this.slide = true;
        break;
      case "Escape":
      case "KeyP":
        this.pause = true;
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown[e.code] = false;
  };

  public update() {
    // Clear all triggers at the end of the frame
    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;
    this.slide = false;
    this.pause = false;
  }

  private onTouchStart = (e: TouchEvent) => {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.hasSwiped = false;
  };

  private onTouchMove = (e: TouchEvent) => {
    // Prevent default scrolling (crucial for mobile web games)
    e.preventDefault();

    if (this.hasSwiped) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    const dx = touchX - this.touchStartX;
    const dy = touchY - this.touchStartY;

    // Check if swipe distance exceeds threshold
    if (
      Math.abs(dx) > this.SWIPE_THRESHOLD ||
      Math.abs(dy) > this.SWIPE_THRESHOLD
    ) {
      this.hasSwiped = true; // Lock further commands for this specific touch

      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      const bothStrong = ax > this.SWIPE_THRESHOLD && ay > this.SWIPE_THRESHOLD;
      const ratio = ay === 0 ? Infinity : ax / ay;
      const isDiagonal =
        bothStrong &&
        ratio >= this.DIAGONAL_MIN_RATIO &&
        ratio <= this.DIAGONAL_MAX_RATIO;

      if (isDiagonal) {
        // Horizontal part
        if (dx > 0) this.moveRight = true;
        else this.moveLeft = true;
        // Vertical part
        if (dy > 0) this.slide = true;
        else if (hasCapability("jump")) this.jump = true;
        return;
      }

      // Fallback to dominant axis (current behavior)
      if (ax > ay) {
        if (dx > 0) this.moveRight = true;
        else this.moveLeft = true;
      } else {
        if (dy > 0) this.slide = true;
        else if (hasCapability("jump")) this.jump = true;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    this.hasSwiped = false;
  };

  public reset() {
    this.keysDown = {};
    this.update();
  }
}
