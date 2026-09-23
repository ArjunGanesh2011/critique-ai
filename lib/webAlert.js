// react-native-web ships Alert.alert as an empty function. On the website
// every popup in the app did nothing: "Logged!" confirmations, error
// messages, and every "Are you sure?" question, so Reset all data, Delete
// workout and Clear plan could never run. This routes Alert.alert to the
// browser's own alert and confirm dialogs. Native builds keep the real Alert.

import { Alert, Platform } from 'react-native';

function webAlert(title, message, buttons) {
  const text = [title, message].filter(Boolean).join('\n\n');
  const list = buttons && buttons.length ? buttons : [{ text: 'OK' }];

  if (list.length === 1) {
    window.alert(text);
    if (list[0].onPress) list[0].onPress();
    return;
  }

  // Two or more choices become OK / Cancel. OK runs the main action: the
  // destructive button if there is one, otherwise the last button (the
  // native convention). Cancel runs the cancel-styled or first button.
  const cancel = list.find((b) => b.style === 'cancel') || list[0];
  const rest = list.filter((b) => b !== cancel);
  const main = rest.find((b) => b.style === 'destructive') || rest[rest.length - 1];
  if (window.confirm(text)) {
    if (main && main.onPress) main.onPress();
  } else if (cancel.onPress) {
    cancel.onPress();
  }
}

export function installWebAlert() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') Alert.alert = webAlert;
}
