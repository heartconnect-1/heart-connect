# Heart Connect booking edge bridge

The Cloudflare Worker fronts the AppDeploy origin while the AppDeploy account is at its deployment limit.

Booking-page edge enhancements remain progressive: the original AppDeploy booking form and API stay authoritative. The edge layer may improve country/location UX, but it must not mark bookings or payments successful and must not bypass backend validation.

All-country behavior:
- The production country selector is extended with the full `Intl.DisplayNames` ISO region list.
- Existing AppDeploy countries keep their curated region/city dropdowns.
- Countries without curated AppDeploy location data automatically fall back to the existing `Other / not listed` region path so the visitor can enter state/province and city/town manually.
- Backend booking validation still requires a country and city/town.
