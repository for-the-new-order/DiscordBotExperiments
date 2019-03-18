import { ChatCommandManager } from './src/commands/ChatCommandManager';
import * as express from 'express';
import { AddressInfo } from 'net';
import * as path from 'path';
import { Message, TextChannel, User } from 'discord.js';
import * as TypeMoq from 'typemoq';
import { IActionN } from 'typemoq/_all';
import { ChatterService, defaultChatterOptions, OutputType } from './src/commands/ChatterService';
import { EchoHelpService } from './src/commands/EchoHelpService';

const chatterOptions = defaultChatterOptions.mergeWith({ splitMessages: false });
const chatterService = new ChatterService(chatterOptions);
const echoHelpService = new EchoHelpService(
    new ChatterService(defaultChatterOptions.mergeWith({ splitMessages: false, outputType: OutputType.YAML }))
);
const chatCommandManager = new ChatCommandManager(chatterService, echoHelpService);

const app = express();
app.use(express.urlencoded());
const listener = app.listen(8888, function() {
    console.log('Listening on port ' + (listener.address() as AddressInfo).port);
});
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
app.post('/command', async function(req, res) {
    const chatCommand = req.body.chatCommand;
    let output = '';
    const messageMock = MakeMessage(chatCommand, chat => (output += chat));
    await chatCommandManager.Handle(messageMock.object);
    output = cleanMarkdownCodeBreak(output, OutputType.JSON);
    output = cleanMarkdownCodeBreak(output, OutputType.YAML);
    res.send(output);
});

function cleanMarkdownCodeBreak(output: string, type: OutputType) {
    const spacerString = '\n``````' + type.toLowerCase() + '\n';
    do {
        output = output.replace(spacerString, '');
    } while (output.indexOf(spacerString) > -1);
    return output;
}

function MakeMessage(chatCommand: string, callback: IActionN<string>): TypeMoq.IMock<Message> {
    const messageMock: TypeMoq.IMock<Message> = TypeMoq.Mock.ofType(Message);
    const userMock: TypeMoq.IMock<User> = TypeMoq.Mock.ofType(User);
    messageMock
        .setup(message => message.reply(TypeMoq.It.isAnyString()))
        .callback(callback)
        .returns(message => Promise.resolve(message));
    messageMock.object.author = userMock.object;
    messageMock.object.content = chatCommand;
    userMock.object.bot = false;
    return messageMock;
}
