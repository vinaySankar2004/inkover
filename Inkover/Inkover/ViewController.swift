//
//  ViewController.swift
//  Inkover
//
//  The wrapper app has one screen: how to turn the extension on, how it works, and the privacy links.
//  All content lives in Resources/Base.lproj/Main.html. This controller only opens URLs.
//

import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self
        self.webView.scrollView.isScrollEnabled = true
        self.webView.isOpaque = false
        self.webView.backgroundColor = .systemGroupedBackground

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
        // There is no public way to open Safari's Extensions screen. The app-settings URL lands on
        // Inkover's own page, which has no extension toggle, so the page gives written steps instead.
        switch action {
        case "openURL":
            if let string = body["url"] as? String, let url = URL(string: string), url.scheme == "https" {
                UIApplication.shared.open(url)
            }
        default:
            break
        }
    }

}
