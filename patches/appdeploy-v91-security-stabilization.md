# Heart Connect AppDeploy v91 Security Stabilization Patch

Date: 2026-09-10
Target AppDeploy app: `heart-connect-n8dpuu`
Target production version inspected: v91 / `1788958463332`
Status: **Prepared but not deployed** because the AppDeploy account rejected a new deployment at the 125/125 lifetime deployment limit.

This patch must be applied to the exact production v91 source before the next public-release build. Do not apply it blindly to older GitHub source without first synchronizing production v91 into GitHub.

## 1. Require a true mutual match everywhere communication is authorized

### `backend/messaging-core.ts`
Replace any authorization that treats `state.likes.length > 0` as sufficient. The mutual helper must require both profile IDs:

```ts
if(
  !state ||
  state.blocked ||
  !state.likes.includes(ref.pid) ||
  !state.likes.includes(targetId)
) return null;
```

Apply the same rule to inbox enumeration. A profile must not appear as a message-eligible conversation merely because one member liked the other.

### `backend/advanced-calls.ts`
Both the call-start mutual helper and call-eligibility checks must require both profile IDs in `state.likes` and `state.blocked === false`.

### UI
In `src/Stage5Experience.tsx`, Message, Audio and Video controls must render only when `selected.match === true`, not when `selected.liked === true`.

Replace one-way-like copy with:

> You liked this member. Messaging and calls unlock only if they also choose to connect.

## 2. Enforce photo/video/voice privacy in every Stage 4/5 API

### `backend/stage4.ts`
Change the public-profile serializer so it accepts authorization decisions instead of signing media unconditionally:

```ts
async function publicProfile(
  p: Profile,
  details: Details,
  allowMedia = true,
  showTravel = true
) {
  const pp = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
  const paths = allowMedia
    ? [...pp, ...(p.video ? [p.video] : []), ...(p.voice ? [p.voice] : [])]
    : [];
  const signed = paths.length ? await storage.url(paths) : [];
  const m = new Map(signed.map(x => [x.path, x.url]));

  return {
    // existing safe profile fields
    photos: allowMedia ? pp.map(x => m.get(x) || '') : [],
    photo: allowMedia && pp[0] ? m.get(pp[0]) || '' : '',
    video: allowMedia && p.video ? m.get(p.video) || '' : '',
    voice: allowMedia && p.voice ? m.get(p.voice) || '' : '',
    travel: showTravel ? p.travel : undefined,
    // remaining existing safe fields
  };
}
```

For every target member, resolve the target privacy record and calculate:

```ts
const matched = !!state &&
  state.likes.includes(ref.pid) &&
  state.likes.includes(p.id);

const photoVisibility = String(privacy?.photoVisibility || 'everyone');
const allowMedia =
  photoVisibility === 'everyone' ||
  (photoVisibility === 'matches' && matched);
```

Then pass `allowMedia` and `privacy?.showTravel !== false` into the serializer.

This must cover at least:

- `/api/discover`
- `/api/stage4/home`
- `/api/stage4/explore`
- `/api/stage4/connections`
- `/api/stage4/messages`
- `/api/stage4/profile/:id`

Also enforce `privacy.discoverable`, `privacy.profileVisibility === 'paused'`, and `privacy.profileVisibility === 'incognito'` in addition to the older Stage 4 `visibilityMode` field.

## 3. Harden realtime subscriptions and make the hardened handler effective

### `backend/realtime-subscribers.ts`
Store the authenticated owner on every subscription record. Conversation subscription authorization must:

1. Parse exactly two profile IDs from the conversation key.
2. Confirm the requesting member owns one of them.
3. Load the pair state.
4. Reject blocked pairs.
5. Require both profile IDs in `likes`.

Deduplicate identical subscriptions and scope removal to the authenticated owner.

Ignore legacy subscription records that do not contain an authenticated `owner` when sending realtime notifications. Existing connected clients can safely re-subscribe after release.

### `backend/index.ts`
The effective final router composition must put:

```ts
...realtimeSubscriptionRoutes
```

**after** `...stage3Routes`, because Stage 3 currently defines the same `/api/subscriptions` and `/api/subscriptions/remove` route keys. The hardened implementation must win route composition.

## 4. Harden Heart Connect session cookies

### `backend/heart-auth.ts`
For the same-site `royal-heart.com` member application, replace:

```text
SameSite=None; Partitioned
```

with:

```text
SameSite=Lax
```

Keep `__Host-`, `Secure`, `HttpOnly`, `Path=/`, and the existing expiration. This reduces cross-site cookie/CSRF surface while preserving normal top-level login navigation.

After deployment, explicitly test every social-login callback path. If a provider requires a cross-site POST callback that genuinely needs `SameSite=None`, use a short-lived callback-specific state cookie rather than weakening the primary session cookie.

## 5. Remove the publicly callable staff-role RPC dependency

### `backend/cms.ts`
Stop calling Supabase `heart_connect_role_for_email` using the publishable key.

Resolve non-superadmin staff roles from the existing server-side `stage7_staff_roles` AppDeploy table and the `HEART_CONNECT_ADMIN_EMAILS` server secret instead. Keep least-privilege mapping for moderator, support, content editor, admin and super admin.

Only after this AppDeploy change is live should Supabase execute access to `public.heart_connect_role_for_email(text)` be revoked from `anon` and `authenticated`.

## 6. Keep signup metadata compatible

### `backend/auth-system.ts`
When calling Supabase signup, send both the canonical keys and compatibility timestamps:

```ts
data: {
  first_name: b.firstName.trim(),
  name: b.firstName.trim(),
  dob: b.dob,
  date_of_birth: b.dob,
  gender: String(b.gender || ''),
  country: b.country.trim(),
  city: b.city.trim(),
  relationship_intention: String(b.intention || ''),
  signup_phone: String(b.phone || '').trim(),
  age_confirmed: true,
  terms_accepted: true,
  privacy_accepted: true,
  terms_accepted_at: now,
  privacy_accepted_at: now
}
```

The production Supabase trigger was already migrated on 2026-09-10 to accept both old and new metadata forms.

## 7. Improve phone and laptop startup latency

### `src/App.tsx`
Do not wait for discovery to finish before requesting verification, notifications and translation preferences. Start them in parallel after authenticated member state is known.

Lazy-load the large Stage 6 and Stage 7 launchers just like Stage 8:

```ts
const Stage6Launcher = lazy(() => import('./Stage6Launcher'));
const Stage7Launcher = lazy(() => import('./Stage7Launcher'));
const Stage8Launcher = lazy(() => import('./Stage8Launcher'));
```

Render them under `Suspense` with a non-blocking fallback.

### `src/Stage5Experience.tsx`
Split startup fetching into two groups:

Primary, render-first:
- `/api/stage4/home`
- `/api/stage4/discovery-preferences`
- `/api/billing/membership`

Secondary, after core UI can render:
- `/api/stage4/explore`
- `/api/stage4/connections`
- `/api/stage4/messages`
- `/api/stage4/profile-details`

### `backend/stage4.ts`
Parallelize independent per-profile reads with `Promise.all` where safe: pair state + target prefs, then privacy + details + normalized location + last-active lookup. Longer term, replace the N+1 discovery read pattern with indexed/batched profile projection data.

## 8. Release gates

Before merging/releasing, the tests in `tests/security-stabilization-tests.txt` must pass. At minimum verify:

- private media never receives a signed URL through any discovery/profile API;
- one-way likes cannot message/call/subscribe;
- realtime removal cannot delete another user's subscriptions;
- phone 375px member shell remains usable while secondary data loads;
- desktop/laptop initial boot avoids unnecessary serial request delays;
- M-Pesa/Paystack entitlements still require trusted backend confirmation;
- reporting, blocking, Safe Date and account deletion remain intact.

## 9. Known external hardening tasks

After CMS no longer depends on the Supabase staff-role RPC:

```sql
revoke execute on function public.heart_connect_role_for_email(text) from anon, authenticated;
```

Also enable Supabase Auth leaked-password protection in project authentication security settings. This is an account configuration toggle, not a database migration.

## Release rule

Do **not** market the deployment as fully hardened until the AppDeploy v91 patch is actually deployed and the mutual-match/private-media regression tests pass against production.

---
Cloudflare preview-build trigger: 2026-09-10T10:22:00+03:00. This documentation-only change intentionally exists to trigger the non-production Git integration build for `security-stabilization-2026-09-10`; it does not change runtime behavior.
