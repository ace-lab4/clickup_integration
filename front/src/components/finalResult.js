import '../index.css';
import React from 'react';
import 'tailwindcss/tailwind.css';
import error from '../assets/error.png'
import sucesso from '../assets/sucesso.png'

export default function Result(){
    return(
        <div className='w-full flex flex-col justify-center items-center space-y-3'> 
            <img src={sucesso} className='h-3/6'/>
            <p className='text-center text-lg text-black-opac'>Seu calendário foi sincronizado com sucesso!<br />Comece a usar a integração mas antes olhe o <a className='text-primary font-medium cursor-pointer'>passo a passo</a>!</p>
        {/* 
            <div className='w-full flex flex-col justify-center items-center space-y-3'> 
                <img src={error} className='h-3/6'/>
                 <p className='text-center text-lg text-black-opac'>Ops! Houve um erro com sua autenticação, mas não se preocupe! <br /> Entre em contato com alguém da torre <a className='text-primary font-medium cursor-pointer' url="https://goace.slack.com/team/U05EPRR7EJ0">via slack</a> que iremos checar!</p>
             </div>
        */}
        </div>
        
    )
}