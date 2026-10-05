# Public PsScholar Landing Page

## Scope

The public locale home route (`/[locale]`) presents PsScholar to unauthenticated Arabic and English visitors. It has no role guard and does not redirect a signed-in visitor.

Figma reference: root node `2002:2660`.

## Sections

Implemented: header, hero, Why PsScholar, platform features, how it works, FAQ, final CTA, disabled contact form, and footer. Header navigation targets stable in-page anchors.

Intentionally omitted: Featured Scholarships, AI Recommendations, and Document Enhancement. These need public data/product contracts that are not present in the repository.

## Data decisions

The Figma counts, match percentages, acceptance notification, and student/university totals are illustrative-only. They are deliberately not shipped as factual claims and no API request is created for them. Featured cards must be backed by an authoritative public scholarships source before they can be rendered.

## Intentional differences

The Figma theme/sun control is omitted because this app has no theme system. Decorative visual cards use CSS rather than an expiring Figma asset URL. No stale `accio` brand copy is used by landing components.

There is no verified public browse/search contract, so Featured Scholarships is intentionally omitted and the hero search is rendered disabled with an availability notice. Quick-filter chips are non-interactive visual context. There is also no contact endpoint, so the contact form is visibly unavailable and never presents a success result. Footer social links and unverified product destinations are omitted rather than linked to placeholders.

The current product has no public AI recommendation or AI document-enhancement route, so those dedicated Figma sections are omitted. The remaining capability copy is limited to the existing profile and document-management workflow.
