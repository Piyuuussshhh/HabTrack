import React from 'react'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import FastForwardIcon from '@mui/icons-material/FastForward';
import AddIcon from '@mui/icons-material/Add';


// TODO: style this component.

const Navbar = ({ onAdd }) => {
  return (
    <nav className='nav'>
        <p className='page-title title' style={{textAlign: 'center'}}>Tasks</p>
        <ul>
            <li>
                <button className='btn'><FastForwardIcon fontSize='medium'></FastForwardIcon></button>
            </li>
            <li>
                <button className='btn' onClick={onAdd}><AddIcon fontSize='medium'></AddIcon></button>
            </li>
            <li>
                <button className='btn'><PlaylistAddCheckIcon fontSize='medium'></PlaylistAddCheckIcon></button>
                
            </li>
        </ul>
    </nav>
  )

}

export default Navbar