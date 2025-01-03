import { Component } from '@angular/core';
import { CliLogLevel, CliOptions } from '@qodalis/cli-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent {
  options: CliOptions = {
    logLevel: CliLogLevel.ERROR,
    welcomeMessage: {
      show: 'daily',
    },
    usersModule: {
      enabled: true,
      hideUserName: false,
    },
    terminalOptions: {
      fontSize: 12, // Smaller font for mobile screens
      lineHeight: 1.2,
      allowTransparency: true,
    },
  };

  title = 'pwa-cli';
}
