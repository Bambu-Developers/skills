# Stack annex — Flutter (Bambú conventions)

Conventions proven in TrenMaya_App: use them as the base for the `AGENTS.md` of new
Flutter projects, adjusting versions to the ones current when the project is created.

## Base stack

| Concern | Library |
|---|---|
| UI components | forui (the only component library — no Material/Cupertino in app UI) |
| Shared state | hooks_riverpod + riverpod_annotation |
| Local state | flutter_hooks |
| Routing | auto_route |
| HTTP | dio (always via `dioProvider`, never instantiated directly) |
| Models | freezed + json_serializable |
| Forms | formz (typed value objects in `lib/shared/forms/`, one per file) |
| Localization | flutter_localizations + intl (`context.l10n`, zero hardcoded strings) |

- **Runtime via fvm**: pin in a **committed** `.fvmrc`; every command prefixed with `fvm`
  (`fvm flutter pub get`, `fvm flutter analyze`, `fvm flutter test`,
  `fvm dart run build_runner build --delete-conflicting-outputs`, `fvm flutter gen-l10n`).
- **iOS: Swift Package Manager ONLY** — before adding any plugin with an iOS native side,
  verify SPM support; if no SPM alternative exists, raise it with the user before adding
  it. Never reintroduce CocoaPods silently.
- App root: `WidgetsApp.router` (not `MaterialApp.router`); screens with `FScaffold`.
- `import "package:flutter/material.dart"` only with `show` for the unavoidable
  (`ThemeExtension`, `InputBorder`).

## Canonical structure

```
lib/
  main.dart
  router/            # auto_route; screens add @RoutePage + route + build_runner
  theme/             # AppTheme + styles/ (global forui overrides via CLI)
  extensions/        # context.l10n shorthand
  shared/            # used by ≥2 features: components/ models/ forms/ hooks/
    network/         # dioProvider
    config/          # Environment (dart-define ENVIRONMENT) + per-env AppConfig
  features/<domain>/ # components/ models/ data/ providers/ — one business domain
  screens/           # @RoutePage() — thin composition ONLY, no components of their own
  l10n/              # app_es.arb (+ languages)
docs/plans/          # multi-session plans
integration_test/    # full flow + live validation against the real backend
test/
```

Key architecture rules:

- **`screens/` holds screens only** (thin composition); domain components live in
  `features/<domain>/`; domain-free chrome (nav, top bar) in `shared/components/`.
- **Promotion rule**: code is born colocated in its feature; at the second consumer it is
  promoted to `shared/`.
- **Barrel files mandatory** in every folder; import the barrel, not loose files.
- **One widget per file**; a component with sub-widgets = a folder with one file per
  widget, only the main one exported.
- Codegen files (`.freezed.dart`, `.g.dart`) live in their own folder.
- forui styles: global override via CLI in `theme/styles/`; a delta used by 2+ call sites
  of a feature = its own named file; **never** an inline `.delta(...)` in `build()`.
- freezed models as `abstract class`.
- State: hooks for local, Riverpod for shared; formz for validation — never ad-hoc
  regex/isEmpty in widgets.

## Quality practices

- Per-environment config via `--dart-define=ENVIRONMENT=` resolved in `AppConfig` — never
  literal URLs at call sites.
- Session in `flutter_secure_storage` (note: the iOS Keychain survives uninstall).
- `integration_test/` with one critical-flow E2E test + a schema-validation harness
  against the live backend (detects API drift).
- Green build = clean `fvm flutter analyze` + the full test suite.
