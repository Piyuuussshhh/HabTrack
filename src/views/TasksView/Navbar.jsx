import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faEdit, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

/* <FontAwesomeIcon icon="fa-solid fa-check-to-slot" className='complete-icon'/>*/
/* The complete icon just refuses to come on the window, idk why though */

// TODO: style this component.

const Navbar = () => {
  return (
    <nav className='nav'>
        <p className='page-title title' style={{textAlign: 'center'}}>Tasks</p>
        <ul>
            <li>
                <button className='btn'>Tommorow</button>
            </li>
            <li>
                <button className='btn'>+</button>
            </li>
            <li>
                <button className='btn'>Completed</button>
                
            </li>
        </ul>
    </nav>
  )
}

export default Navbar