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
  progressPercent: number;
  completedCourse: boolean;
}

export interface CourseCompletedPayload {
  enrollmentId: string;
  courseId: string;
  userId: string;
  totalProgress: number;
}