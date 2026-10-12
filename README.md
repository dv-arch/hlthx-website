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
Online Store → Pages → Add page "Pre-book" and pick the template `page.prebook`. Visitors leave name, phone and
email; each becomes a Shopify customer tagged `prebook`, `prebook-store` and `phone:+91…`, subscribed to email
marketing. Find them under Customers, filtered by tag `prebook`.

## Theme settings to fill in before launch
- Theme settings → Store policies: guarantee days, subscription terms, delivery summary.
- Theme settings → Brand: tagline, footer disclaimer, and turn off the "To confirm" markers.
- Home page sections: rating and reviews, experts, supplement facts, ingredient lists per category, announcement bar.

## Fonts
The wordmark and tagline use Montserrat (Google Fonts) as the closest free match to the client's artwork.
When the client sends the exact font, add it to `assets/` and change `--display` in `assets/hlthx.css`.

## `web/`
Static design preview that was hosted on Vercel before the move to Shopify. Shopify ignores it; it is kept only
as a reference.
