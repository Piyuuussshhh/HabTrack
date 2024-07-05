import React from "react";
import AddIcon from '@mui/icons-material/Add';

const Navbar = () => {
    return (
        <nav className="nav">
            <p className="page-title title">Habits</p>
            <button className='nav-add-btn'><AddIcon fontSize='medium'></AddIcon></button>
        </nav>
    )
}

export default Navbar;