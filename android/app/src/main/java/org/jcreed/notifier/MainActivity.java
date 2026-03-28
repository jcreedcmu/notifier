package org.jcreed.notifier;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(VibrationChannelPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
