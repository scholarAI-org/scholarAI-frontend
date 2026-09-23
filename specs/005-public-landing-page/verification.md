# Verification

Automated source-level coverage verifies the public route composition, absence of guards/admin review usage, branding and asset cleanup, disabled search/contact behavior, FAQ IDs, and AR/EN availability messages.

Manual browser checks remain open: RTL/LTR visual comparison, 1440px Figma comparison, tablet/mobile layouts, keyboard navigation, mobile menu, FAQ interaction, and locale switching.

`pnpm build` is blocked externally when `next/font` cannot fetch Almarai from Google Fonts. This feature does not alter font configuration.
