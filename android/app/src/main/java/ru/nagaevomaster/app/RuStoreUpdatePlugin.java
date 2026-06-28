package ru.nagaevomaster.app;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import ru.rustore.sdk.appupdate.listener.InstallStateUpdateListener;
import ru.rustore.sdk.appupdate.manager.RuStoreAppUpdateManager;
import ru.rustore.sdk.appupdate.manager.factory.RuStoreAppUpdateManagerFactory;
import ru.rustore.sdk.appupdate.model.AppUpdateInfo;
import ru.rustore.sdk.appupdate.model.AppUpdateOptions;
import ru.rustore.sdk.appupdate.model.AppUpdateType;
import ru.rustore.sdk.appupdate.model.InstallState;

@CapacitorPlugin(name = "RuStoreUpdate")
public class RuStoreUpdatePlugin extends Plugin {
    private static final String TAG = "RuStoreUpdate";
    private static final String EVENT_INSTALL_STATE = "installStateUpdate";

    private RuStoreAppUpdateManager updateManager;
    private AppUpdateInfo cachedAppUpdateInfo;
    private InstallStateUpdateListener installListener;

    @Override
    public void load() {
        ensureManager();
    }

    @Override
    protected void handleOnDestroy() {
        if (updateManager != null && installListener != null) {
            updateManager.unregisterListener(installListener);
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void init(PluginCall call) {
        ensureManager();
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void getAppUpdateInfo(PluginCall call) {
        if (updateManager == null) {
            call.reject("RuStore update manager is not initialized");
            return;
        }

        updateManager
            .getAppUpdateInfo()
            .addOnSuccessListener(appUpdateInfo -> {
                cachedAppUpdateInfo = appUpdateInfo;
                call.resolve(toAppUpdateInfoObject(appUpdateInfo));
            })
            .addOnFailureListener(throwable -> {
                Log.w(TAG, "getAppUpdateInfo failed", throwable);
                call.reject(throwable.getMessage() == null ? "getAppUpdateInfo failed" : throwable.getMessage());
            });
    }

    @PluginMethod
    public void download(PluginCall call) {
        startUpdateFlow(call, AppUpdateType.FLEXIBLE);
    }

    @PluginMethod
    public void immediate(PluginCall call) {
        startUpdateFlow(call, AppUpdateType.IMMEDIATE);
    }

    @PluginMethod
    public void silent(PluginCall call) {
        startUpdateFlow(call, AppUpdateType.SILENT);
    }

    @PluginMethod
    public void completeUpdate(PluginCall call) {
        if (updateManager == null) {
            call.reject("RuStore update manager is not initialized");
            return;
        }

        Integer type = call.getInt("type", AppUpdateType.FLEXIBLE);
        if (type == null) {
            type = AppUpdateType.FLEXIBLE;
        }
        if (type != AppUpdateType.FLEXIBLE && type != AppUpdateType.SILENT) {
            call.reject("completeUpdate supports only FLEXIBLE and SILENT update types");
            return;
        }

        int updateType = type;
        getActivity().runOnUiThread(() -> updateManager
            .completeUpdate(new AppUpdateOptions.Builder().appUpdateType(updateType).build())
            .addOnSuccessListener(unused -> call.resolve(new JSObject()))
            .addOnFailureListener(throwable -> {
                Log.w(TAG, "completeUpdate failed", throwable);
                call.reject(throwable.getMessage() == null ? "completeUpdate failed" : throwable.getMessage());
            }));
    }

    private void ensureManager() {
        if (updateManager != null) {
            return;
        }

        updateManager = RuStoreAppUpdateManagerFactory.INSTANCE.create(getContext());
        installListener = this::emitInstallState;
        updateManager.registerListener(installListener);
    }

    private void startUpdateFlow(PluginCall call, int updateType) {
        if (updateManager == null) {
            call.reject("RuStore update manager is not initialized");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (cachedAppUpdateInfo == null) {
                updateManager
                    .getAppUpdateInfo()
                    .addOnSuccessListener(appUpdateInfo -> {
                        cachedAppUpdateInfo = appUpdateInfo;
                        launchUpdateFlow(call, updateType, appUpdateInfo);
                    })
                    .addOnFailureListener(throwable -> {
                        Log.w(TAG, "getAppUpdateInfo before startUpdateFlow failed", throwable);
                        call.reject(throwable.getMessage() == null ? "getAppUpdateInfo failed" : throwable.getMessage());
                    });
                return;
            }

            launchUpdateFlow(call, updateType, cachedAppUpdateInfo);
        });
    }

    private void launchUpdateFlow(PluginCall call, int updateType, AppUpdateInfo appUpdateInfo) {
        AppUpdateOptions options = updateType == AppUpdateType.FLEXIBLE
            ? new AppUpdateOptions.Builder().build()
            : new AppUpdateOptions.Builder().appUpdateType(updateType).build();

        updateManager
            .startUpdateFlow(appUpdateInfo, options)
            .addOnSuccessListener(resultCode -> {
                cachedAppUpdateInfo = null;
                JSObject result = new JSObject();
                result.put("resultCode", resultCode);
                call.resolve(result);
            })
            .addOnFailureListener(throwable -> {
                cachedAppUpdateInfo = null;
                Log.w(TAG, "startUpdateFlow failed", throwable);
                call.reject(throwable.getMessage() == null ? "startUpdateFlow failed" : throwable.getMessage());
            });
    }

    private void emitInstallState(InstallState state) {
        JSObject payload = new JSObject();
        payload.put("installStatus", state.getInstallStatus());
        payload.put("bytesDownloaded", state.getBytesDownloaded());
        payload.put("totalBytesToDownload", state.getTotalBytesToDownload());
        payload.put("installErrorCode", state.getInstallErrorCode());
        notifyListeners(EVENT_INSTALL_STATE, payload);
    }

    private JSObject toAppUpdateInfoObject(AppUpdateInfo info) {
        JSObject payload = new JSObject();
        payload.put("updateAvailability", info.getUpdateAvailability());
        payload.put("installStatus", info.getInstallStatus());
        payload.put("availableVersionCode", info.getAvailableVersionCode());
        payload.put("immediateUpdateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
        payload.put("flexibleUpdateAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE));
        payload.put("silentUpdateAllowed", info.isUpdateTypeAllowed(AppUpdateType.SILENT));
        return payload;
    }
}
