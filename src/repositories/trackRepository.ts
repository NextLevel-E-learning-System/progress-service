export interface LearningTrack { id:string; codigo:string; titulo:string; descricao?:string }
export interface UserTrackProgress { track_id:string; user_id:string; percent:number }
export async function listTracks(): Promise<LearningTrack[]> { return []; }
export async function listUserTracks(_userId:string): Promise<UserTrackProgress[]> { return []; }
