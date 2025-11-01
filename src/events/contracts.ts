export interface DomainEvent<T = unknown> {
  eventId: string;
  type: string;
  version: number;
  occurredAt: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  payload: T;
}

export interface ModuleCompletedPayload {
  enrollmentId: string;
  courseId: string;
  userId: string;
  moduleId: string;
  xpEarned: number;
  progressPercent: number;
  completedCourse: boolean;
}

export interface CourseCompletedPayload {
  enrollmentId: string;
  courseId: string;
  userId: string;
  totalProgress: number;
}

export interface CertificateIssuedPayload {
  courseId: string;
  userId: string;
  certificateCode: string;
  issuedAt: string;
  storageKey?: string | null;
  verificationHashFragment: string; // parte inicial do hash para auditoria sem expor tudo
}