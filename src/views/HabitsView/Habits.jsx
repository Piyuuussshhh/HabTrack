import React from "react";
import "../../App.css";

// imports
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const Habits = () => {
    return (

        <div className="habits-area">
            <div className="habits-container">
                <div className="habits-card">
                    <input type="checkbox"/>
                    <ul>
                    <li><label>Input habit name<br/></label></li>
                    <li><label>I dont understand piyush's code lmao</label><br/></li>
                    </ul>
                    <div>
                        <label>
                        </label>
                    </div>
                    <ul>
                        <li>
                        <button className="task-btn">
                            <EditIcon></EditIcon>
                        </button>
                        </li>
                        <li>
                        <button className="delete-icon">
                            <DeleteIcon></DeleteIcon>
                        </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

    );
};

export default Habits;
