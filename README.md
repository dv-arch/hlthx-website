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
