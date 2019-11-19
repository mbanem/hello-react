import React from "react";

function TodoForm(props) {
  return (
    <form onSubmit={e => { e.preventDefault(); }}>
      <input
        id="input"
        type="text"
        className="form-control-x"
        onKeyUp={e => {
          e.preventDefault();
          if (e.keyCode === 13) {
            props.onAddToDo('add', e.target.value);
            e.target.value = '';
          }
        }}
        placeholder="Type then hit *Enter*"
      />
    </form>
  );
}

export default TodoForm;

// onChange = { e => { setValue(e.target.value); return false; }}