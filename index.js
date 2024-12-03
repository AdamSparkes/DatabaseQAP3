const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Database connection configuration
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres', 
    password: 'Creature1.', 
    database: 'QAPDB3', 
});

app.use(express.json());

// Create the tasks table if it doesn't exist
const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                description TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('complete', 'incomplete'))
            );
        `);
        console.log('Tasks table is ready');
    } catch (error) {
        console.error('Error, failed to create table:', error);
    }
};
createTable();

// GET /tasks - Get all tasks
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error fetching tasks' });
    }
});

// POST /tasks - Add a new task
app.post('/tasks', async (req, res) => {
    const { description, status } = req.body;

    // Validation
    if (!description || !status || !['complete', 'incomplete'].includes(status)) {
        return res.status(400).json({ error: 'Invalid input. Valid status and a description require, try again.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *',
            [description, status]
        );
        res.status(201).json({ message: 'Task added successfully', task: result.rows[0] });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ error: 'Error adding task' });
    }
});

// PUT /tasks/:id - Update a task's status
app.put('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status || !['complete', 'incomplete'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "complete" or "incomplete".' });
    }

    try {
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully', task: result.rows[0] });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Error updating task' });
    }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);

    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted!', task: result.rows[0] });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Error deleting task' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});