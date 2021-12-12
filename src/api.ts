export const verifyLicense = (key: string, increase_count?: boolean) =>
  fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_permalink: "yjxbev",
      license_key: key,
      increment_uses_count: !!increase_count,
    }),
  })
    .then((response) => response.json())
    .then((data) => !!data.success);
