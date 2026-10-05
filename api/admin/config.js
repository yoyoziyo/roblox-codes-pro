import {allowedMethods,send} from "./_lib.js";

export default function handler(request,response){
  if(!allowedMethods(request,response,["GET"]))return;
  send(response,200,{
    firebaseApiKey:process.env.FIREBASE_API_KEY||"",
    firebaseProjectId:process.env.FIREBASE_PROJECT_ID||"",
    configured:Boolean(process.env.FIREBASE_API_KEY&&process.env.FIREBASE_PROJECT_ID&&process.env.ADMIN_EMAILS&&process.env.GITHUB_ADMIN_TOKEN)
  });
}
