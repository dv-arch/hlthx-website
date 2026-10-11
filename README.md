# HLTHX Shopify theme

Custom Shopify (Online Store 2.0) theme for HLTHX™ Daily Complete Nutrition.

## Setup
1. Shopify admin → Online Store → Themes → Add theme → Connect from GitHub → pick this repo, branch `main`.
2. Customize the theme: in the **Purchase** section, pick the HLTHX product.
3. Theme settings → Colours sets the palette. Theme settings → Brand → turn off the "To confirm" markers before launch.
4. Subscriptions: install the free Shopify Subscriptions app and add a plan to the product; the buy box shows it automatically.

## Product data
`tools/template_to_shopify_csv.py` turns the client's product data template (.xlsx) into a Shopify product import CSV
(Products → Import). Products import as Draft.

```
python3 tools/template_to_shopify_csv.py Solara-HLTHX-Product-Data-Template.xlsx products.csv --brand HLTHX
```

## Pre-booking page
Visitors leave name, phone and email; each one becomes a Shopify customer tagged `prebook`
(find them under Customers, filter by tag).

- **On Vercel (now):** `web/prebook.html` at `/prebook`. The form posts to `web/api/prebook.js`, which creates the
  customer through the Shopify Admin API. It needs two Vercel environment variables:
  `SHOPIFY_STORE_DOMAIN` (e.g. `hlthx.myshopify.com`) and `SHOPIFY_ADMIN_ACCESS_TOKEN` (Shopify admin → Settings →
  Apps → Develop apps → create an app with `read_customers` + `write_customers`). Until both are set the page tells
  visitors their details were not saved; it never shows a false success.
- **On the Shopify store:** Online Store → Pages → Add page "Pre-book", template `page.prebook`. It uses Shopify's
  native customer form (`sections/prebook.liquid`), tags `prebook`, `prebook-store` and `phone:+91…`, and subscribes
  the email to marketing.
