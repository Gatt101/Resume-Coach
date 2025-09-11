import { NextRequest } from "next/server";


export async function POST(req:NextRequest)
{
    const formData=await req.formData();
    console.log(formData.get("file"));
    return new Response(JSON.stringify({message:"Upload endpoint placeholder"}),{status:200});
}