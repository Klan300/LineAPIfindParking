require('dotenv').config()
const configuration = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
}

const axios = require('axios')
const app = require('express')()
const line = require('@line/bot-sdk')
const client = new line.Client(configuration)

app.get('/', async function(req, res){
    res.status(200).send('Chatbot Tutorial')
})


async function getUpdateSlot(){
    let returnStatus = ``
    let result = await axios.get('https://findparking-api-dev.azurewebsites.net/floorstatus/HRH')
    result.data.forEach(data => {
        let floor = `${data.floor} : ${data.isAvailable == 1 ? "Available": "Investigate"}\n`
        returnStatus += floor
    }
    );

    return returnStatus
}

app.post('/event', line.middleware(configuration), async function(req, res){
    try {
        let returnStatus;
        req.body.events.map( async event => {
        if(event.message.text === 'status'){
            returnStatus = await getUpdateSlot()
            client.replyMessage(event.replyToken, {type: 'text', text: returnStatus}, false)
        } else {
            let action = event.message.text.split(' ')[0].toLowerCase()
            let floor = event.message.text.split(' ')[1]
            if (action === 'open') {
                returnStatus = await getUpdateSlot()
                let result = await axios.put('https://findparking-api-dev.azurewebsites.net/newUpdatefloorstatus', {
                    'floor' : floor.toUpperCase(),
                    'status': '1'
                })
                console.log(result)
                client.replyMessage(event.replyToken, {type: 'text', text: returnStatus}, false)
            } else if (action === 'close') {
                returnStatus = await getUpdateSlot()
                let result = await axios.put('https://findparking-api-dev.azurewebsites.net/newUpdatefloorstatus', {
                    'floor' : floor.toUpperCase(),
                    'status': '0'
                })
                console.log(result)
                client.replyMessage(event.replyToken, {type: 'text', text: returnStatus}, false)
                    }
                }
            }
        )
        res.status(200).send('Chatbot Tutorial')  
    } catch (error) {
        console.log(error)
        client.replyMessage(event.replyToken, {type: 'text', text: 'wrong message'}, false)
    }
})

console.log('app start at port', process.env.PORT)
app.listen(process.env.PORT)