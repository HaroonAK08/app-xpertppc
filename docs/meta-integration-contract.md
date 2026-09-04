# Meta integration contract

Verified on 2026-09-05. Meta Developer documentation returned HTTP 429 from the build environment, so no API version is assumed in code. Deployments must set `META_GRAPH_VERSION` to a version currently supported by the configured Meta app after checking the app dashboard and current changelog.

## Verified operations

Meta's official Lead Ads sample confirms:

- webhook verification uses `hub.mode`, `hub.verify_token`, and `hub.challenge`;
- Page webhook payloads use `object: page`, `entry[].id`, and `changes[]` with `field: leadgen`;
- lead changes contain `page_id`, `form_id`, and `leadgen_id`;
- Page subscription uses `/{page-id}/subscribed_apps` with `subscribed_fields=leadgen`;
- lead retrieval uses `/{leadgen-id}`;
- Page discovery uses the accounts edge.

Sources:

- https://github.com/fbsamples/lead-ads-webhook-sample
- https://github.com/fbsamples/lead-ads-webhook-sample/blob/main/postman/FB%20Lead%20Ads%20%28Part%201%20-%20The%20Webhook%29.postman_collection.json

Meta's official Messenger Platform Postman workspace confirms that text replies require a Page access token, `pages_messaging`, and a recipient who messaged the Page within the standard 24-hour window (unless a separately approved policy exception applies):

- https://www.postman.com/meta/messenger-platform-api/documentation/iyp204x/messenger-platform-api

## Fail-closed policy

- OAuth cannot start unless `META_GRAPH_VERSION` and `META_OAUTH_SCOPES` are explicitly configured.
- Messaging is not enabled merely because Lead Ads is connected.
- A lead form submission never creates a conversation.
- Tokens are encrypted server-side, redacted from logs, and never returned to mobile.
- Webhook POST requests require a valid `X-Hub-Signature-256` HMAC before parsing or queueing.
- App Review, Business Verification, Page task access, and permission access levels must be confirmed in the Meta app dashboard before staging acceptance.

## Push delivery contract

The worker uses Expo's documented HTTPS endpoint, batches per notification recipient, retries HTTP 429/5xx through BullMQ exponential backoff, persists push ticket IDs, and removes tokens rejected as `DeviceNotRegistered`. Production should enable Expo enhanced push security and set `EXPO_ACCESS_TOKEN`.

- https://docs.expo.dev/push-notifications/sending-notifications/
