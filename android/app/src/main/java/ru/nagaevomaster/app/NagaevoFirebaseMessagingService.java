package ru.nagaevomaster.app;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import ru.rustore.sdk.universalpush.ConstantsKt;
import ru.rustore.sdk.universalpush.RuStoreUniversalPushManager;
import ru.rustore.sdk.universalpush.firebase.messaging.RemoteMessageExtensionKt;

public class NagaevoFirebaseMessagingService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);
        RuStoreUniversalPushManager.INSTANCE.processMessage(
            RemoteMessageExtensionKt.toUniversalRemoteMessage(message)
        );
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        RuStoreUniversalPushManager.INSTANCE.processToken(ConstantsKt.UNIVERSAL_FCM_PROVIDER, token);
    }

    @Override
    public void onDeletedMessages() {
        super.onDeletedMessages();
        RuStoreUniversalPushManager.INSTANCE.processDeletedMessages(ConstantsKt.UNIVERSAL_FCM_PROVIDER);
    }
}
