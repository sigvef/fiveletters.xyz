import { HTMLProps } from "react";
import { colors } from "./colors";
import { T } from "./text";

export const Button: React.FC<HTMLProps<HTMLAnchorElement>> = (props) => (
  <a
    href="https://fiveletters.gumroad.com/l/yjxbev?wanted=true"
    data-gumroad-single-product="true"
    style={{
      marginTop: 16,
      borderRadius: 999,
      alignSelf: "center",
      justifyContent: "center",
      alignItems: "center",
      display: "flex",
      cursor: "pointer",
      color: colors.light,
      textDecoration: "none",
      boxShadow: "0px 2px 4px " + colors.dark + "88",
    }}
    {...props}
  >
    <div
      style={{
        paddingLeft: 32,
        paddingRight: 32,
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 999,
        backgroundColor: colors.extraBlack,
        alignSelf: "center",
        display: "flex",
      }}
    >
      <T style={{ color: colors.light }}>{props.children}</T>
    </div>
  </a>
);
