package ru.nagaevomaster.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MessageSound")
public class MessageSoundPlugin extends Plugin {
    @PluginMethod
    public void play(PluginCall call) {
        getActivity().runOnUiThread(() -> MessageSoundPlayer.play(getContext()));
        call.resolve(new JSObject());
    }
}
