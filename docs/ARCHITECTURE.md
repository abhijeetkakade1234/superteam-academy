# Superteam Academy — Architecture Reference

Quick-reference for developers. Full details in [SPEC.md](./SPEC.md).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│                                                                     │
│  Wallet Adapter ─── Anchor Client ─── Helius DAS ─── Photon RPC   │
└────────┬──────────────────┬─────────────────┬──────────────┬────────┘
         │                  │                 │              │
         │ sign txs         │ read accounts   │ leaderboard  │ credentials
         │                  │                 │              │
┌────────▼──────────────────▼─────────────────▼──────────────▼────────┐
│                        BACKEND (API)                                │
│                                                                     │
│  Lesson validation ─── TX builder ─── Photon queries ─── Queue     │
│                                                                     │
│  Holds: backend_signer keypair (rotatable via update_config)       │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ signed transactions
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                    SOLANA (On-Chain Program)                         │
│                                                                     │
│  Config ──┬── Course ──── Enrollment ──── Credential (compressed)  │
│           │                                                         │
│           └── LearnerProfile                                        │
│                                                                     │
│  XP Token (Token-2022: NonTransferable + PermanentDelegate)        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Account Map

### PDA Derivation

| Account        | Seeds                                                   | Owner          | Closeable        |
| -------------- | ------------------------------------------------------- | -------------- | ---------------- |
| Config         | `["config"]`                                            | Program        | No               |
| Course         | `["course", course_id.as_bytes()]`                      | Program        | No               |
| LearnerProfile | `["learner", user.key()]`                               | Program        | No               |
| Enrollment     | `["enrollment", course_id.as_bytes(), user.key()]`      | Program        | Yes              |
| Credential     | `["credential", learner.key(), track_id.to_le_bytes()]` | Light Protocol | N/A (compressed) |

### Account Relationships

```
Config (singleton)
  │
  ├── current_mint ──► XP Token Mint (Token-2022)
  │                       │
  │                       └──► Token Accounts (one per learner per season)
  │
  ├── backend_signer (rotatable keypair)
  │
  └── authority (Squads multisig)

Course (one per course)
  │
  ├── creator ──► receives XP on student completion
  ├── authority ──► can update course
  ├── prerequisite ──► Option<Course PDA>
  │
  └──► Enrollment (one per learner per course)
        │
        ├── lesson_flags (bitmap, up to 256 lessons)
        ├── completed_at (set by finalize_course)
        │
        └──► Credential (ZK compressed, one per learner per track)
              │
              ├── current_level (upgrades on track progression)
              └── metadata_hash ──► Arweave JSON

LearnerProfile (one per learner)
  │
  ├── streak data (current, longest, last_activity, freezes)
  ├── achievement_flags (bitmap, 256 slots)
  ├── rate limiting (xp_earned_today, last_xp_day)
  └── referral tracking (count, has_referrer)
```

---

## Data Flow: Core Learning Loop

```
1. ENROLL
   Learner ──sign──► enroll(course_id)
   ┌─────────────────────────────────────────────┐
   │ Check: course.is_active                      │
   │ Check: prerequisite completed (if set)       │
   │ Create: Enrollment PDA                       │
   │ Snapshot: enrolled_version = course.version  │
   │ Emit: Enrolled event                         │
   └─────────────────────────────────────────────┘

2. COMPLETE LESSONS (repeated per lesson)
   Backend ──sign──► complete_lesson(lesson_index, xp_amount)
   ┌─────────────────────────────────────────────┐
   │ Check: lesson_index < course.lesson_count    │
   │ Check: bit not already set                   │
   │ Check: daily XP cap                          │
   │ Set: lesson_flags bit                        │
   │ Mint: XP to learner (Token-2022 CPI)        │
   │ Update: streak (side effect)                 │
   │ Emit: LessonCompleted event                  │
   └─────────────────────────────────────────────┘

3. FINALIZE COURSE
   Backend ──sign──► finalize_course()
   ┌─────────────────────────────────────────────┐
   │ Check: all bits set (popcount == lesson_count)│
   │ Mint: course.xp_total to learner             │
   │ Mint: completion_reward_xp to creator        │
   │   (gated by min_completions_for_reward)      │
   │ Set: enrollment.completed_at = now           │
   │ Increment: course.total_completions          │
   │ Emit: CourseFinalized event                  │
   └─────────────────────────────────────────────┘

4. ISSUE CREDENTIAL
   Backend ──sign──► issue_credential(proof, ...)
   ┌─────────────────────────────────────────────┐
   │ Check: enrollment.completed_at.is_some()     │
   │ Query: Photon for existing credential        │
   │ If exists: upgrade (Light CPI)               │
   │ If new: create (Light CPI)                   │
   │ Emit: CredentialIssued event                 │
   └─────────────────────────────────────────────┘

5. CLOSE ENROLLMENT (optional, reclaims rent)
   Learner ──sign──► close_enrollment()
   ┌─────────────────────────────────────────────┐
   │ Check: completed_at.is_some()                │
   │ Close: account, return lamports to learner   │
   │ Emit: EnrollmentClosed event                 │
   └─────────────────────────────────────────────┘
```

---

## XP Token Architecture

```
Season 1                    Season 2                    Season 3
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Mint: S1_PUBKEY  │       │ Mint: S2_PUBKEY  │       │ Mint: S3_PUBKEY  │
│ Extensions:      │       │ Extensions:      │       │ Extensions:      │
│  NonTransferable │       │  NonTransferable │       │  NonTransferable │
│  PermanentDelegate       │  PermanentDelegate       │  PermanentDelegate
│  MetadataPointer │       │  MetadataPointer │       │  MetadataPointer │
│  TokenMetadata   │       │  TokenMetadata   │       │  TokenMetadata   │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                           │
    ┌────┴────┐                ┌────┴────┐                ┌────┴────┐
    │ ATA: A  │                │ ATA: A  │                │ ATA: A  │
    │ bal: 500│                │ bal: 800│                │ bal: 0  │
    ├─────────┤                ├─────────┤                ├─────────┤
    │ ATA: B  │                │ ATA: B  │                │ ATA: B  │
    │ bal: 300│                │ bal: 150│                │ bal: 0  │
    └─────────┘                └─────────┘                └─────────┘

    closed                     active                     future

Config.current_mint = S2_PUBKEY
Config.current_season = 2
Config.season_closed = false
```

---

## ZK Compression Flow (Credentials)

```
Backend                         Photon Indexer              Solana
  │                                  │                        │
  │ 1. getCompressedAccount          │                        │
  │    (by derived address)          │                        │
  │─────────────────────────────────►│                        │
  │                                  │                        │
  │ 2. Returns: account data         │                        │
  │    OR: not found                 │                        │
  │◄─────────────────────────────────│                        │
  │                                  │                        │
  │ 3. getValidityProof              │                        │
  │    (for account state)           │                        │
  │─────────────────────────────────►│                        │
  │                                  │                        │
  │ 4. Returns: 128-byte ZK proof    │                        │
  │◄─────────────────────────────────│                        │
  │                                  │                        │
  │ 5. Build TX: issue_credential    │                        │
  │    (proof + account data +       │                        │
  │     remaining_accounts)          │                        │
  │──────────────────────────────────────────────────────────►│
  │                                  │                        │
  │                                  │ 6. Light CPI:          │
  │                                  │    create/update        │
  │                                  │    compressed account   │
  │                                  │◄───────────────────────│
  │                                  │                        │
  │ 7. TX confirmed                  │                        │
  │◄──────────────────────────────────────────────────────────│
```

**Lookup tables to include:** (reduces TX size for ZK Compression accounts)

- Mainnet: `9NYFyEqPkyXUhkerbGHXUXkvb4qpzeEdHuGpgbgpH1NJ`
- Devnet: `qAJZMgnQJ8G6vA3WRcjD9Jan1wtKkaCFWLWskxJrR5V`

---

## Instruction → Account Matrix

Which accounts each instruction reads/writes:

| Instruction         | Config | Course         | Learner        | Enrollment     | Credential | XP Mint        | Token Accts               |
| ------------------- | ------ | -------------- | -------------- | -------------- | ---------- | -------------- | ------------------------- |
| initialize          | **W**  |                |                |                |            |                |                           |
| create_season       | **W**  |                |                |                |            | **W** (create) |                           |
| close_season        | **W**  |                |                |                |            |                |                           |
| update_config       | **W**  |                |                |                |            |                |                           |
| create_course       | R      | **W** (create) |                |                |            |                |                           |
| update_course       |        | **W**          |                |                |            |                |                           |
| init_learner        |        |                | **W** (create) |                |            |                |                           |
| enroll              |        | R              |                | **W** (create) |            |                |                           |
| unenroll            |        |                |                | **W** (close)  |            |                |                           |
| complete_lesson     | R      | R              | **W**          | **W**          |            | R              | **W** (learner)           |
| finalize_course     | R      | **W**          | **W**          | **W**          |            | R              | **W** (learner + creator) |
| issue_credential    | R      | R              |                | R              | **W**      |                |                           |
| claim_achievement   | R      |                | **W**          |                |            | R              | **W** (learner)           |
| award_streak_freeze | R      |                | **W**          |                |            |                |                           |
| register_referral   |        |                | **W** (both)   |                |            |                |                           |
| close_enrollment    |        |                |                | **W** (close)  |            |                |                           |

R = read, **W** = write, (create) = init, (close) = close account

---

## Account Sizes

| Account        | Discriminator | Data | Reserved | Total | Rent       |
| -------------- | ------------- | ---- | -------- | ----- | ---------- |
| Config         | 8             | 143  | 32       | ~183  | ~0.002 SOL |
| Course         | 8             | ~206 | 16       | ~230  | ~0.002 SOL |
| LearnerProfile | 8             | ~87  | 16       | ~111  | ~0.001 SOL |
| Enrollment     | 8             | ~91  | 0        | ~99   | ~0.001 SOL |
| Credential     | —             | ~88  | 0        | ~88   | 0 SOL      |

---

## Compute Unit Budget

| Instruction         | CU Budget | Primary Cost                      |
| ------------------- | --------- | --------------------------------- |
| initialize          | 5K        | PDA creation                      |
| create_season       | 50K       | Token-2022 mint + extensions      |
| close_season        | 5K        | Flag update                       |
| update_config       | 5K        | Field updates                     |
| create_course       | 15K       | PDA creation                      |
| update_course       | 10K       | Field updates                     |
| init_learner        | 5K        | PDA creation                      |
| enroll              | 15K       | PDA creation + prerequisite check |
| unenroll            | 5K        | Account close                     |
| complete_lesson     | 40K       | Bitmap + Token-2022 CPI + streak  |
| finalize_course     | 100K      | Bitmap verify + 2x Token-2022 CPI |
| issue_credential    | 200-300K  | ZK Compression CPI                |
| claim_achievement   | 30K       | Bitmap + Token-2022 CPI           |
| award_streak_freeze | 5K        | Counter increment                 |
| register_referral   | 10K       | Two account updates               |
| close_enrollment    | 5K        | Account close                     |

---

## Error Handling Strategy

```
On-chain:                           Backend:
┌─────────────────────────┐        ┌─────────────────────────────────┐
│ Anchor error codes      │        │ Retry logic for:                │
│ (AcademyError enum)     │        │   - TX confirmation failures    │
│                         │        │   - Photon indexer timeouts      │
│ checked_add/sub/mul     │        │   - Blockhash expiry            │
│ (no unchecked math)     │        │                                 │
│                         │        │ Queue for:                      │
│ require!() macros       │        │   - issue_credential failures   │
│ (fail fast)             │        │   (finalize_course already      │
│                         │        │    succeeded, XP is safe)       │
   │ checked_add/sub/mul     │        │   - TX confirmation failures    │
   │ (no unchecked math)     │        │   - Photon indexer timeouts      │
   │                         │        │   - Blockhash expiry            │
   │                         │        │                                 │
   │ require!() macros       │        │ Queue for:                      │
   │ (fail fast)             │        │   - issue_credential failures   │
   │                         │        │   (finalize_course already      │
   │                         │        │    succeeded, XP is safe)       │
   └─────────────────────────┘        └─────────────────────────────────┘

---

## Service Interfaces (Frontend)

### 1. Internationalization (i18n)
- **Library**: `react-i18next`
- **Hook**: `useI18n()`
- **Storage**: `I18nProvider` (Context API)
- **Locales**: `en`, `es`, `pt-BR` (located in `/public/locales`)

### 2. CMS (Content Management)
- **Provider**: Sanity.io
- **Client**: `@sanity/client` (configured in `lib/cms.ts`)
- **Data Flow**: Static generation + Dynamic fetching for real-time updates.

### 3. Analytics & Monitoring
- **Analytics**: GA4 (via `@next/third-parties`)
- **Heatmaps**: Microsoft Clarity (Integrated in `layout.tsx`)
- **Monitoring**: Sentry (Next.js SDK)

---

## On-Chain Integration Points

### 1. XP Minting
- **Instruction**: `complete_lesson`
- **Signer**: Backend Signer (PDA-derived or hot wallet)
- **Security**: Daily caps and prerequisite checks.

### 2. Credential Issuance
- **Instruction**: `issue_credential`
- **Technology**: ZK Compression (Light Protocol)
- **State**: Stored in a compressed account, zero rent.

---

## Component Structure

```

src/
├── app/ # App Router (Pages & Layouts)
├── components/ # UI Components
│ ├── ui/ # Atomic components (shadcn-like)
│ ├── layout/ # Navigation, Footer
│ └── blockchain/ # Wallet, Token displays
├── contexts/ # React Contexts (Services, Auth)
├── hooks/ # Custom hooks (useAnalytics, useGamification)
├── lib/ # Utilities & CMS clients
└── types/ # TypeScript definitions

```

---

## Off-Chain Dependencies

| Service | Purpose | Fallback |
| --- | --- | --- |
| Helius DAS API | XP leaderboard, token indexing | Custom indexer on transaction logs |
| Photon (via Helius) | Credential queries, validity proofs | Cache credential state in backend DB |
| Arweave | Course content, credential metadata | Content is immutable once uploaded |
| Squads | Multisig for platform authority | Single signer (reduced security) |

---

*For full implementation details, see [SPEC.md](./SPEC.md). For build order, see [IMPLEMENTATION_ORDER.md](./IMPLEMENTATION_ORDER.md). For customization, see [CUSTOMIZATION.md](./CUSTOMIZATION.md).*
```
