import React from "react";
import '../todo.css';

const Todo = ({ todo, index, todoHandler }) => {
  return (
    <React.Fragment>
      <div key={index} className="card mb-3">
        <div className="card-body">
          <h5
            className="card-title"
            style={{
              backgroundColor: todo.isCompleted ? 'black' : 'burlywood',
              color: todo.isCompleted ? 'yellow' : 'white',
              textDecoration: todo.isCompleted ? "line-through" : ""
            }}
          >
            {todo.text}
          </h5>
        </div>
      </div>
      <div className="completed-deleted">
        <div onClick={() => todoHandler('complete', index)} className="my-btn">
          {todo.isCompleted ? 'Mark Uncompleted' : 'Mark Completed'}
        </div>
        <div onClick={() => todoHandler('delete', index)} className="delete-btn">&times;</div>
      </div>
    </React.Fragment>
  );
}

export default Todo;