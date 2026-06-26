package ru.nagaevomaster.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String PUSH_CHANNEL_ID = "nagaevo_messages";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MessageSoundPlugin.class);
        registerPlugin(MessageNotifyPlugin.class);
        super.onCreate(savedInstanceState);
        registerPushChannel();
    }

    @Override
    public void onResume() {
        super.onResume();
        handlePushUrlIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handlePushUrlIntent(intent);
    }

    private void handlePushUrlIntent(Intent intent) {
        if (intent == null) {
            return;
        }
        String pushUrl = intent.getStringExtra("pushUrl");
        if (pushUrl == null || pushUrl.isEmpty()) {
            return;
        }
        intent.removeExtra("pushUrl");
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        getBridge().getWebView().post(() -> {
            String target = pushUrl.startsWith("/") ? pushUrl : ("/" + pushUrl);
            String js = "window.history.pushState(window.history.state, '', '"
                + target.replace("'", "\\'")
                + "');window.dispatchEvent(new PopStateEvent('popstate'));";
            getBridge().getWebView().evaluateJavascript(js, null);
        });
    }

    private void registerPushChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
            PUSH_CHANNEL_ID,
            "Сообщения",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Новые сообщения в переписке");
        channel.enableVibration(true);

        int soundResId = getResources().getIdentifier("nagaevo_message", "raw", getPackageName());
        if (soundResId != 0) {
            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + soundResId);
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(soundUri, attrs);
        }

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }
}
