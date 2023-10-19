import '../index.css';
import React from 'react';

function Header(){
    return (
        <div className="bg-black-opac w-full h-full header p-4 space-y-2 text-white">
            <h1 className='text-4xl cormorant-font'>Formulario integração Clickup</h1>
            <p className='text-sm'>Para ter acesso a integração google agenda x Clickup precisamos <br />que você siga o passo a passo abaixo!</p>
        </div>
    ) 
};

export default Header;