import '../index.css';
import React, { useState, useEffect } from 'react';
import 'tailwindcss/tailwind.css';
import lottie from 'lottie-web';
import Toltip from './toltip';


export default function Form({tokens, calendarId}){
    const [showScrollHint, setShowScrollHint] = useState(true);
    const [accessToken, setAccessToken] = useState(tokens.access_token || '');
    const [refreshToken, setRefreshToken] = useState(tokens.refresh_token || '');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [formData, setFormData] = useState([]);

    useEffect(() => {
      const newData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        calendarId: calendarId,
        email: email,
      };
      setFormData([newData]);
    }, [accessToken, refreshToken, calendarId, email]);

    useEffect(() => {
        lottie.loadAnimation({
          container: document.getElementById('tip'),
          renderer: 'svg',
          loop: true, 
          autoplay: true, 
          animationData: require('../assets/lottie.json') 
        });
      }, []);

   useEffect(() => {
        const timeout = setTimeout(() => {
            setShowScrollHint(false);
        }, 3000); 

        return () => clearTimeout(timeout);
    }, []); 

    
    // console.log('Tokens enviados para o Form:', tokens );
    
    return(
        <div className='flex-col flex w-full justify-center items-center h-full mt-8'>
            {showScrollHint && (
                <div className='absolute right-[15%] top-[10%] text-white text-base flex flex-col justify-center items-center font-medium tip p-6 '>
                    <p className='animate-pulse'>Role para baixo</p>
                    <div className="" id='tip' style={{ width: '100px', height: '50px', overflow: 'hidden' }}></div>
                </div>
            )}
            <form className='flex flex-col w-full items-center p-1 space-y-5'>

                <div className='flex-col flex w-8/12 space-y-2'>
                    <label className='text-sm'>E-mail</label>
                    <input className='form-input p-3 text-sm'
                        placeholder='Seu e-mail institucional'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className='flex-col flex w-8/12 space-y-2'>
                    <label className='text-sm'>Confirme seu e-mail</label>
                    <input className='form-input p-3 text-sm'
                        placeholder='Informe novamente'
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                    />
                </div>
                <div className='flex-col flex w-8/12 space-y-2'>
                    <div>
                        <label className='text-sm'>Acess Token</label>
                        <Toltip text="Isso não deve ser excluido!" />
                    </div>
                    <input className='form-input p-3 text-sm' 
                    id="acess_token"
                    value={accessToken}
                    readOnly 
                    />
                </div>
                <div className='flex-col flex w-8/12 space-y-2'>
                    <div>
                        <label className='text-sm'>Refresh Token</label>
                        <Toltip text="Isso não deve ser excluido!" />
                    </div>
                    <input className='form-input p-3 text-sm'
                    id="refresh_token"
                    value={refreshToken}
                    readOnly 
                    />
                </div>
            </form>
        </div>
    )
}