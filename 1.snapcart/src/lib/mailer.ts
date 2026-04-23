import nodemailer from "nodemailer"

const hasMailValue = (value?: string) => Boolean(value && !/^add your .* here$/i.test(value))

const transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user:process.env.EMAIL,
    pass:process.env.PASS, 
  },
});

export const sendMail=async (to:string,subject:string,html:string)=>{
if(!hasMailValue(process.env.EMAIL) || !hasMailValue(process.env.PASS)){
 throw new Error("Email credentials are not configured")
}
await transporter.sendMail({
 from:`"Quick Basket" <${process.env.EMAIL}> `,
 to,
 subject,
 html
})
}
