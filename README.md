# Vedajanani Vastralayam — Shopify Custom Theme (Editorial)

Shopify-approved custom theme (Dawn-based, no custom code required). Editorial homepage inspired by Prada (minimal luxury) × Ralph Lauren (heritage lifestyle).

## Header (as requested)
- **Menu in header section:** Desktop = always-visible one-click menubar: `Shop All ▾ | Weddings | Women | Men | About | Journal`
- **Shop All dropdown (hover + click):** By Fabric (Cotton / Chiffon / Georgette / Silk) · By Occasion (Festive / Daily Use / Office / Wedding) · By Price (₹500–₹1,500 / ₹1,500–₹3,000 / ₹3,000–₹5,000)
- **Right corner:** Search (⌕) | Account (◯ → /account/login) | Bag (🛍 → cart drawer with count, Add to Cart)
- **Mobile:** Hamburger drawer (different from desktop) with Shop All accordion + same links

## Collections to create in Shopify Admin
- Cotton, Silk, Chiffon, Georgette (+ sub-collections per README in docs/)
- Automatic: Affordable / Mid Range / Premium by price
- Tags: Daily Use, Office, Festive, Wedding, Pooja
- Manual: New Arrivals, Best Sellers, Founder's Picks, Brides, Bridesmaids, Festive Edit
- Blog: Journal (create blog handle `journal`)
- Pages: About, Contact

## Connect to GitHub (this repo is git-initialised & committed)
1. github.com → New repository → `vedajanani-shopify-theme` → Public → Create
2. Run in this folder:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/vedajanani-shopify-theme.git
   git branch -M main
   git push -u origin main
   ```
   Fallback: upload `vedajanani-shopify-theme.zip` via GitHub web (Add file → Upload files).

## Connect GitHub to Shopify
1. Shopify Admin → Online Store → Themes → ⋯ → Add theme → Connect from GitHub
2. Authorise Shopify GitHub app → select `vedajanani-shopify-theme` → Publish

## Apps
Search & Discovery (filters), Judge.me (reviews), Klaviyo (email), Shiprocket (shipping)

## Design
Ivory #F9F6F1 · Maroon #5C1A24 · Gold #B9975B · Charcoal #1C1C1C · Radius 20px · Playfair Display + Cormorant Garamond + Jost
