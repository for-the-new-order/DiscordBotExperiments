import { Message } from 'discord.js';
import { GenerateCommand } from './generate-command';
import { ChatCommand } from './ChatCommand';
import { CommandArgs } from './CommandArgs';
import { HelpText } from './HelpText';

export class ChatCommandManager {
    private trigger = 'ogbot';
    private commands: Array<ChatCommand>;
    constructor() {
        this.commands = new Array<ChatCommand>(
            new GenerateCommand(),
            //
            // Default (echo help)
            new DefaultChatCommand(this.echoHelp)
        );
    }

    public Handle(message: Message): void {
        const args = message.content.substring(1).split(' ');
        if (args.length == 0) {
            return;
        }
        if (args.length == 1) {
            if (args[0] === this.trigger) {
                this.echoHelp(message);
            }
            return;
        }

        const commandArgs = {
            trigger: args[0].toLowerCase(),
            command: args[1].toLowerCase(),
            arguments: args.splice(2)
        };
        if (commandArgs.trigger !== this.trigger) {
            this.echoHelp(message);
            return;
        }

        for (let i = 0; i < this.commands.length; i++) {
            const command = this.commands[i];
            if (command.canHandle(commandArgs)) {
                command.handle(message, commandArgs);
                break;
            }
        }
    }
    private echoHelp(message: Message) {
        message.reply(
            "Something went wrong; I may add some help some day... Stay tuned lol (or don't be wrong)"
        );
    }
}

class DefaultChatCommand implements ChatCommand {
    constructor(private callback: (message: Message) => void) {}
    public handle(message: Message, commandArgs: CommandArgs) {
        this.callback(message);
    }
    public canHandle(commandArgs: CommandArgs): boolean {
        return true;
    }
    public help(): HelpText {
        return {
            command: 'anything',
            description: 'Show the current help text.'
        };
    }
}
