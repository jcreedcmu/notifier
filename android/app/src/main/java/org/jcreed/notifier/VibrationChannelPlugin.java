package org.jcreed.notifier;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

@CapacitorPlugin(name = "VibrationChannel")
public class VibrationChannelPlugin extends Plugin {

    @PluginMethod
    public void createChannel(PluginCall call) {
        String id = call.getString("id", "default");
        String name = call.getString("name", "Default");
        int importance = call.getInt("importance", NotificationManager.IMPORTANCE_HIGH);

        long[] defaultPattern = new long[]{0, 500, 200, 150, 200, 500};
        long[] pattern = defaultPattern;

        JSArray patternArray = call.getArray("vibrationPattern");
        if (patternArray != null) {
            try {
                org.json.JSONArray arr = patternArray;
                pattern = new long[arr.length()];
                for (int i = 0; i < arr.length(); i++) {
                    pattern[i] = arr.getLong(i);
                }
            } catch (JSONException e) {
                // fall back to default pattern
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(id, name, importance);
            channel.enableVibration(true);
            channel.setVibrationPattern(pattern);

            NotificationManager manager = (NotificationManager)
                getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            manager.createNotificationChannel(channel);
        }

        call.resolve();
    }
}
