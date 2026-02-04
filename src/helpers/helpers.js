import bcrypt from "bcryptjs";
import nodemailer from 'nodemailer';
import axios from 'axios';
import crypto from 'crypto';

const transport = nodemailer.createTransport(
  {
      host: "smtp.ionos.mx",
      port: 587,
      secure: false,
      auth: {
        user: "systems.support@wmsvantec.com.mx",
        pass: "vantecFY23$@8792.%_", // <-- ¡mueve esto a variables de entorno!
      },
    }
)

export function generatePassword(length = 12, options = { mayus: true, minus: true, numbers: true, symbols: true }) {
  const charts = {
    mayus: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    minus: 'abcdefghijklmnopqrstuvwxyz',
    numeros: '0123456789',
    simbolos: '!@#$%^&*()_+[]{}<>?,./-='
  };

  let pool = '';
  if (options.mayus) pool += charts.mayus;
  if (options.minus) pool += charts.minus;
  if (options.numbers) pool += charts.numeros;
  if (options.symbols) pool += charts.simbolos;

  if (!pool) throw new Error('Debes habilitar al menos un tipo de carácter');

  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    password += pool[randomIndex];
  }

  return password;
}

export async function sendEmail(mailOptions){
  try {
    
    await transport.verify((error, success) => {
        if (error) {
          throw new Error(error);
        } else {
          console.log('Server is ready to take our messages');
        };
    });
    
    const result = await transport.sendMail(mailOptions);

    console.log('Email enviado correctamente:',result.response);

    return result;

  } catch (error) {
    console.log('Error mandando el correo:',error);
    throw error;
  }
}

export async function requestWMSToken(){
  try {
    
    // `${process.env.WMS_URL}/User/GenerateJWTForVMI`
    const response = await axios.post(
      `https://wmsvantec.com.mx:3001/User/GenerateJWTForVMI`, 
      {
        Key: "UKg2p3VrMBGe4KQYL1MSeDWh0vDay2"
      },
      {
        timeout: 5000,
      }
    );

    return response.data.Token;

  } catch (error) {

      console.error('Error generating VMI token:', error.response?.data || error.message);
      throw new Error('VMI_AUTH_FAILED');

  }
};

export async function getPartNumbersInformation(params) {
  try {
    
    const response = await axios.post(
      `https://wmsvantec.com.mx:3001/Catalog/GetSimplifiedCustomerCatalog`,
      {
        
      }
    );

    
  } catch (error) {
    
  }
}

export const hashEmail = (email) => {
  return crypto
    .createHmac('sha256', '6tPDqku42VaEh7neMTHKVwKQxe3FFz')
    .update(email.toLowerCase().trim())
    .digest('hex');
};

export const sendASN = async (asnInformation) => {
  try {
    console.log(asnInformation);

    const VMIToken = await requestWMSToken();

    const response = await axios.post(`https://wmsvantec.com.mx:3001/ASN/CreateNewASNFromVMI`,
      {
        Landing: asnInformation
      },{
        headers: {
          Authorization: `Bearer ${VMIToken}`,
        },
        timeout: 5000
      }
    );

    return response;
    
  } catch (error) {
      console.error('Error sending ASN:', error.response?.data || error.message);
      throw new Error('VMI_SEND_ASN_FAILED');
  }
};

export const activateASNinWarehouse = async (landingID) => {
  try {
    
    const VMIToken = await requestWMSToken();
    
    const response = await axios.post(`https://wmsvantec.com.mx:3001/ASN/pendingEndpoint`, 
      {
        landingID
      },
      {
        headers: {
          Authorization: `Bearer ${VMIToken}`,
        },
        timeout: 5000
      }
    );

    return response;

  } catch (error) {
    console.error('Error activating ASN:', error.response?.data || error.message);
      throw new Error('VMI_ACTIVATED_ASN_FAILED');
  };
}