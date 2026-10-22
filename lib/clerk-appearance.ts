import { shadcn } from "@clerk/ui/themes";

// Global Clerk appearance: the shadcn theme reads our shadcn variables; the element classes
// mirror components/ui/button.tsx and input.tsx so Clerk controls match our own (tokens only).
export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: shadcn.cssLayerName,
  variables: {
    fontFamily: "var(--font-inter)",
    fontFamilyMono: "var(--font-jetbrains-mono)",
    // Clerk derives its largest radius as 2x this base, so half of --radius caps it at 6px.
    borderRadius: "calc(var(--radius) / 2)",
  },
  elements: {
    cardBox: "border-border",
    dividerLine: "bg-border",
    formButtonPrimary:
      "rounded-md shadow-none hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50",
    socialButtonsBlockButton:
      "rounded-md border border-input shadow-none hover:bg-subtle focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    socialButtonsBlockButtonText: "text-foreground",
    formFieldInput:
      "rounded-sm border border-input shadow-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  },
};

// Sign-in / sign-up card sits on the page (not floating), so it gets no shadow (ui-context.md).
export const authCardAppearance = {
  elements: {
    cardBox: "shadow-none!",
    card: "shadow-none",
  },
};
