const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const router = express.Router();

const auth = require('../middleware/auth');
const User = require('../models/user');

router.post('/users/login', async (request, respond) => {
    try {
        const user = await User.findByCredentials(request.body.email, request.body.password);
        const token = await user.generateAuthToken();
        respond.send({ user, token });
    } catch (error) {
        respond.status(400).send(error);
    }
});

router.post('/users/logout', auth, async (request, respond) => {
    try {
        request.user.tokens = request.user.tokens.filter((token) => token.token !== request.token);
        await request.user.save();

        respond.send();
    } catch (error) {
        respond.status(500).send(error);
    }
});

router.post('/users/logoutAll', auth, async (request, respond) => {
    try {
        request.user.tokens = [];
        await request.user.save();
        
        respond.send();
    } catch (error) {
        respond.status(500).send(error);
    }
});

router.post('/users', async (request, respond) => {
    const user = new User(request.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();
        respond.status(201).send({ user, token });
    } catch (error) {
        respond.status(400).send(error);
    }
});

router.get('/users', auth, async (request, respond) => {
    try {
        const users = await User.find({});
        respond.send(users);
    } catch (error) {
        respond.status(500).send(error);
    }
});

router.get('/users/me', auth, async (request, respond) => {
    respond.send(request.user);
});

router.get('/users/:id', async (request, respond) => {
    const _id = request.params.id;

    try {
        const user = await User.findById(_id);

        if (!user) {
            return respond.status(401).send();
        }

        respond.send(user);
    } catch (error) {
        respond.status(500).send(error)
    }
});

router.patch('/users/me', auth, async (request, respond) => {
    const updates = Object.keys(request.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return respond.status(400).send({ error: 'Invalid properties to update!' });
    }

    try {
        updates.forEach((update) => request.user[update] = request.body[update]);
        await request.user.save();

        respond.send(request.user);
    } catch (error) {
        respond.status(400).send(error);
    }
});

router.patch('/users/:id', async (request, respond) => {
    const updates = Object.keys(request.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return respond.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        // const user = await User.findByIdAndUpdate(
        //     request.params.id,
        //     request.body,
        //     {
        //         new: true,
        //         runValidators: true
        //     }
        // );

        const user = await User.findById(request.params.id);

        if (!user) {
            return respond.status(404).send();
        }

        updates.forEach((update) => user[update] = request.body[update]);

        await user.save();

        respond.send(user);
    } catch (error) {
        respond.status(400).send(error);
    }
});

router.delete('/users/me', auth, async (request, respond) => {
    try {
        // const user = await User.findByIdAndDelete(request.user.id);

        // if (!user) {
        //     return respond.status(404).send();
        // }

        await request.user.remove();
        respond.send(request.user);
    } catch (error) {
        respond.status(500).send(error);
    }
});

router.delete('/users/:id', async (request, respond) => {
    try {
        const user = await User.findByIdAndDelete(request.params.id);

        if (!user) {
            return respond.status(404).send();
        }

        respond.send(user);
    } catch (error) {
        respond.status(500).send(error);
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(request, file, callback) {
        // if (!file.originalname.endsWith('.pdf')) {
        //     return callback(new Error('Please upload a PDF!'));
        // }

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload a valid image!'));
        }

        callback(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (request, respond) => {
    const buffer = await sharp(request.file.buffer).resize({ width: 50, height: 50 }).png().toBuffer();
    request.user.avatar = buffer;

    await request.user.save();

    respond.send();
}), (error, request, respond, next) => {
    respond.status(400).send({ error: error.message });
};

router.delete('/users/me/avatar', auth, async (request, respond) => {
    request.user.avatar = undefined;
    await request.user.save();

    respond.send();
});

router.get('/users/:id/avatar', async (request, respond) => {
    try {
        const user = await User.findById(request.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        respond.set('Content-Type', 'image/png');
        respond.send(user.avatar);
    } catch (error) {
        respond.status(404).send(error);
    }
});

module.exports = router;
