export const QUEUES = {
  metaWebhooks: 'meta-webhooks', metaLeadFetch: 'meta-lead-fetch',
  providerMessaging: 'provider-messaging', pushNotifications: 'push-notifications',
  transactionalEmail: 'transactional-email',
  sync: 'sync', maintenance: 'maintenance',
} as const;
export const DEFAULT_JOB_OPTIONS = { attempts: 5, backoff: { type: 'exponential', delay: 2_000 }, removeOnComplete: 1_000, removeOnFail: 5_000 } as const;
