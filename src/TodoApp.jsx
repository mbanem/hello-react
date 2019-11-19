import React, { useState, useEffect, Component } from "react";
import Todo from './todo/components/todo';
import TodoForm from './todo/components/todoform';

import './todo/todo.css';

class ReactVersion extends Component {
  render() {
    return (
      <div className="react-version">
        Currently using React {React.version}
      </div>
    )
  }
}

function App() {
  const [persons, setPersons] = useState([
    { fname: 'Mili', lname: 'Milutinovic', address: '138 Princess St.' },
    { fname: 'Milka', lname: 'Milutinovic', address: '138 Princess St.' }
  ]);

  const [todos, setTodos] = useState([
    { text: "Learn React Hooks", isCompleted: false },
    { text: "Take a Drive", isCompleted: false },
    { text: "Play some games", isCompleted: false }
  ]);
  let last = persons.length - 1;
  const scrollPerson = () => {
    let newPersons = [persons[last], ...persons.slice(0, -1)];
    setPersons([...newPersons]);
  }
  const handleToDo = (action, val) => {
    let newToDos;
    switch (action) {
      case 'add':
        // val is a text entered in input box
        newToDos = [...todos, { text: val }];
        if (persons.length === 2) {
          setPersons([...persons, { fname: 'Marko', lname: 'Milutinovic', address: '100 Coe Hill Dr.' }]);
        } else if (persons.length === 3) {
          setPersons([...persons, { fname: 'Mia', lname: 'Milutinovic', address: '100 Coe Hill Dr.' }]);
        }
        break;
      case 'complete':
        // val is the index of ToDo item in the ToDos array
        newToDos = [...todos];
        newToDos[val].isCompleted = !newToDos[val].isCompleted;
        break;
      case 'delete':
        // val is index of ToDo item in the ToDos array
        newToDos = [...todos];
        newToDos.splice(val, 1);
        break;
      default:
        break;
    }
    setTodos(newToDos);
  }
  // const handleAddToDo = text => {
  //   const newToDos = [...todos, { text }];
  //   setTodos(newToDos);
  // }

  // const handleComplete = index => {
  //   const newToDos = [...todos];

  //   newToDos[index].isCompleted = !newToDos[index].isCompleted;
  //   setTodos(newToDos);
  // };

  // const handleDeleteToDo = index => {
  //   const newToDos = [...todos];
  //   newToDos.splice(index, 1);
  //   setTodos(newToDos);
  // };

  useEffect(() => {
    // Update the document title using the browser API
    document.title = `${persons[last].fname}`;
  });
  return (
    <React.Fragment>
      <ReactVersion />
      {
        todos.map((todo, index) => (
          <Todo
            todo={todo}
            key={index}
            index={index}
            todoHandler={handleToDo}
          />
        ))
      }
      <TodoForm onAddToDo={handleToDo} value="Activate PRESTO card" />
      <div>Hello World! {todos[0].text}</div>
      <div>Click on person data to scroll to another</div>
      <div className="person" onClick={scrollPerson}>{persons[last].fname} {persons[last].lname} {persons[last].address}</div>
    </React.Fragment>
  );
}

export default App;
// <Person scrolling={scrollPerson} person={persons[x]} />