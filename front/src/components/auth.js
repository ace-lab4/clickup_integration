import '../index.css';
import React, { useState, useEffect } from 'react';
import 'tailwindcss/tailwind.css';
import iconGoogle from '../assets/iconGoogle.svg'
import Form from './form';

export default function Auth({onSuccess}){
    const [success, setSuccess] = useState(false);
    const [tokens, setTokens] = useState({
        access_token: '',
        refresh_token: ''
    });
  
    const openLogin = () => {
        const authWindow = window.open('https://dbb3a7466258-10788679143900993082.ngrok-free.app/authorize', '_blank');
    
        window.addEventListener('message', event => {
          if (event.origin === 'https://dbb3a7466258-10788679143900993082.ngrok-free.app') {
            const receivedTokens = {
              access_token: event.data.access_token,
              refresh_token: event.data.refresh_token
            };
    
            console.log('Tokens recebidos no front-end:', receivedTokens);
    
            setTokens(receivedTokens);
            setSuccess(true);
    
            authWindow.close(); // Fecha a janela após a conclusão
            console.log('Success:', success);
    
            onSuccess(receivedTokens);
          }
        });
    };
    
    return(
        <div className='flex flex-col space-y-6'>
            <div className='step-wrapper text-center text-xl p-8 font-medium w-full self-center'>
                <p>Para começar faça login com o google. <br /> Lembre de usar sua conta Ace!</p>
            </div>
            <div className='h-auto justify-center flex flex-col items-center'>
                <button className='bg-primary text-white text-sm p-3 w-7/12 font-medium flex flex-row justify-evenly items-center' onClick={openLogin}>
                    <img src={iconGoogle} className='h-4 self-center flex'/>
                    Faça login com google
                </button>
                {success &&  <p className='text-sm text-green-500 font-semibold' id="resposta">Sucesso!</p>}
            </div>        
        </div>
    )
}
