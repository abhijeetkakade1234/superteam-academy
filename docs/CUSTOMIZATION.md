# Superteam Academy — Customization Guide

This guide covers how to customize the platform, add new languages, and extend the gamification system.

## Theme Customization

Superteam Academy uses **Tailwind CSS** with a dark-first aesthetic. Global styles and variables are located in `app/src/app/globals.css`.

### Adjusting Brand Colors

Modify the `:root` and `.dark` variables in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  /* Modify these to change primary gradients */
  --brand-purple: 270 70% 60%;
  --brand-green: 150 70% 50%;
}
```

### Changing Typography

The platform uses the **Inter** font via `next/font/google`. To change it, update `app/src/app/layout.tsx`.

---

## Adding New Languages (i18n)

The platform uses `react-i18next` for translations.

1.  **Add Translation File**: Create a new directory in `app/public/locales/` (e.g., `fr/common.json`).
2.  **Translate Content**: Follow the structure of `en/common.json`.
3.  **Register Language**: Update the `i18n` configuration in `app/src/components/I18nProvider.tsx` to include the new locale.
4.  **Update Navigation**: Ensure the language switcher in the `Settings` page reflects the new option.

---

## Extending Gamification

### Adding New Achievements

1.  **Define in CMS**: Create a new `achievement` document in Sanity.
2.  **Frontend Update**: If the achievement requires a unique icon or local fallback, update `app/src/app/achievements/page.tsx`.
3.  **Logic Integration**: Register the achievement logic in `app/src/hooks/useGamification.ts` if it requires automatic triggering based on user actions.

### Modifying XP Values

XP values for lessons and courses are managed primarily via the CMS. To change the "Global XP Multiplier" or "Daily Cap", update the on-chain configuration via the Admin Dashboard or direct program instruction `update_config`.

---

## Service Interfaces

### Wallet Integration

Uses `@solana/wallet-adapter-react`. Configuration found in `app/src/components/WalletContextProvider.tsx`.

### Analytics

- **GA4**: Configured in `app/src/app/layout.tsx` via `NEXT_PUBLIC_GA_ID`.
- **Clarity**: Configured in `app/src/app/layout.tsx` via `NEXT_PUBLIC_CLARITY_ID`.
- **Sentry**: Configuration files in the root of `app/` directory.
