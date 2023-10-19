import '../index.css';
import React, { useState, useEffect } from 'react';
import 'tailwindcss/tailwind.css';
import iconGoogle from '../assets/iconGoogle.svg'
import Form from './form';

export default function Auth(){
    const [authSuccess, setAuthSuccess] = useState(false);
    const [tokens, setTokens] = useState({ accessToken: '', refreshToken: '' });

    const handleGoogleLogin = async () => {
        window.location.replace('https://dbb3a7466258-10788679143900993082.ngrok-free.app/authorize');
    };

    useEffect(() => {
        const checkAuthSuccess = async () => {
            try{
                const response = await fetch('https://dbb3a7466258-10788679143900993082.ngrok-free.app/oauth2callback');
                const data = await response.json();
                setTokens(data);
                setAuthSuccess(true);
            } catch (error) {
                console.error(error);
                // Lidar com o erro, por exemplo, exibir uma mensagem de erro para o usuário
            }
        };

        checkAuthSuccess();
    }, []);

    return(
        <div className='flex flex-col space-y-6'>
            <div className='step-wrapper text-center text-xl p-10 font-medium'>
                <p>Para começar faça login com o google. <br /> Lembre de usar sua conta Ace!</p>
            </div>
            <div className='h-auto justify-center flex flex-col items-center'>
                <button className='bg-primary text-white text-sm p-3 w-7/12 font-medium flex flex-row justify-evenly items-center' onClick={handleGoogleLogin} >
                    <img src={iconGoogle} className='h-4 self-center flex'/>
                    Faça login com google
                </button>
                {authSuccess && <p className='text-sm text-green-500 font-semibold'>Autenticação feita com Sucesso!</p>}
            </div>
            <div className=' hidden'>
             <Form tokens={tokens} />
            </div>
        </div>
    )
}
