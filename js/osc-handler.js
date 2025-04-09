import OSC from 'osc-js';

class OSCHandler {
    constructor(device) {
        this.device = device;
        this.osc = new OSC({
            plugin: new OSC.BridgePlugin({
                udpServer: {
                    host: 'localhost',
                    port: 57121,
                    exclusive: false
                },
                udpClient: {
                    host: 'localhost',
                    port: 57122
                }
            })
        });

        this.osc.on('*', (message) => {
            this.handleOSCMessage(message);
        });

        this.osc.open();
    }

    handleOSCMessage(message) {
        const address = message.address;
        const args = message.args;

        // Handle parameter changes
        if (address.startsWith('/parameter/')) {
            const paramName = address.split('/')[2];
            const value = args[0];
            const param = this.device.parameters.find(p => p.name === paramName);
            if (param) {
                param.value = value;
            }
        }
        // Handle MIDI notes
        else if (address === '/midi/note') {
            const note = args[0];
            const velocity = args[1] || 100;
            const duration = args[2] || 250;

            let midiChannel = 0;
            let midiPort = 0;

            // Note on message
            let noteOnMessage = [
                144 + midiChannel, // Note on
                note,
                velocity
            ];

            // Note off message
            let noteOffMessage = [
                128 + midiChannel, // Note off
                note,
                0
            ];

            let noteOnEvent = new RNBO.MIDIEvent(
                this.device.context.currentTime * 1000,
                midiPort,
                noteOnMessage
            );

            let noteOffEvent = new RNBO.MIDIEvent(
                this.device.context.currentTime * 1000 + duration,
                midiPort,
                noteOffMessage
            );

            this.device.scheduleEvent(noteOnEvent);
            this.device.scheduleEvent(noteOffEvent);
        }
    }
}

export default OSCHandler; 