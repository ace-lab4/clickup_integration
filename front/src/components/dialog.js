import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';


const CustomDialog = ({ open, handleClose }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Como achar o ID do seu calendario</DialogTitle>
      <DialogContent>
        <DialogContentText>
            <div className='p-4'>
            <ul className='list-decimal space-y-1'> 
                <li className='text-black-opac'>Abra o Google Agenda</li>
                {/* 
                <li className='text-black-opac'>Na parte esquerda da tela, em "Outras agendas", clique no botão "+";</li>
                <li className='text-black-opac'>Selecione a opção "Criar nova agenda;</li>
                <li className='text-black-opac'>Adicione um nome e uma descrição para a nova agenda;</li>
                <li className='text-black-opac'>Clique em criar agenda para confirmar</li> */}
                <li className='text-black-opac'>Em "Minhas agendas", localize sua agenda.</li>
                <li className='text-black-opac'>Clique em ⡆e depois "Mais" e depois em "Configurações e compartilhamento".</li>
                <li className='text-black-opac'>Role para baixo até a seção "Integrar agenda" e copie o ID da agenda.</li>
                <li className='text-black-opac'>O ID é um código longo.</li>
            </ul>
            </div>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
      </DialogActions>
   
    </Dialog>
  );
};

export default CustomDialog;
