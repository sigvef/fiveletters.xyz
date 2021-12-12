import { HTMLProps } from "react";
import { colors } from "./colors";

export const T: React.FC<{
  style?: any;
  children: HTMLProps<HTMLDivElement>["children"];
  className?: string;
}> = ({ style, children, className }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        fontSize: 22,
        lineHeight: "1.33",
        color: colors.extraBlack,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};
