import { CheckCircleFillIcon, RocketIcon, XIcon } from "@primer/octicons-react";
import { memo, useEffect, useState } from "react";
import { verifyLicense } from "./api";
import { Button } from "./Button";
import { borderRadius, colors, containerMaxWidth } from "./colors";

export const PaymentModal: React.FC<{
  visible: boolean;
  dismiss: () => void;
  onSuccess: () => void;
}> = memo(({ visible, dismiss, onSuccess }) => {
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<
    boolean | "unlocked-from-code"
  >(false);
  useEffect(() => {
    const messageHandler = (e: any) => {
      if (!e.isTrusted) {
        return;
      }
      if (e.origin !== "https://app.gumroad.com") {
        return;
      }
      const data = JSON.parse(e.data);
      if (
        data.post_message_name === "sale" &&
        data.success === true &&
        data.name === "Premium"
      ) {
        //@ts-expect-error
        window.GumroadOverlay?.iframe?.remove();
        onSuccess();
        setShowPaymentSuccess(false);
        localStorage.setItem("fiveletters.xyz:license_key", data.license_key);
      }
    };
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: visible ? "all" : "none",
        overflow: "hidden",
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
        }}
      >
        <div
          style={{
            maxWidth: containerMaxWidth,
            margin: "0 auto",
            padding: 16,
          }}
        >
          <div
            style={{
              background: colors.light,
              borderRadius,
              padding: 32,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              boxShadow: "0px 8px 16px " + colors.black + "88",
              maxWidth: 256 + 128 + 32,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {showPaymentSuccess ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: 16,
                  }}
                >
                  <RocketIcon size={64} />
                  <div
                    style={{
                      marginTop: 32,
                      marginBottom: 32,
                      fontWeight: "bold",
                    }}
                  >
                    Premium unlocked!
                  </div>
                  <div
                    style={{
                      alignSelf: "flex-start",
                    }}
                  >
                    {showPaymentSuccess !== "unlocked-from-code" &&
                      "A receipt has been sent to your email. "}
                    Thank you for supporting Five&nbsp;Letters!
                  </div>

                  <Button
                    onClick={() => {
                      dismiss();
                    }}
                    style={{ marginTop: 32 }}
                  >
                    Resume game
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: 16,
                      marginLeft: 38,
                      paddingRight: 32,
                    }}
                  >
                    Five Letters Premium
                  </div>
                  <button
                    onClick={() => {
                      dismiss();
                    }}
                    style={{
                      background: "transparent",
                      border: 0,
                      position: "absolute",
                      top: -8,
                      right: -8,
                      color: colors.dark,
                      padding: 16,
                      borderRadius: 9999,
                      cursor: "pointer",
                    }}
                  >
                    <XIcon size={24} />
                  </button>

                  <div
                    style={{
                      marginLeft: 20,
                      marginBottom: 16,
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        color: colors.darkContrastText,
                        marginBottom: 16,
                        marginRight: 4,
                      }}
                    >
                      $
                    </span>
                    <span style={{ fontSize: 40, fontWeight: "bold" }}>3</span>
                    <span
                      style={{
                        marginLeft: 4,
                        color: colors.darkContrastText,
                        marginBottom: 6,
                      }}
                    >
                      / mo
                    </span>
                  </div>
                  {[
                    {
                      text: "Hints & solutions",
                      sub: "Get extra hints or see the solution if you get stuck.",
                    },
                    {
                      text: "Statistics & breakdowns",
                      sub: "Detailed analysis of your own games. (Coming soon!)",
                    },
                    { text: "No ads", sub: "Just like the free version!" },
                    {
                      text: "Cancel any time",
                      sub: "",
                    },
                  ].map((item) => (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ color: colors.dark }}>
                        <CheckCircleFillIcon size={24} />
                      </div>
                      <div
                        style={{
                          marginLeft: 16,
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        {item.text}
                        <div
                          style={{
                            color: colors.darkContrastText,
                            fontSize: 16,
                          }}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    href="https://fiveletters.gumroad.com/l/yjxbev?wanted=true"
                    data-gumroad-single-product="true"
                  >
                    Get Premium
                  </Button>
                  <div style={{ fontSize: 16 }}>
                    <button
                      onClick={() => {
                        const license_key =
                          prompt(
                            "Paste the license key from your subscription email here:"
                          ) || "";
                        if (license_key) {
                          verifyLicense(license_key, true).then((value) => {
                            if (value) {
                              onSuccess();
                              setShowPaymentSuccess("unlocked-from-code");
                              localStorage.setItem(
                                "fiveletters.xyz:license_key",
                                license_key
                              );
                            } else {
                              alert("Invalid license key.");
                            }
                          });
                        }
                      }}
                      style={{
                        cursor: "pointer",
                        border: 0,
                        textDecoration: "underline",
                        outline: 0,
                        display: "block",
                        margin: "16px auto 0",
                        background: "transparent",
                        fontSize: 16,
                        color: colors.black,
                      }}
                    >
                      ...or redeem an existing code
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
