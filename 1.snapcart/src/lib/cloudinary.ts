import { v2 as cloudinary } from 'cloudinary'

const isPlaceholder = (value?: string) => !value || /^add your .* here$/i.test(value)
const hasCloudinaryConfig =
  !isPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) &&
  !isPlaceholder(process.env.CLOUDINARY_API_KEY) &&
  !isPlaceholder(process.env.CLOUDINARY_API_SECRET)

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET
});

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

const uploadOnCloudinary=async (file:Blob):Promise<string>=>{
if(!file){
    throw new Error("Please upload an image")
}

if(!hasCloudinaryConfig){
    throw new Error("Cloudinary credentials are missing in .env")
}

try {
const arrayBuffer=await file.arrayBuffer()
const buffer=Buffer.from(arrayBuffer)
const uploadedUrl = await new Promise<string>((resolve,reject)=>{
    const uploadStream=cloudinary.uploader.upload_stream(
        {resource_type:"auto"},
        (error,result)=>{
            if(error){
                reject(new Error(error.message))
            }else if(!result?.secure_url){
                reject(new Error("Cloudinary did not return an image URL"))
            }else{
                resolve(result.secure_url)
            }
        }

       
    )
    uploadStream.end(buffer)
})
return uploadedUrl
} catch (error) {
    throw new Error(`Cloudinary upload failed: ${getErrorMessage(error)}`)
}

}


export default uploadOnCloudinary
