"""Convert the Solara/HLTHX product data template (.xlsx, 'Products' tab) into a Shopify product import CSV.

Usage: python3 template_to_shopify_csv.py <template.xlsx> <out.csv> [--brand HLTHX]
Rows are grouped into one Shopify product per Parent Product ID; each row is a variant.
Products are imported as Draft so nothing goes live until someone publishes them.
"""
import csv, html, re, sys
import openpyxl

COLS = ["Handle","Title","Body (HTML)","Vendor","Type","Tags","Published","Option1 Name","Option1 Value",
        "Variant SKU","Variant Grams","Variant Inventory Tracker","Variant Inventory Qty","Variant Inventory Policy",
        "Variant Fulfillment Service","Variant Price","Variant Compare At Price","Variant Requires Shipping",
        "Variant Taxable","Variant Barcode","Image Src","Image Position","SEO Title","SEO Description","Cost per item","Status"]

def s(v): return "" if v is None else str(v).strip()
def slug(t): return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
def num(v):
    m = re.search(r"[\d.]+", s(v).replace(",", ""))
    return m.group(0) if m else ""

def body(r):
    parts = []
    if r["Full Description"] or r["Short Description"]:
        parts.append(f"<p>{html.escape(r['Full Description'] or r['Short Description'])}</p>")
    benefits = [r[f"Key Benefit {i}"] for i in range(1, 6) if r.get(f"Key Benefit {i}")]
    if benefits: parts.append("<h3>Key benefits</h3><ul>" + "".join(f"<li>{html.escape(b)}</li>" for b in benefits) + "</ul>")
    for label, key in [("Serving size","Serving Size"),("Active ingredients","Active Ingredients (amount, %DV)"),
                       ("Other ingredients","Other Ingredients"),("Allergens","Allergens"),("Directions","Directions"),
                       ("Best time to take","Best Time to Take"),("Who it's for","Who It's For"),("Warnings","Warnings"),
                       ("Storage","Storage"),("Certifications","Certifications")]:
        if r.get(key): parts.append(f"<p><strong>{label}:</strong> {html.escape(r[key])}</p>")
    return "".join(parts)

def main(src, out, brand=None):
    ws = openpyxl.load_workbook(src, data_only=True)["Products"]
    rows = list(ws.iter_rows(values_only=True))
    header = [s(h) for h in rows[2]]          # row 1 = group, row 2 = required/optional, row 3 = column names
    seen, out_rows = {}, []
    for raw in rows[3:]:
        r = {h: s(v) for h, v in zip(header, raw)}
        if not r.get("Product Name") or not r.get("SKU"): continue
        if brand and brand.lower() not in r["Brand"].lower(): continue
        if r["SKU"] == "SOL-MAG-120": continue  # template example row
        handle = slug(r["Parent Product ID"] or r["Product Name"])
        first = handle not in seen
        seen.setdefault(handle, 0); seen[handle] += 1
        variant = " / ".join(x for x in [r["Variant: Size / Count"], r["Variant: Flavour"]] if x and x.lower() != "unflavoured") or "Default Title"
        tags = ", ".join(x for x in [r["Category"], r["Goal Tags"], r["Badge"]] if x)
        out_rows.append({
            "Handle": handle,
            "Title": r["Product Name"] if first else "",
            "Body (HTML)": body(r) if first else "",
            "Vendor": r["Brand"] if first else "",
            "Type": r["Category"] if first else "",
            "Tags": tags if first else "",
            "Published": "FALSE" if first else "",
            "Option1 Name": ("Size" if variant != "Default Title" else "Title") if first else "",
            "Option1 Value": variant,
            "Variant SKU": r["SKU"], "Variant Grams": num(r["Shipping Weight (g)"]) or num(r["Net Weight (g)"]),
            "Variant Inventory Tracker": "shopify", "Variant Inventory Qty": num(r["Opening Stock Qty"]) or "0",
            "Variant Inventory Policy": "deny", "Variant Fulfillment Service": "manual",
            "Variant Price": num(r["Selling Price"]) or "0", "Variant Compare At Price": num(r["Compare-at Price"]),
            "Variant Requires Shipping": "TRUE", "Variant Taxable": "TRUE", "Variant Barcode": r["Barcode (UPC/EAN)"],
            "Image Src": "", "Image Position": "",
            "SEO Title": r["SEO Title"] if first else "", "SEO Description": r["Meta Description"] if first else "",
            "Cost per item": num(r["Cost Price (private)"]), "Status": "draft" if first else "",
        })
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS); w.writeheader(); w.writerows(out_rows)
    print(f"{len(seen)} products, {len(out_rows)} variants -> {out}")

if __name__ == "__main__":
    a = sys.argv[1:]
    brand = a[a.index("--brand")+1] if "--brand" in a else None
    main(a[0], a[1], brand)
