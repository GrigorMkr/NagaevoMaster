package ru.nagaevomaster.app;

import android.app.Application;
import android.util.Log;
import ru.rustore.sdk.pushclient.common.logger.DefaultLogger;
import ru.rustore.sdk.universalpush.RuStoreUniversalPushClient;
import ru.rustore.sdk.universalpush.firebase.provides.FirebasePushProvider;
import ru.rustore.sdk.universalpush.rustore.providers.RuStorePushProvider;

public class NagaevoMasterApplication extends Application {
    private static final String TAG = "NagaevoUniversalPush";

    @Override
    public void onCreate() {
        super.onCreate();
        initUniversalPush();
    }

    private void initUniversalPush() {
        String projectId = BuildConfig.RUSTORE_PUSH_PROJECT_ID;
        RuStorePushProvider rustoreProvider = null;

        if (projectId != null && !projectId.isBlank()) {
            rustoreProvider = new RuStorePushProvider(
                this,
                projectId,
                new DefaultLogger(TAG)
            );
        }

        RuStoreUniversalPushClient client = RuStoreUniversalPushClient.INSTANCE;
        client.init(this, rustoreProvider, new FirebasePushProvider(this), null);

        client.setOnMessageReceiveListener(
            remoteMessage -> RuStorePushPlugin.dispatchMessageReceived(remoteMessage)
        );

        client.setOnNewTokenListener(
            (providerType, token) -> RuStorePushPlugin.dispatchNewToken(providerType, token)
        );

        client.setOnDeletedMessagesListener(
            providerType -> RuStorePushPlugin.dispatchDeletedMessages(providerType)
        );

        client.setOnPushClientErrorListener(
            (providerType, errors) -> RuStorePushPlugin.dispatchError(providerType, errors)
        );

        Log.d(
            TAG,
            "Universal Push initialized"
                + (rustoreProvider != null ? " (RuStore + FCM)" : " (FCM only)")
        );
    }
}
