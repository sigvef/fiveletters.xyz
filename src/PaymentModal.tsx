import { CheckCircleFillIcon, RocketIcon, XIcon } from "@primer/octicons-react";
import { memo, useEffect, useState } from "react";
import { verifyLicense } from "./api";
import { Button } from "./Button";
import { borderRadius, colors, containerMaxWidth } from "./colors";
import { Modal } from "./Modal";
import { isSuperTinyMobileScreen } from "./utils";

const translationsMap = {
  no: {
    getPremiumButtonText: "Aktiver",
    year: "år",
    invalidLicenseKey: "Ugyldig lisensenøkkel.",
    pasteTheLicenseKey:
      "Lim in linsensnøkkelen fra kvitteringen du fikk på epost:",
    orRedeem: "...eller bruk en eksisterende kode",
    premiumUnlocked: "Du har nå Premium!",
    aReceiptHasBeenSentToYourEmail:
      "Kvittering har blitt sendt til din epost-adresse. ",
    thankYouForSupportingFiveLetters: "Takk for din støtte!",
    resumeGame: "Tilbake til spillet",
    sellingPoints: [
      {
        text: "Ingen ny funksjonalitet",
        sub: "Alt som ville ha vært i en premium-version er allerede gratis\xA0tilgjenglig!",
      },
      {
        text: "Støtt videre utvikling",
        sub: "Med Five Letters Premium bidrar du til å støtte videre utvikling av ny funksjonalitet til spillet. For eksempel finnes spillet nå på norsk takket være støtten! :)",
      },
    ],
  },
  en: {
    getPremiumButtonText: "Get Premium",
    year: "year",
    invalidLicenseKey: "Invalid license key.",
    pasteTheLicenseKey:
      "Paste the license key from your subscription email here:",
    orRedeem: "...or redeem an existing code",
    premiumUnlocked: "Premium unlocked!",
    aReceiptHasBeenSentToYourEmail: "A receipt has been sent to your email. ",
    thankYouForSupportingFiveLetters:
      "Thank you for supporting Five&nbsp;Letters!",
    resumeGame: "Resume game",
    sellingPoints: [
      {
        text: "No extra features",
        sub: "All features that would have been in the premium version are already available for\xA0free!",
      },
      {
        text: "Support development",
        sub: "If you like Five Letters, please consider splurging on Five Letters Premium. It helps support the continued development of new features :)",
      },
    ],
  },
};

export const PaymentModal: React.FC<{
  visible: boolean;
  dismiss: () => void;
  onSuccess: () => void;
  language: "no" | "en";
}> = memo(({ visible, dismiss, onSuccess, language }) => {
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<
    boolean | "unlocked-from-code"
  >(false);
  const translations = translationsMap[language];
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
        data.name === "Five Letters Premium"
      ) {
        //@ts-expect-error
        window.GumroadOverlay?.iframe?.remove();
        [...document.querySelectorAll(".gumroad-loading-indicator")].forEach(
          (x) => x.remove()
        );
        [...document.querySelectorAll(".gumroad-scroll-container")].forEach(
          (x) => x.remove()
        );
        onSuccess();
        setShowPaymentSuccess(true);
        localStorage.setItem("fiveletters.xyz:license_key", data.license_key);
      }
    };
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);
  return (
    <Modal visible={visible} dismiss={dismiss}>
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
              {translations.premiumUnlocked}
            </div>
            <div
              style={{
                alignSelf: "flex-start",
              }}
            >
              {showPaymentSuccess !== "unlocked-from-code" &&
                translations.aReceiptHasBeenSentToYourEmail}
              {translations.thankYouForSupportingFiveLetters}
            </div>

            <Button
              onClick={() => {
                dismiss();
              }}
              style={{ marginTop: 32 }}
            >
              {translations.resumeGame}
            </Button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 16,
                paddingRight: 16,
              }}
            >
              Five Letters Premium
            </div>
            <div
              style={{
                marginBottom: 16,
                alignItems: "flex-end",
                textAlign: "center",
                padding: 8,
                background: "#ffffff22",
                marginLeft: isSuperTinyMobileScreen(window.innerHeight)
                  ? -16
                  : -32,
                marginRight: isSuperTinyMobileScreen(window.innerHeight)
                  ? -16
                  : -32,
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
              <span
                style={{
                  fontSize: 40,
                  fontWeight: "bold",
                  color: colors.extraBlack,
                }}
              >
                5
              </span>
              <span
                style={{
                  marginLeft: 4,
                  marginBottom: 6,
                  color: colors.darkContrastText,
                }}
              >
                / {translations.year}
              </span>
            </div>
            {translations.sellingPoints.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <div style={{ color: colors.darkContrastText }}>
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
              {translations.getPremiumButtonText}
            </Button>
            <div style={{ fontSize: 16 }}>
              <button
                onClick={() => {
                  const license_key =
                    prompt(translations.pasteTheLicenseKey) || "";
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
                        alert(translations.invalidLicenseKey);
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
                {translations.orRedeem}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
});
