type AuditEventType = 
  | 'seed_upsert'
  | 'seed_replace'
  | 'seed_reset'
  | 'booking_attempt'
  | 'booking_success'
  | 'booking_failure';

interface AuditEvent {
  timestamp: string;
  type: AuditEventType;
  ip?: string;
  details: Record<string, unknown>;
  success: boolean;
}

class AuditLogger {
  private logs: AuditEvent[] = [];
  private maxLogs = 1000;

  log(
    type: AuditEventType,
    details: Record<string, unknown>,
    success: boolean = true,
    ip?: string
  ): void {
    const sanitizedDetails = this.sanitizeDetails(details);
    
    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      type,
      ip,
      details: sanitizedDetails,
      success,
    };

    this.logs.push(event);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.info(`[AUDIT] ${type} - ${success ? 'SUCCESS' : 'FAILURE'}`, {
      ip,
      details: sanitizedDetails,
    });
  }

  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apiKey'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  getLogs(limit: number = 100): AuditEvent[] {
    return this.logs.slice(-limit);
  }

  getLogsByType(type: AuditEventType, limit: number = 100): AuditEvent[] {
    return this.logs
      .filter(log => log.type === type)
      .slice(-limit);
  }

  clear(): void {
    this.logs = [];
    console.info('[AUDIT] Audit logs cleared');
  }
}

export const auditLogger = new AuditLogger();
