package ru.nagaevomaster.app;

import android.app.Application;
import android.text.TextUtils;
import ru.rustore.sdk.pushclient.RuStorePushClient;
import ru.rustore.sdk.pushclient.common.logger.DefaultLogger;

public class NagaevoMasterApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        initRuStorePush();
    }

    private void initRuStorePush() {
        String projectId = BuildConfig.RUSTORE_PUSH_PROJECT_ID;
        if (TextUtils.isEmpty(projectId)) {
            return;
        }

        try {
            RuStorePushClient.INSTANCE.init(
                this,
                projectId,
                new DefaultLogger()
            );
        } catch (Exception error) {
            android.util.Log.w("NagaevoMaster", "RuStore Push init skipped", error);
        }
    }
}
