// Inkover background. One job: relay the Safari toolbar button to the page.
// Spec: docs/features/modes-and-lock.md, rule 6.

browser.action.onClicked.addListener((tab) => {
  if (!tab || tab.id == null) return;
  browser.tabs.sendMessage(tab.id, { type: "inkover:toggle" }).catch(() => {
    // No content script on this page (e.g. Safari internal pages). Nothing to do.
  });
});
