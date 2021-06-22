const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Task = require('../models/task');

router.post('/tasks', auth, async (request, respond) => {
    // const task = new Task(request.body);
    const task = new Task({
        ...request.body,
        owner: request.user._id
    });

    try {
        await task.save();
        respond.status(201).send(task);
    } catch (error) {
        respond.status(400).send(error);
    }
});

// ?completed=boolean
// ?limit=number
// ?skip=number
// ?sortBy=string
router.get('/tasks', auth, async (request, respond) => {
    const match = {};
    const sort = {};

    if (request.query.completed) {
        match.completed = request.query.completed.toLowerCase() === 'true';
    }

    if (request.query.sortBy) {
        const parts = request.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'asc' ? 1 : -1;
    }

    try {
        // const tasks = await Task.find({ owner: request.user._id });
        await request.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(request.query.limit),
                skip: parseInt(request.query.skip),
                sort
            }
        }).execPopulate();

        respond.send(request.user.tasks);
    } catch (error) {
        respond.status(400).send(error);
    }
});

router.get('/tasks/:id', auth, async (request, respond) => {
    const _id = request.params.id;

    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({ _id, owner: request.user._id });

        if (!task) {
            return respond.status(404).send();
        }

        respond.send(task);
    } catch (error) {
        respond.status(500).send(error);
    }
});

router.patch('/tasks/:id', auth, async (request, respond) => {
    const updates = Object.keys(request.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return respond.status(400).send({ error: 'Invalid properties to update!' });
    }

    try {
        // const task = await Task.findByIdAndUpdate(
        //     request.params.id,
        //     request.body,
        //     {
        //         new: true,
        //         runValidators: true
        //     }
        // );

        // const task = await Task.findById(request.params.id);
        const task = await Task.findOne({ _id: request.params.id, owner: request.user._id });

        if (!task) {
            return respond.status(404).send();
        }

        updates.forEach((update) => task[update] = request.body[update]);
        await task.save();

        respond.send(task);
    } catch (error) {
        respond.status(400).send(error);
    }
});

router.delete('/tasks/:id', auth, async (request, respond) => {
    try {
        // const task = await Task.findByIdAndDelete(request.params.id);
        const task = await Task.findOneAndDelete({ _id: request.params.id, owner: request.user._id });

        if (!task) {
            return respond.status(404).send();
        }

        respond.send(task);
    } catch (error) {
        respond.status(500).send(error);
    }
});

module.exports = router;
