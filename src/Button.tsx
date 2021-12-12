import { HTMLProps, useCallback } from "react";
import { colors } from "./colors";

export const Button: React.FC<
  HTMLProps<HTMLAnchorElement> & {
    buttonColor?: string;
    textColor?: string;
    shadowColor?: string;
  }
> = (props) => {
  const onClick = useCallback(
    (e: any) => {
      e.preventDefault();
      props.onClick?.(e);
    },
    [props.onClick]
  );
  return (
    <a
      href="#"
      {...props}
      onClick={onClick}
      style={{
        marginTop: 16,
        borderRadius: 999,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        cursor: "pointer",
        textDecoration: "none",
        boxShadow: "0px 2px 4px " + (props.shadowColor ?? colors.dark) + "88",
        paddingLeft: 32,
        paddingRight: 32,
        paddingTop: 16,
        paddingBottom: 16,
        background: props.buttonColor ?? colors.extraBlack,
        color: props.textColor ?? colors.light,
        ...props.style,
      }}
    >
      {props.children}
    </a>
  );
};
