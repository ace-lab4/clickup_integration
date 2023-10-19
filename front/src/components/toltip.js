import React, { useState, useEffect } from 'react';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import '../index.css';

const Toltip = ({ text }) => {
    return (
      <Tooltip title={text} arrow>
        <IconButton>
          <InfoIcon />
        </IconButton>
      </Tooltip>
    );
  };
  
  export default Toltip;