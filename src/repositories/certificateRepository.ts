export interface Certificate { id:string; enrollment_id:string; user_id:string; course_id:string; issued_at:Date; verification_code:string }
export async function listCertificatesByUser(_userId:string): Promise<Certificate[]> { return []; }
export async function issueCertificatePlaceholder(enrollmentId:string): Promise<Certificate> { return { id: 'placeholder', enrollment_id: enrollmentId, user_id: 'u', course_id: 'c', issued_at: new Date(), verification_code: 'VERIFY123' }; }
