import React, { useState } from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Form from './form'
import Auth from './auth'
import Result from './finalResult';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import CalendarID from './calendarInput';

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Montserrat, sans-serif', // Aplica Montserrat nos botões
        },
      },
    },
  },
});

function Steps() {
    const [activeStep, setActiveStep] = useState(0);
  
    const handleNext = () => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
  
    const handleBack = () => {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };
  
    return (
      <div className='h-[90%] w-full flex flex-col items-center justify-between overflow-y-auto'>
        <div className='w-6/12 mt-5 '>
        <Stepper activeStep={activeStep} alternativeLabel>
          <Step>
            <StepLabel></StepLabel>
          </Step>
          <Step>
            <StepLabel></StepLabel>
          </Step>
          <Step>
            <StepLabel></StepLabel>
          </Step>
          <Step>
            <StepLabel></StepLabel>
          </Step>
        </Stepper>
        </div>
        <div className='w-full items-center justify-center flex flex-col space-y-8'>
        {activeStep === 0 && <Auth />}
        {activeStep === 1 && <CalendarID />}
        {activeStep === 2 && <Form />}
        {activeStep === 3 && <Result />}
        </div>
        <ThemeProvider theme={theme}>
        <div className='h-auto flex bottom-0 justify-center w-full'>
          {activeStep !== 0 && (
            <Button onClick={handleBack}>Voltar</Button>
          )}
          {activeStep < 3 ? (
            <Button variant="contained" onClick={handleNext} className='montserrat-font'>
              Avançar
            </Button>
          ) : (
            <Button variant="contained">
              Concluir
            </Button>
          )}
        </div>
        </ThemeProvider>
      </div>
    );
}

export default Steps;

  
