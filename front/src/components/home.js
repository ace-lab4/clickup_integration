import '../App.css';
import '../index.css';
import React, { useState, useEffect } from 'react';
import Header from './header';
import logo from '../assets/Logo.svg'
import 'tailwindcss/tailwind.css';
import Steps from './stepper';

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
            <Steps />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
