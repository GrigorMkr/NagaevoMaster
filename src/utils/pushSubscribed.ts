let pushSubscribed = false;

function setPushSubscribed(value: boolean): void {
  pushSubscribed = value;
}

function isPushSubscribedLocally(): boolean {
  return pushSubscribed;
}

export {
  setPushSubscribed,
  isPushSubscribedLocally,
};
