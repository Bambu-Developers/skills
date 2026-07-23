# Stack annex — native Android (Bambú conventions)

Conventions proven in TrenMaya_AppTpv (Verifone X990 POS): base for the `AGENTS.md` of
native Android projects; adjust SDK levels and the XML-vs-Compose choice to the hardware
and the project (the POS uses XML due to modest hardware — on modern hardware Compose is
valid: decide it and document it).

## Base stack

- Kotlin, MVVM, single-activity + Fragments + Navigation Component (or Compose Navigation).
- UI: Material Design 3 with a central theme; always Material components — no raw widgets
  when an equivalent exists. Loading states with ONE global loader pattern, never
  per-screen inline loaders.
- Network: Retrofit2 + OkHttp3 + Moshi (codegen). Interceptors for cross-cutting headers
  (Bearer auth, sales channel). **Network profilers/logging in debug only, never in
  release (enforced by build config).**
- Coroutines + Flow; Hilt (DI); DataStore for device config.
- Each feature: `XxxFragment` + `XxxViewModel` + immutable UI state (`data class` +
  `StateFlow`).
- Hardware/third-party integrations (printer, payment, scanner) always behind `domain/`
  interfaces with Hilt-swappable implementations — enables development on the emulator
  without the physical hardware.
- **Money: `BigDecimal` or integer cents — never `Double`.**
- Code/identifiers/comments in English; UI copy in Spanish in `strings.xml`, never
  hardcoded.

## Canonical structure

```
app/src/main/java/com/<org>/<app>/
  core/config/      # device/terminal config via DataStore
  core/network/     # Retrofit/OkHttp modules, interceptors, error handling
  core/ui/          # theme and base components
  data/             # DTOs, Retrofit services, repositories
  domain/           # models + interfaces (hardware/payment contracts)
  features/<feature>/
docs/api/openapi.json   # spec snapshot, with the curl command to regenerate it
docs/API.md             # curated summary of the endpoints the app uses
```

## Build and verification

```bash
./gradlew assembleDebug   # compile
./gradlew test            # unit tests
./gradlew lint            # static analysis
./gradlew build           # everything
```

Always the wrapper `./gradlew` (never global Gradle). `local.properties` unversioned.
Green build = build + test + lint.

## Stack-specific security

- Tokens in Keystore/EncryptedSharedPreferences — not plain SharedPreferences.
- R8/ProGuard active in release; `debuggable=false`; no cleartext traffic.
- Minimal manifest permissions; review what each dependency adds to the final manifest
  (inspect the compiled APK — don't trust the docs).
