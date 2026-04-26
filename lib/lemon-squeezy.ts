type LemonVariant = {
  id: string;
};

type LemonVariantsResponse = {
  data?: LemonVariant[];
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getLemonAuthHeaders() {
  return {
    Authorization: `Bearer ${requiredEnv("LEMON_SQUEEZY_API_KEY")}`,
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  };
}

export function getAppBaseUrl() {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}

async function getFirstStoreVariantId() {
  const storeId = requiredEnv("LEMON_SQUEEZY_STORE_ID");
  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/variants?filter[store_id]=${storeId}&page[size]=1`,
    {
      headers: getLemonAuthHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Lemon Squeezy variants lookup failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as LemonVariantsResponse;
  const variantId = payload.data?.[0]?.id;

  if (!variantId) {
    throw new Error("No Lemon Squeezy variant found for this store.");
  }

  return variantId;
}

export async function createLemonCheckoutUrl(input: {
  userId: string;
  userEmail: string | null;
}) {
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID ?? (await getFirstStoreVariantId());
  const appBaseUrl = getAppBaseUrl();

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: getLemonAuthHeaders(),
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.userEmail ?? undefined,
            custom: {
              creatoros_user_id: input.userId,
            },
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          product_options: {
            redirect_url: `${appBaseUrl}/dashboard`,
            receipt_button_text: "Open Creator OS",
            receipt_link_url: `${appBaseUrl}/dashboard`,
          },
        },
        relationships: {
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Lemon checkout creation failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const checkoutUrl = payload.data?.attributes?.url;
  if (!checkoutUrl) {
    throw new Error("Lemon checkout URL was not returned.");
  }

  return checkoutUrl;
}
