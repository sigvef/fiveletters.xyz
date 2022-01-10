export const capitalizeFirst = (value: string) => {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
};

export const isSuperTinyMobileScreen = (height: number) => height <= 599;
export const isMobileScreen = (width: number, height: number) =>
  width <= 560 || isSuperTinyMobileScreen(height);

export const makeFakeTouchList = (e: MouseEvent) => {
  return [
    {
      clientX: e.clientX,
      clientY: e.clientY,
      identifier: Math.random(),
    },
  ];
};

interface Animation {
  value: number;
  speed: number;
  friction: number;
  springiness: number;
  properties: {
    [key: string]: (value: number) => string;
  };
  element: HTMLElement;
}

const animations: { [key: string]: Animation } = {};

let previousTime = performance.now();
let animationTimeAccumulator = 0;
const animationLoop = (time: number) => {
  animationTimeAccumulator += time - previousTime;
  const frameLength = 1000 / 60;
  let count = 1;
  while (animationTimeAccumulator >= frameLength) {
    animationTimeAccumulator -= frameLength;
    count = 0;
    const epsilon = 0.0000001;
    let loopBuster = 0;
    for (const key in animations) {
      count++;
      const animation = animations[key];
      loopBuster++;
      if (loopBuster > 1000) {
        debugger;
      }
      const originalValue = animation.value;
      animation.value = animation.value + animation.speed;
      animation.speed =
        animation.springiness * animation.speed +
        (1 - animation.springiness) * -animation.value;
      animation.speed *= animation.friction;
      if (
        Math.abs(originalValue - animation.value) < epsilon &&
        Math.abs(animation.value) < epsilon
      ) {
        animation.value = 0;
        delete animations[key];
      }
      for (const [property, getValue] of Object.entries(animation.properties)) {
        //@ts-expect-error dynamic style setting
        animation.element.style[property] = getValue(animation.value);
      }
    }
  }

  if (count > 0) {
    requestAnimationFrame(animationLoop);
  } else {
  }
  previousTime = time;
};

export const startAnimation = (key: string, animation: Animation) => {
  animations[key] = animation;
  previousTime = performance.now();
  animationTimeAccumulator = 1000 / 60 + 0.00001;
  requestAnimationFrame(animationLoop);
};
