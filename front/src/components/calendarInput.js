import '../index.css';
import React, { useState, useEffect } from 'react';
import CustomDialog from './dialog';

export default function CalendarID({onSaveCalendarId }){
    const [dialogOpen, setDialogOpen] = useState(false);
    const [calendarId, setCalendarId] = useState({
        calendar_Id: '',
    })

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };
    
    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleSaveCalendarId = () => {
        onSaveCalendarId(calendarId);
    };
    
    return(
        <div id="calendar_id" className='w-full flex justify-center'>
        <div className='flex-col flex space-y-4 w-8/12'>
            <div className='flex flex-col'>
                <label className='text-start'>Calendar ID</label> 
                <button className='text-primary text-xs text-start' onClick={handleOpenDialog}>Como encontro meu id de calendario?</button>
                <CustomDialog open={dialogOpen} handleClose={handleCloseDialog} />
            </div>            
            <div className=' w-full flex items-center'>
                <input className='calendar-input p-3 w-full'
                 placeholder='Seu Calendar ID'
                 value={calendarId}
                 onChange={(e) => setCalendarId(e.target.value)}
                />  
                <button className='bg-primary text-white text-sm p-4 btn-id' onClick={handleSaveCalendarId}>
                    Salvar
                </button>
            </div>            
        </div>

        </div>
    )
}