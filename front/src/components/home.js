import '../App.css';
import '../index.css';
import React, { useState, useEffect } from 'react';
import Header from './header';
import logo from '../assets/Logo.svg'
import Steps from './stepper';
import 'tailwindcss/tailwind.css';
import iconGoogle from '../assets/iconGoogle.svg'
import Form from './form';

function Home() {

  return (
    <div className="bg-img h-screen w-screen overflow-x-hidden overflow-y-hidden">
      <img src={logo} className='h-16 absolute p-2'/>
      <div className='flex w-screen h-screen justify-center items-center'>
        <div className="wrapper w-6/12 h-5/6 ">
          <div className="w-full h-auto">
            <Header />
          </div>
          <div className='w-full h-5/6 flex  justify-center'>
          <div className='flex flex-col space-y-10 justify-center'>
            <div className='step-wrapper text-center text-xl p-8 font-medium w-full self-center'>
                <p>Para começar faça login com o google. <br /> Lembre de usar sua conta Ace!</p>
            </div>
            <div className='h-auto justify-center flex flex-col items-center'>
                <button className='bg-primary text-white text-sm p-3 w-7/12 font-medium flex flex-row justify-evenly items-center' >
                    <img src={iconGoogle} className='h-4 self-center flex'/>
                    Faça login com google
                </button>
                <p className='text-sm text-green-500 font-semibold'>Autenticação feita com Sucesso!</p>
            </div>
            <div className=' hidden'>
             <Form  />
            </div>
            </div>
            {/* <Steps /> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
