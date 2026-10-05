const jsonHeaders={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};

export function send(response,status,body){
  response.statusCode=status;
  for(const [key,value] of Object.entries(jsonHeaders))response.setHeader(key,value);
  response.end(JSON.stringify(body));
}

export function allowedMethods(request,response,methods){
  if(methods.includes(request.method))return true;
  response.setHeader("allow",methods.join(", "));
  send(response,405,{error:"Método não permitido."});
  return false;
}

export async function readBody(request,maxBytes=60_000){
  const chunks=[];let size=0;
  for await(const chunk of request){
    size+=chunk.length;
    if(size>maxBytes)throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  try{return JSON.parse(Buffer.concat(chunks).toString("utf8")||"{}")}
  catch{throw new Error("INVALID_JSON")}
}

function adminEmails(){
  return new Set(String(process.env.ADMIN_EMAILS||"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean));
}

export async function requireAdmin(request){
  const authorization=request.headers.authorization||"";
  const token=authorization.startsWith("Bearer ")?authorization.slice(7):"";
  if(!token)throw Object.assign(new Error("Faça login para continuar."),{statusCode:401});
  const projectId=process.env.FIREBASE_PROJECT_ID;
  if(!projectId)throw Object.assign(new Error("A autenticação administrativa ainda não foi configurada."),{statusCode:503});
  const check=await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,{signal:AbortSignal.timeout(8_000)});
  if(!check.ok)throw Object.assign(new Error("Sua sessão expirou. Entre novamente."),{statusCode:401});
  const identity=await check.json();
  const email=String(identity.email||"").toLowerCase();
  const allowed=adminEmails();
  if(identity.aud!==projectId||identity.email_verified!=="true"||!allowed.has(email)){
    throw Object.assign(new Error("Esta conta não tem acesso ao painel."),{statusCode:403});
  }
  let authorId=process.env.DEFAULT_ADMIN_AUTHOR_ID||"yoite";
  try{
    const mapping=JSON.parse(process.env.ADMIN_AUTHOR_MAP||"{}");
    authorId=mapping[email]||authorId;
  }catch{}
  return {email,uid:identity.user_id||identity.sub,authorId};
}

export function githubSettings(){
  const token=process.env.GITHUB_ADMIN_TOKEN;
  const repository=process.env.GITHUB_REPOSITORY||"yoyoziyo/roblox-codes-pro";
  if(!token)throw Object.assign(new Error("A publicação no GitHub ainda não foi configurada."),{statusCode:503});
  if(!/^[\w.-]+\/[\w.-]+$/.test(repository))throw Object.assign(new Error("Repositório administrativo inválido."),{statusCode:500});
  return {token,repository};
}

export async function githubRequest(path,options={}){
  const {token,repository}=githubSettings();
  const response=await fetch(`https://api.github.com/repos/${repository}${path}`,{
    ...options,
    headers:{accept:"application/vnd.github+json",authorization:`Bearer ${token}`,"x-github-api-version":"2022-11-28",...(options.headers||{})},
    signal:AbortSignal.timeout(12_000)
  });
  if(!response.ok){
    const detail=await response.json().catch(()=>({}));
    throw Object.assign(new Error(detail.message||"Não foi possível acessar o GitHub."),{statusCode:response.status});
  }
  return response.status===204?null:response.json();
}

export async function githubJsonFile(filePath){
  const file=await githubRequest(`/contents/${filePath}?ref=main`);
  return JSON.parse(Buffer.from(file.content,"base64").toString("utf8"));
}

export function handleError(response,error){
  const status=error.statusCode||({PAYLOAD_TOO_LARGE:413,INVALID_JSON:400}[error.message])||500;
  if(status>=500)console.error("[admin-api]",error.message);
  send(response,status,{error:status>=500?"Não foi possível concluir a operação agora.":error.message});
}
