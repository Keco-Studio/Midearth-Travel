# Homepage Nav Refresh Design

## Goal

Refresh the Midearth Travel homepage hero, navigation labels, section headings, and mobile layout according to the requested copy and responsive behavior.

## Scope

- Update the hero title hierarchy so `Your One-Stop` is the larger, more prominent title and `Travel Solution` is the smaller subtitle.
- Update the four hero service cards to transparent cards with `1px` borders, gradient selected states, and this visible title order: `Flight Booking`, `Bus Tours`, `Worldwide Travel`, `Other Services`.
- Change the desktop/mobile navigation label from `Routes` to `Destinations` and route that click to the homepage destinations section (`/#destinations`) instead of region route pages.
- Rename homepage sections:
  - `Popular Tours` to `Our Top Picks`
  - `Where do you want to go?` to title `Where to Go` and subtitle `Explore Destinations`
  - `Explore by Month` to title `When to Go` and subtitle `Explore by Month`
  - `Everything else, handled.` to title `Travel Service` and subtitle `Everything else, handled.`
- Improve mobile layout so the four hero cards are visible in the first screen, the header can wrap instead of hiding main navigation, and monthly destination card text remains fully visible.

## Architecture

Keep the implementation inside the existing App Router components and CSS modules. No new dependencies or routing structure are needed. The old destination mega menu data can remain in the codebase, but the active nav link should target the homepage destinations section.

## Verification

Add a lightweight static verification script for the requested copy and CSS hooks, then run it before and after implementation to follow a red/green workflow. Also run the project lint and build commands after code changes.
