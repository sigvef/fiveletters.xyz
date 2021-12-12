import { IconProps, RocketIcon } from "@primer/octicons-react";
import { memo } from "react";

export const MemoizedRocketIcon = memo((props: IconProps) => (
  <RocketIcon {...props} />
));
