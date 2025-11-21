import express, {type Express} from 'express';

const app :Express = express();
const PORT = process.env.PORT || '8080';

const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

app.get('/rolldice', (req, res) => {
    res.send(getRandomNumber(1,6).toString());
})

app.listen(PORT, () => {
    console.log(`Server is running on: ${PORT}`);
})

