
/**
   * Window
   * A basic window that wraps a native HTML window. Provides more fine-grained control over the window state such as the ability to minimize,
   * maximize, restore, etc. By default a window does not show upon instantiation; instead the window's show() method must be invoked manually.
   * The new window appears in the same process as the parent window.
   */
class Window implements FinWindow {
  constructor() {
    const { uuid, windowName } = FSBL.Clients.WindowClient.getWindowIdentifier()
    this.uuid = uuid;
    this.name = windowName;
  }
  /**
   * uuid of the application that the window belongs to.
   */
  uuid: string | undefined;
  /**
   * Name of window
   */
  name: string;
  /**
   * Returns the native JavaScript "window" object for the window. This method can only be used by the parent application or the window itself,
   * otherwise it will return undefined. The same Single-Origin-Policy (SOP) rules apply for child windows created by window.open(url) in that the
   * contents of the window object are only accessible if the URL has the same origin as the invoking window. See example below.
   * Also, will not work with fin.desktop.Window objects created with fin.desktop.Window.wrap().
   * @returns Native window
   */
  getNativeWindow(): Window;
  /**
   * Gets the parent application.
   * @returns Parent application
   */
  getParentApplication(): OpenFinApplication;
  /**
   * Gets the parent window.
   */
  getParentWindow(): OpenFinWindow;
  /**
   * Registers an event listener on the specified event.
   */
  addEventListener(
    type: OpenFinWindowEventType,
    listener: (event: WindowBaseEvent
      | WindowAuthRequestedEvent
      | WindowBoundsEvent
      | WindowExternalProcessStartedEvent
      | WindowExternalProcessExited
      | WindowGroupChangedEvent
      | WindowHiddenEvent
      | Window_NavigationRejectedEvent) => void,
    callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Performs the specified window transitions
   */
  animate(transitions: Transition, options: TransitionOptions, callback?: (event: any) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Provides credentials to authentication requests
   */
  authenticate(userName: string, password: string, callback?: () => void, errorCallback?: (reason: string, error: ErrorInfo) => void): void;
  /**
   * Removes focus from the window.
   */
  blur(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Brings the window to the front of the OpenFin window stack.
   */
  bringToFront(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Closes the window.
   * @param Close will be prevented from closing when force is false and 'close-requested' has been subscribed to for application's main window.
   */
  close(force?: boolean, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Executes Javascript on the window, restricted to windows you own or windows owned by applications you have created.
   * @param code JavaScript code to be executed on the window.
   */
  executeJavaScript(code: string, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Prevents a user from changing a window's size/position when using the window's frame.
   * 'disabled-frame-bounds-changing' is generated at the start of and during a user move/size operation.
   * 'disabled-frame-bounds-changed' is generated after a user move/size operation.
   * The events provide the bounds that would have been applied if the frame was enabled.
   * 'frame-disabled' is generated when an enabled frame becomes disabled.
   */
  disableFrame(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Re-enables user changes to a window's size/position when using the window's frame.
   * 'disabled-frame-bounds-changing' is generated at the start of and during a user move/size operation.
   * 'disabled-frame-bounds-changed' is generated after a user move/size operation.
   * The events provide the bounds that would have been applied if the frame was enabled.
   * 'frame-enabled' is generated when a disabled frame has becomes enabled.
   */
  enableFrame(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Flashes the window's frame and taskbar icon until the window is activated.
   */
  flash(options?: any, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Gives focus to the window.
   */
  focus(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves an array of frame info objects representing the main frame and any
   * iframes that are currently on the page.
   */
  getAllFrames(callback?: (frames: FrameInfo[]) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Gets the current bounds (top, left, width, height) of the window.
   */
  getBounds(callback?: (bounds: Bounds) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves an array containing wrapped fin.desktop.Windows that are grouped with this window. If a window is not in a group an empty array is returned.
   * Please note that calling window is included in the result array.
   */
  getGroup(callback?: (group: OpenFinWindow[]) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Gets an information object for the window.
   */
  getInfo(callback?: (info: WindowInfo) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Gets the current settings of the window.
   */
  getOptions(callback?: (options: WindowOption) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Gets a base64 encoded PNG snapshot of the window.
   */
  getSnapshot(callback?: (base64Snapshot: string) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Gets the current state ("minimized", "maximized", or "normal") of the window.
   */
  getState(callback?: (state: "minimized" | "maximized" | "normal") => void, errorCallback?: (reason: string) => void): void;
  /**
   * Returns the zoom level of the window.
   */
  getZoomLevel(callback?: (level: number) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Hides the window.
   */
  hide(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Determines if the window is currently showing.
   */
  isShowing(callback?: (showing: boolean) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Joins the same window group as the specified window.
   */
  joinGroup(target: OpenFinWindow, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Leaves the current window group so that the window can be move independently of those in the group.
   */
  leaveGroup(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Maximizes the window.
   */
  maximize(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Merges the instance's window group with the same window group as the specified window
   */
  mergeGroups(target: OpenFinWindow, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Minimizes the window.
   */
  minimize(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Moves the window by a specified amount.
   */
  moveBy(deltaLeft: number, deltaTop: number, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Moves the window to a specified location.
   */
  moveTo(left: number, top: number, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Navigates the window to a specified URL.
   */
  navigate(url: string, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Navigates the window back one page.
   */
  navigateBack(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Navigates the window forward one page.
   */
  navigateForward(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Reloads the window current page.
   */
  reload(ignoreCacheopt?: boolean, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Removes a previously registered event listener from the specified event.
   */
  removeEventListener(
    type: OpenFinWindowEventType,
    listener: (event: WindowBaseEvent
      | WindowAuthRequestedEvent
      | WindowBoundsEvent
      | WindowExternalProcessStartedEvent
      | WindowExternalProcessExited
      | WindowGroupChangedEvent
      | WindowHiddenEvent
      | Window_NavigationRejectedEvent) => void,
    callback?: () => void,
    errorCallback?: (reason: string) => void): void;
  /**
   * Resizes the window by a specified amount.
   */
  resizeBy(deltaWidth: number, deltaHeight: number, anchor: AnchorType, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Resizes the window by a specified amount.
   */
  resizeTo(width: number, height: number, anchor: AnchorType, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Restores the window to its normal state (i.e., unminimized, unmaximized).
   */
  restore(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Will bring the window to the front of the entire stack and give it focus.
   */
  setAsForeground(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Sets the window's size and position
   */
  setBounds(left: number, top: number, width: number, height: number, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Sets the zoom level of the window.
   */
  setZoomLevel(level: number, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Shows the window if it is hidden.
   * @param Show will be prevented from closing when force is false and 'show-requested' has been subscribed to for application's main window.
   */
  show(force?: boolean, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Shows the window if it is hidden at the specified location. If the toggle parameter is set to true, the window will alternate between showing and hiding.
   */
  showAt(left: number, top: number, force?: boolean, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Stops the taskbar icon from flashing.
   */
  stopFlashing(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Stops any current navigation the window is performing.
   */
  stopNavigation(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Updates the window using the passed options
   */
  updateOptions(options: WindowOption, callback?: () => void, errorCallback?: (reason: string) => void): void;
}



/**
* Application
* An object representing an application. Allows the developer to create, execute, show / close an application as well as listen to application events.
*/
interface OpenFinApplication {
  /**
   * Returns an instance of the main Window of the application
   */
  getWindow(): OpenFinWindow;
  /**
   * Registers an event listener on the specified event.
   */
  addEventListener(
    type: OpenFinApplicationEventType,
    listener: (event: ApplicationBaseEvent
      | TrayIconClickedEvent
      | WindowEvent
      | WindowAlertRequestedEvent
      | WindowAuthRequested
      | WindowNavigationRejectedEvent
      | WindowEndLoadEvent) => void,
    callback?: () => void,
    errorCallback?: (reason: string) => void): void;
  /**
   * Closes the application and any child windows created by the application.
   */
  close(force?: boolean, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves an array of wrapped fin.desktop.Windows for each of the application's child windows.
   */
  getChildWindows(callback?: (children: OpenFinWindow[]) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves an array of active window groups for all of the application's windows. Each group is represented as an array of wrapped fin.desktop.Windows.
   */
  getGroups(callback?: (groups: OpenFinWindow[][]) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves information about the application.
   */
  getInfo(callback?: (info: LaunchInfo) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves the JSON manifest that was used to create the application. Invokes the error callback if the application was not created from a manifest.
   */
  getManifest(callback?: (manifest: any) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves UUID of the application that launches this application. Invokes the error callback if the application was created from a manifest.
   */
  getParentUuid(callback?: (uuid: string) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves current configuration of application's shortcuts.
   */
  getShortcuts(callback?: (config: ShortCutConfig) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Retrieves information about the system tray.
   */
  getTrayIconInfo(callback?: (trayInfo: TrayInfo) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Returns the current zoom level of the application.
   */
  getZoomLevel(callback?: (level: number) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Determines if the application is currently running.
   */
  isRunning(callback?: (running: boolean) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Registers a username and an app name for licensing purposes.
   */
  registerUser(userName: string, appName: string, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Removes a previously registered event listener from the specified event.
   */
  removeEventListener(
    type: OpenFinApplicationEventType,
    previouslyRegisteredListener: (event: ApplicationBaseEvent
      | TrayIconClickedEvent
      | WindowEvent
      | WindowAlertRequestedEvent
      | WindowAuthRequested
      | WindowNavigationRejectedEvent
      | WindowEndLoadEvent) => any,
    callback?: () => void,
    errorCallback?: (reason: string) => void): void;
  /**
   * Removes the application's icon from the tray.
   */
  removeTrayIcon(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Restarts the application.
   */
  restart(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Runs the application. When the application is created, run must be called.
   */
  run(callback?: (successObj: SuccessObj) => void, errorCallback?: (reason: string, errorObj: NetworkErrorInfo) => void): void;
  /**
   * Tells the rvm to relaunch the main application once upon a complete shutdown
   */
  scheduleRestart(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Sends a message to the RVM to upload the application's logs. On success, an object containing logId is returned.
   */
  sendApplicationLog(callback?: (logInfo: applicationLogInfo) => void, errorCallback?: (reason: string) => void): void;
  /**
   * Sets an associated username with that app for Application Log Management use
   */
  setAppLogUsername(username: string, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Sets new shortcut configuration for current application.
   * Application has to be launched with a manifest and has to have shortcut configuration (icon url, name, etc.) in its manifest to
   * be able to change shortcut states.
   */
  setShortcuts(config: ShortCutConfig, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Adds a customizable icon in the system tray and notifies the application when clicked.
   */
  setTrayIcon(iconUrl: string, listener: (clickInfo: TrayIconClickedEvent) => void, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Sets the zoom level of the application. The original size is 0 and each increment above or below represents zooming 20%
   * larger or smaller to default limits of 300% and 50% of original size, respectively.
   */
  setZoomLevel(level: number, callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Closes the application by terminating its process.
   */
  terminate(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * Waits for a hanging application. This method can be called in response to an application "not-responding" to allow the application
   * to continue and to generate another "not-responding" message after a certain period of time.
   */
  wait(callback?: () => void, errorCallback?: (reason: string) => void): void;
  /**
   * The Application's uuid
   */
  uuid: string;
}