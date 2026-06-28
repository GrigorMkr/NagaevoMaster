package ru.nagaevomaster.app;

import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;
import java.util.Map;
import ru.rustore.sdk.universalpush.ConstantsKt;
import ru.rustore.sdk.universalpush.RuStoreUniversalPushClient;
import ru.rustore.sdk.universalpush.domain.model.UniversalNotification;
import ru.rustore.sdk.universalpush.domain.model.UniversalRemoteMessage;

@CapacitorPlugin(name = "RuStorePush")
public class RuStorePushPlugin extends Plugin {
    private static final String TAG = "RuStorePush";
    private static final String EVENT_NEW_TOKEN = "ON_NEW_TOKEN";
    private static final String EVENT_MESSAGE_RECEIVED = "ON_MESSAGE_RECEIVED";
    private static final String EVENT_DELETED_MESSAGES = "ON_DELETED_MESSAGES";
    private static final String EVENT_ERROR = "ON_ERROR";

    private static RuStorePushPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @PluginMethod
    public void checkPushAvailability(PluginCall call) {
        RuStoreUniversalPushClient.INSTANCE
            .checkAvailability(getContext())
            .addOnSuccessListener(result -> {
                boolean rustoreAvailable = Boolean.TRUE.equals(result.get(ConstantsKt.UNIVERSAL_RUSTORE_PROVIDER));
                boolean firebaseAvailable = Boolean.TRUE.equals(result.get(ConstantsKt.UNIVERSAL_FCM_PROVIDER));
                JSObject payload = new JSObject();
                payload.put("rustore", rustoreAvailable);
                payload.put("firebase", firebaseAvailable);
                payload.put("available", rustoreAvailable || firebaseAvailable);
                call.resolve(payload);
            })
            .addOnFailureListener(throwable -> {
                Log.d(TAG, "checkAvailability failed", throwable);
                JSObject payload = new JSObject();
                payload.put("available", false);
                payload.put("rustore", false);
                payload.put("firebase", false);
                if (throwable.getMessage() != null) {
                    payload.put("reason", throwable.getMessage());
                }
                call.resolve(payload);
            });
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        RuStoreUniversalPushClient.INSTANCE
            .getTokens()
            .addOnSuccessListener(tokens -> {
                String rustoreToken = tokens.get(ConstantsKt.UNIVERSAL_RUSTORE_PROVIDER);
                String fcmToken = tokens.get(ConstantsKt.UNIVERSAL_FCM_PROVIDER);
                String primary = rustoreToken != null && !rustoreToken.isBlank()
                    ? rustoreToken
                    : fcmToken;

                JSObject payload = new JSObject();
                payload.put("token", primary == null ? "" : primary);
                payload.put("rustore", rustoreToken == null ? "" : rustoreToken);
                payload.put("firebase", fcmToken == null ? "" : fcmToken);
                call.resolve(payload);
            })
            .addOnFailureListener(throwable -> {
                Log.d(TAG, "getTokens failed", throwable);
                call.reject(throwable.getMessage() == null ? "getTokens failed" : throwable.getMessage());
            });
    }

    @PluginMethod
    public void deleteToken(PluginCall call) {
        RuStoreUniversalPushClient.INSTANCE
            .getTokens()
            .addOnSuccessListener(tokens -> {
                if (tokens.isEmpty()) {
                    call.resolve(new JSObject());
                    return;
                }

                RuStoreUniversalPushClient.INSTANCE
                    .deleteTokens(tokens)
                    .addOnSuccessListener(unused -> call.resolve(new JSObject()))
                    .addOnFailureListener(throwable -> {
                        Log.d(TAG, "deleteTokens failed", throwable);
                        call.reject(throwable.getMessage() == null ? "deleteTokens failed" : throwable.getMessage());
                    });
            })
            .addOnFailureListener(throwable -> {
                Log.d(TAG, "getTokens before delete failed", throwable);
                call.resolve(new JSObject());
            });
    }

    @PluginMethod
    public void subscribeToTopic(PluginCall call) {
        String topic = call.getString("topic");
        if (topic == null || topic.isBlank()) {
            call.reject("topic is required");
            return;
        }

        try {
            RuStoreUniversalPushClient.INSTANCE.subscribeToTopic(topic);
            call.resolve(new JSObject());
        } catch (Throwable throwable) {
            Log.d(TAG, "subscribeToTopic failed", throwable);
            call.reject(throwable.getMessage() == null ? "subscribeToTopic failed" : throwable.getMessage());
        }
    }

    @PluginMethod
    public void unsubscribeFromTopic(PluginCall call) {
        String topic = call.getString("topic");
        if (topic == null || topic.isBlank()) {
            call.reject("topic is required");
            return;
        }

        try {
            RuStoreUniversalPushClient.INSTANCE.unsubscribeFromTopic(topic);
            call.resolve(new JSObject());
        } catch (Throwable throwable) {
            Log.d(TAG, "unsubscribeFromTopic failed", throwable);
            call.reject(throwable.getMessage() == null ? "unsubscribeFromTopic failed" : throwable.getMessage());
        }
    }

    static void dispatchNewToken(String providerType, String token) {
        if (instance == null) {
            return;
        }
        instance.notifyListeners(
            EVENT_NEW_TOKEN,
            new JSObject()
                .put("token", token)
                .put("provider", providerType)
        );
    }

    static void dispatchMessageReceived(UniversalRemoteMessage message) {
        if (instance == null) {
            return;
        }
        instance.notifyListeners(EVENT_MESSAGE_RECEIVED, toRemoteMessageObject(message));
    }

    static void dispatchDeletedMessages(String providerType) {
        if (instance == null) {
            return;
        }
        instance.notifyListeners(EVENT_DELETED_MESSAGES, new JSObject().put("provider", providerType));
    }

    static void dispatchError(String providerType, List<? extends Throwable> errors) {
        if (instance == null || errors == null || errors.isEmpty()) {
            return;
        }
        JSArray array = new JSArray();
        for (Throwable error : errors) {
            array.put(error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
        }
        instance.notifyListeners(
            EVENT_ERROR,
            new JSObject().put("errors", array).put("provider", providerType)
        );
    }

    private static JSObject toRemoteMessageObject(UniversalRemoteMessage message) {
        JSObject payload = new JSObject();
        payload.put("messageId", message.getMessageId());
        payload.put("from", message.getFrom());
        payload.put("collapseKey", message.getCollapseKey());
        payload.put("ttl", message.getTtl());
        payload.put("priority", message.getPriority());

        JSObject data = new JSObject();
        Map<String, String> messageData = message.getData();
        if (messageData != null) {
            for (Map.Entry<String, String> entry : messageData.entrySet()) {
                data.put(entry.getKey(), entry.getValue());
            }
        }
        payload.put("data", data);

        UniversalNotification notification = message.getNotification();
        if (notification != null) {
            JSObject notificationObject = new JSObject();
            notificationObject.put("title", notification.getTitle());
            notificationObject.put("body", notification.getBody());
            notificationObject.put("channelId", notification.getChannelId());
            notificationObject.put("color", notification.getColor());
            notificationObject.put("icon", notification.getIcon());
            notificationObject.put("clickAction", notification.getClickAction());
            if (notification.getImage() != null) {
                notificationObject.put("imageUrl", notification.getImage());
            }
            payload.put("notification", notificationObject);
        }

        return payload;
    }
}
