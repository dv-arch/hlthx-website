# HLTHX concept v2 (client review)

Static design concept for client approval, deployed to https://hlthx-website.vercel.app. Not the live store:
the Shopify theme at the repo root is unchanged.

- `/` home: typed hero "Replace your [calcium tablets] with one daily drink.", pack stat tiles, ingredient
  marquee, eight foundations, highlights, ritual, pre-book (links to the live Shopify pre-book page).
- `/option-a` golden silk background, `/option-b` turmeric swirl background (the switcher at the bottom also flips them).
- `/whole-body-nutrition` hub and `/bones-and-teeth` foundation page, from the client's
  "Whole Body Nutrition" PDF. Quantities and the research citation are marked as pending confirmation.

Backgrounds are drawn in code (`assets/bg.js`), no video files; they pause off screen and show a still frame
for visitors who prefer reduced motion. Once approved, the chosen option is ported into the Shopify theme.
