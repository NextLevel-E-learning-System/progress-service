import { listTracks, listUserTracks } from '../repositories/trackRepository.js';
export async function getTracks(){ return listTracks(); }
export async function getUserTrackProgress(userId:string){ return listUserTracks(userId); }
