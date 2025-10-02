import express from "express";
import { loginOrSignUp, createProfile, redefinirSenha, getAllUsers } from "../controllers/userCtl.js";

const router = express.Router();

router.post('/login', loginOrSignUp);
router.post('/signup', createProfile);
router.get('/users', getAllUsers);
router.post('/redefinir-senha', redefinirSenha);

router.post('/process', (req, res) => {
    // The translated text from Python will be in `req.body.text`
    const receivedText = req.body.text;

    if (!receivedText) {
        return res.status(400).json({ error: 'No text provided in the request body.' });
    }

    // Log to the server console to show that we received the data
    console.log(`Received from Python: "${receivedText}"`);

    // --- YOUR LOGIC GOES HERE ---
    // You can process the text, interact with a database,
    // call another API, etc.
    // For this prototype, we'll just create a simple reply.
    const replyText = `Node.js processed your sentence: "${receivedText}"`;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    //console.log(now.toString());
    // Send a JSON response back to the Python script
    res.json({ reply: replyText + "  " + `${hours}:${minutes}:${seconds}` });
});

export default router;