import { useEffect, useState } from "react";
import { subscribeApiStatus, getApiStatus, ApiStatus } from "@/lib/apiClient";

export default function ApiStatusDot(){
  const [s,setS]=useState<ApiStatus>(getApiStatus());
  useEffect(()=>{
    const unsubscribe = subscribeApiStatus(setS);
    return unsubscribe;
  },[]);
  const color = s==="ok" ? "bg-green-500" : s==="limited" ? "bg-yellow-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={`API: ${s}`} />;
}