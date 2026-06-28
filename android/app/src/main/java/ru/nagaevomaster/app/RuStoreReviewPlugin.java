package ru.nagaevomaster.app;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import ru.rustore.sdk.review.RuStoreReviewManager;
import ru.rustore.sdk.review.RuStoreReviewManagerFactory;
import ru.rustore.sdk.review.model.ReviewInfo;

@CapacitorPlugin(name = "RuStoreReview")
public class RuStoreReviewPlugin extends Plugin {
    private static final String TAG = "RuStoreReview";

    private RuStoreReviewManager reviewManager;
    private ReviewInfo cachedReviewInfo;

    @Override
    public void load() {
        ensureManager();
    }

    @PluginMethod
    public void init(PluginCall call) {
        ensureManager();
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void requestReviewFlow(PluginCall call) {
        if (reviewManager == null) {
            resolveNotRequested(call);
            return;
        }

        reviewManager
            .requestReviewFlow()
            .addOnSuccessListener(reviewInfo -> {
                cachedReviewInfo = reviewInfo;
                JSObject result = new JSObject();
                result.put("requested", true);
                call.resolve(result);
            })
            .addOnFailureListener(throwable -> {
                cachedReviewInfo = null;
                Log.d(TAG, "requestReviewFlow unavailable", throwable);
                resolveNotRequested(call);
            });
    }

    @PluginMethod
    public void launchReviewFlow(PluginCall call) {
        if (reviewManager == null || cachedReviewInfo == null) {
            call.resolve(new JSObject());
            return;
        }

        ReviewInfo reviewInfo = cachedReviewInfo;
        cachedReviewInfo = null;

        getActivity().runOnUiThread(() -> reviewManager
            .launchReviewFlow(reviewInfo)
            .addOnSuccessListener(unused -> call.resolve(new JSObject()))
            .addOnFailureListener(throwable -> {
                Log.d(TAG, "launchReviewFlow finished with error", throwable);
                call.resolve(new JSObject());
            }));
    }

    private void ensureManager() {
        if (reviewManager != null) {
            return;
        }
        reviewManager = RuStoreReviewManagerFactory.INSTANCE.create(getContext());
    }

    private void resolveNotRequested(PluginCall call) {
        JSObject result = new JSObject();
        result.put("requested", false);
        call.resolve(result);
    }
}
