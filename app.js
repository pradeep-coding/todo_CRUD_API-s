const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/createTable/", async (require, response) => {
  const createTableQuery = `CREATE TABLE todo
                                (id INT,
                                todo VARCHAR(250),
                                priority VARCHAR(250),
                                status VARCHAR(250));`;
  await database.run(createTableQuery);
});

app.post("/insertTodo/", async (request, response) => {
  const insertTodoQuery = `INSERT INTO todo
                                (id, todo, priority, status)
                            VALUES 
                            (1,"Watch Movie","Low", "TO DO"),
                            (2,"Complete project","Low", "IN PROGRESS"),
                            (3,"Shopping","Low", "DONE"),
                            (4,"Watering Plants","MEDIUM", "DONE"),
                            (5,"Game","MEDIUM", "IN PROGRESS"),
                            (6,"Cricket Match","MEDIUM", "TO DO"),
                            (7,"Function","HIGH", "TO DO"),
                            (8,"Pending Task","HIGH", "IN PROGRESS"),
                            (9,"Workout","HIGH", "DONE");`;
  await database.run(insertTodoQuery);
});

const hasPriorityPropertyAndStatusProperty = (queryParam) => {
  return queryParam.status !== undefined && queryParam.priority !== undefined;
};

const hasPriorityProperty = (queryParam) => {
  return queryParam.priority !== undefined;
};

const hasStatusProperty = (queryParam) => {
  return queryParam.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = null;
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityPropertyAndStatusProperty(request.query):
      getTodoQuery = `SELECT *
                        FROM todo
                        WHERE todo LIKE '%${search_q}%'
                        AND priority = '${priority}' 
                        AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `SELECT *
                        FROM todo
                        WHERE todo LIKE '%${search_q}%'
                        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `SELECT *
                        FROM todo
                        WHERE todo LIKE '%${search_q}%' 
                        AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `SELECT *
                        FROM todo
                        WHERE todo LIKE '%${search_q}%'`;
  }
  data = await database.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `SELECT *
                    FROM todo
                    WHERE id = ${todoId};`;
  const todoArray = await database.get(getTodo);
  response.send(todoArray);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `INSERT INTO todo
                            (id,todo,priority,status)
                            VALUES (${id},'${todo}','${priority}','${status}');`;
  await database.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateStatus = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateStatus = "Status";
      break;
    case requestBody.priority !== undefined:
      updateStatus = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateStatus = "Todo";
      break;
  }

  const previousTodo = `SELECT *
                        FROM todo
                        WHERE id = ${todoId}`;
  const previousTodoItem = await database.get(previousTodo);

  const {
    todo = previousTodoItem.todo,
    priority = previousTodoItem.priority,
    status = previousTodoItem.status,
  } = request.body;
  const updateTodoQuery = `UPDATE todo
                        SET todo = '${todo}',
                            priority = '${priority}',
                            status = '${status}'
                        WHERE id = ${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateStatus} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
                                WHERE id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
