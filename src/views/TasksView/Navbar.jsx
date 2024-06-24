import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faEdit, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

/* <FontAwesomeIcon icon="fa-solid fa-check-to-slot" className='complete-icon'/>*/
/* The complete icon just refuses to come on the window, idk why though */

// TODO: style this component.

const Navbar = ({ onAdd }) => {
  return (
    <nav className='nav'>
        <p className='page-title title'>Tasks</p>
        <ul>
            <li>
                <button className='btn'>Tommorow</button>
            </li>
            <li>
                <button className='btn' onClick={onAdd}>+</button>
            </li>
            <li>
                <button className='btn'>Completed</button>

            </li>
        </ul>
    </nav>
  )
}

export default Navbar