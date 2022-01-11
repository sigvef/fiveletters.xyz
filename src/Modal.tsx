import { XIcon } from "@primer/octicons-react";
import { memo } from "react";
import { borderRadius, colors, containerMaxWidth } from "./colors";
import { isSuperTinyMobileScreen } from "./utils";

export const Modal: React.FC<{
  visible: boolean;
  dismiss: () => void;
}> = memo(({ visible, dismiss, children }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: visible ? "all" : "none",
      overflow: "hidden",
      zIndex: 999,
    }}
  >
    <div
      data-backdrop="true"
      onClick={(e) => {
        //@ts-expect-error
        if (e.target?.dataset?.backdrop) {
          dismiss();
        }
      }}
      className="animate-all-fast blur-bg"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: visible ? 1 : 0,
        transform: `translate3D(0, ${visible ? 0 : "32px"}, 0)`,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          maxWidth: containerMaxWidth,
          margin: "0 auto",
          padding: isSuperTinyMobileScreen(window.innerHeight) ? 8 : 16,
        }}
      >
        <div
          style={{
            background: colors.modalBg,
            borderRadius,
            padding: isSuperTinyMobileScreen(window.innerHeight) ? 16 : 32,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            boxShadow: "0px 8px 16px " + colors.black + "88",
            maxWidth: 256 + 128 + 32,
            margin: "0 auto",
          }}
        >
          <button
            aria-label="dismiss"
            onClick={() => {
              dismiss();
            }}
            style={{
              background: "transparent",
              border: 0,
              position: "absolute",
              top: -8,
              right: -8,
              color: colors.black,
              padding: 16,
              borderRadius: 9999,
              cursor: "pointer",
            }}
          >
            <XIcon size={24} />
          </button>

          {children}
        </div>
      </div>
    </div>
  </div>
));
