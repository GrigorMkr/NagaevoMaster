import { registerPlugin } from '@capacitor/core';

interface MessageSoundPlugin {
  play(): Promise<void>;
}

const MessageSound = registerPlugin<MessageSoundPlugin>('MessageSound');

export {
  MessageSound,
};
