const COURSE_BASE = process.env.COURSE_SERVICE_BASE_URL || 'http://course-service:3333';
const USER_BASE = process.env.USER_SERVICE_BASE_URL || 'http://user-service:3333';

interface CourseDto { 
  codigo?:string; 
  titulo?:string; 
  instrutor_id?:string;
  instrutor_nome?:string;
  duracao_estimada?:number;
  descricao?:string;
  curso?: {  // Wrapper do course-service
    codigo:string; 
    titulo:string; 
    instrutor_id?:string;
    instrutor_nome?:string;
    duracao_estimada?:number;
    descricao?:string;
  };
}
interface UserDto { 
  id?:string; 
  nome?:string;
  funcionario?: {  // Wrapper do user-service
    id:string;
    nome:string;
  };
}

async function fetchJson<T>(url:string): Promise<T | null>{
  try {
    const r = await fetch(url, { headers:{ 'Accept':'application/json' } });
    if(!r.ok) return null;
    return await r.json() as T;
  } catch { return null; }
}

export async function getCourse(codigo:string){
  return fetchJson<CourseDto>(`${COURSE_BASE}/courses/v1/${codigo}`);
}

export async function getUser(id:string){
  const response = await fetchJson<UserDto>(`${USER_BASE}/users/v1/funcionarios/${id}`);
  // O user-service retorna { funcionario: {...} }
  return response?.funcionario || response;
}