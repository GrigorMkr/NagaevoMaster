package ru.nagaevomaster.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;

final class MessageSoundPlayer {
    private static final Object LOCK = new Object();
    private static MediaPlayer player;
    private static long lastPlayedAt;

    private MessageSoundPlayer() {
    }

    static void play(Context context) {
        synchronized (LOCK) {
            long now = System.currentTimeMillis();
            if (now - lastPlayedAt < 800L) {
                return;
            }
            lastPlayedAt = now;

            releasePlayer();
            try {
                player = MediaPlayer.create(context.getApplicationContext(), R.raw.nagaevo_message);
                if (player == null) {
                    return;
                }
                player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
                player.setOnCompletionListener(mp -> releasePlayer());
                player.start();
            } catch (Exception ignored) {
                releasePlayer();
            }
        }
    }

    private static void releasePlayer() {
        if (player == null) {
            return;
        }
        try {
            if (player.isPlaying()) {
                player.stop();
            }
        } catch (Exception ignored) {
            // ignore
        }
        player.release();
        player = null;
    }
}
