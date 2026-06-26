package ru.nagaevomaster.app;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MessageNotify")
public class MessageNotifyPlugin extends Plugin {
    @PluginMethod
    public void show(PluginCall call) {
        String title = call.getString("title", "Новое сообщение");
        String body = call.getString("body", "");
        String messageId = call.getString("messageId", String.valueOf(System.currentTimeMillis()));
        String url = call.getString("url", "/profile?section=messages");

        getActivity().runOnUiThread(() -> {
            if (showNotification(title, body, messageId, url)) {
                call.resolve(new JSObject());
            } else {
                call.reject("notifications disabled");
            }
        });
    }

    private boolean showNotification(String title, String body, String messageId, String url) {
        android.content.Context context = getContext();

        NotificationManagerCompat manager = NotificationManagerCompat.from(context);
        if (!manager.areNotificationsEnabled()) {
            return false;
        }

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("pushUrl", url);

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pending = PendingIntent.getActivity(
            context,
            messageId.hashCode(),
            intent,
            pendingFlags
        );

        int iconRes = context.getApplicationInfo().icon;
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, MainActivity.PUSH_CHANNEL_ID)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setDefaults(NotificationCompat.DEFAULT_VIBRATE)
            .setAutoCancel(true)
            .setContentIntent(pending);

        NotificationManagerCompat.from(context).notify(messageId.hashCode(), builder.build());
        return true;
    }
}