/* src/App.js */
import React, { useEffect, useState } from 'react'
import Amplify, { API, graphqlOperation } from 'aws-amplify'
import { createTodo, deleteTodo } from './graphql/mutations'
import { listTodos, searchTodos } from './graphql/queries'
import plus from "./plus.png";
import search from "./search.png";

import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const initialState = { name: '', description: '' }

const App = () => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])
  const [isSearch, setSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tim, setTim] = useState(null);

  useEffect(() => {
    fetchTodos()
  }, [])

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos))
      const todos = todoData.data.listTodos.items
      setTodos(todos)
    } catch (err) { console.log('error fetching todos') }
  }

  async function searchTodoItems(searchString) {
    try {
      let searchResults = await API.graphql(graphqlOperation(searchTodos, {
          filter: {
            or: [
              {
                description: {
                  wildcard: `*${searchString}*`
              }},
              {
                name: {
                  wildcard: `*${searchString}*`
              }},
            ]
          }
      }));
      const todos = searchResults.data.searchTodos.items
      setTodos(todos)
    }
    catch(err) {
      console.log("error searching todos", err)
    }
    
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return
      const todo = { ...formState }
      let res = await API.graphql(graphqlOperation(createTodo, {input: todo}))
      setTodos([...todos, res.data.createTodo])
      setFormState(initialState)
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  async function removeTodo(todo) {
    try {
      await API.graphql(graphqlOperation(deleteTodo, {input: {
        id: todo.id
      }}));
      let newState = todos.filter(x => x.id !== todo.id);
      setTodos(newState);
    } catch (err) {
      console.log('error deleting todo:', err)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Amplify Todos<img alt='Search' onClick={() => {
        if(isSearch) {
          fetchTodos();
        }
        else {
          searchTodoItems(searchTerm);
        }
        setSearch(!isSearch);
      }} src={isSearch?plus:search} style={styles.titleIcon} /></h2>
      {isSearch?<>
        <input
          style={styles.input}
          onChange={(ev) => {
            if(tim) {
              clearTimeout(tim);
              setTim(null);
            }
            setSearchTerm(ev.target.value);
            setTim(setTimeout(() => {
              if(ev.target.value === '') {
                fetchTodos()
              }
              else {
                searchTodoItems(ev.target.value);
              }
              setTim(null);
            }, 500));
          }}
          value={searchTerm}
          placeholder="Search todo"
        />
      </>
      :
      <>
        <input
          onChange={event => setInput('name', event.target.value)}
          style={styles.input}
          value={formState.name}
          placeholder="Name"
        />
        <input
          onChange={event => setInput('description', event.target.value)}
          style={styles.input}
          value={formState.description}
          placeholder="Description"
        />
        <button style={styles.button} onClick={addTodo}>Create Todo</button>
      </>}
      {
        todos.map((todo, index) => (
          <div key={todo.id ? todo.id : index} style={styles.todo}>
            <p style={styles.todoName}>{todo.name}</p>
            <p style={styles.todoDescription}>{todo.description}</p>
            <button onClick={() => (removeTodo(todo))} style={styles.todoRemove}>Delete</button>
          </div>
        ))
      }
    </div>
  )
}

const styles = {
  container: { width: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 },
  title: { display: "flex", justifyContent: "space-between" },
  titleIcon: { width: 20, height: 20, cursor: "pointer" },
  todo: {  marginBottom: 15, position: "relative" },
  input: { border: 'none', backgroundColor: '#ddd', marginBottom: 10, padding: 8, fontSize: 18 },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  todoDescription: { marginBottom: 0 },
  todoRemove: { position: 'absolute', top: "24px", right: 0},
  button: { backgroundColor: 'black', color: 'white', outline: 'none', fontSize: 18, padding: '12px 0px' }
}

export default App