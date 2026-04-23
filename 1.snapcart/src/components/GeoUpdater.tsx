'use client'
import { getSocket } from '@/lib/socket'
import { useEffect } from 'react'

function GeoUpdater({userId}:{userId:string}) {
    useEffect(()=>{
      if(!userId)return
      const socket=getSocket()
      const registerIdentity=()=>{
        socket.emit("identity",userId)
      }

      registerIdentity()
      socket.on("connect",registerIdentity)

      if(!navigator.geolocation){
        return ()=>socket.off("connect",registerIdentity)
      }
        const watcher=navigator.geolocation.watchPosition((pos)=>{
            const lat=pos.coords.latitude
            const lon=pos.coords.longitude
            socket.emit("update-location",{
              userId,
              latitude:lat,
              longitude:lon
            })
        },(err)=>{
          console.log(err)
        },{enableHighAccuracy:true})
        return ()=>{
          socket.off("connect",registerIdentity)
          navigator.geolocation.clearWatch(watcher)
        }
      
    },[userId])
  return null
}

export default GeoUpdater
