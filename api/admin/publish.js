import {allowedMethods,githubRequest,handleError,readBody,requireAdmin,send} from "./_lib.js";

const validSlug=value=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value||""));

export default async function handler(request,response){
  if(!allowedMethods(request,response,["POST"]))return;
  try{
    const admin=await requireAdmin(request);
    const body=await readBody(request);
    if(!["upsert","archive"].includes(body.action))return send(response,400,{error:"Ação inválida."});
    const slug=body.action==="archive"?body.slug:body.game?.slug;
    if(!validSlug(slug))return send(response,400,{error:"Slug inválido."});
    const requestId=crypto.randomUUID();
    const payload={action:body.action,slug,game:body.action==="upsert"?body.game:undefined,authorId:admin.authorId,actorEmail:admin.email,requestId};
    await githubRequest("/dispatches",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event_type:"admin_publish",client_payload:payload})});
    send(response,202,{ok:true,requestId,message:"Publicação enviada. O GitHub validará os dados antes de atualizar o site."});
  }catch(error){handleError(response,error)}
}
