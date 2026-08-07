# CX Suite - concept mockup

An interactive product mockup of Ema's self-serve customer support suite, grounded in US auto insurance. A CX lead signs up, answers two onboarding questions, and configures an AI support assistant: channels, sections with rules and SOP-driven coverage, connections, safety tests, and a contract-gated go-live.

Everything is a static mock: no backend, no real data, synthetic policyholders only.

## View it

Open `index.html` in a browser, or use the GitHub Pages link if enabled for this repo.

Icons load from the Phosphor CDN, so the first open needs an internet connection.

## Demo controls

A pill bar sits at the top right once you are past the landing page.

- **Landing / Onboarding / Setup / Sandbox / Workspace / Plans** jump between surfaces.
- **Load worked example** fills the workspace with a configured state: SOPs parsed, sections owned, a document-change rerun pending. **Back to day 0** resets to the empty first-run state.
- **View as r.patel** switches to the scoped view a section expert sees: one section, nothing else.

## Structure

| File | Holds |
|---|---|
| `index.html` | All markup: landing, onboarding, shell, wizard, views |
| `styles.css` | Design tokens and components (Ema design system) |
| `app.js` | All state, data and rendering. Section data lives in `CATS`, documents in `DOCS`, test suites in `SUITES`. Wizard steps are `S[0]`..`S[6]`. |
| `fonts/` | Satoshi (4 weights) |

## Contributing

Branch or fork, make the change, open a pull request. Keep copy plain and short: card subtitles one line, toasts under eight words, and no control that does nothing - every element must change, test, or record something.
