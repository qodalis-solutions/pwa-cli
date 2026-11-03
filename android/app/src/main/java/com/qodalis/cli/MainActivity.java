package com.qodalis.cli;

import android.graphics.Color;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Android 15+ always draws the app behind the system bars; earlier versions
        // only when asked. Capacitor's SystemBars reports the bar heights as
        // --safe-area-inset-* either way, so without this the app kept above the
        // navigation bar and padded by its height again (Android 14, Xiaomi 12X).
        // Transparent bars show the terminal colour behind them.
        // Called after super.onCreate: the window must have left the launch theme.
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this, SystemBarStyle.dark(Color.TRANSPARENT), SystemBarStyle.dark(Color.TRANSPARENT));
    }
}
