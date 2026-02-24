# Quest Dark Mode Safari Extension 🌙✨

A premium, open-source Safari Web Extension designed with Apple's design language in mind. Featuring **Liquid Glass** translucency, a non-intrusive **Integrated Overlay UI**, and a professional **Production-Hardened** core.

## 🚀 Key Features

- **Liquid Glass Translucency**: A stunning glassmorphism effect using deep backdrop blurs and perfectly transparent backgrounds.
- **Integrated Overlay UI**: No more isolated popup windows. The controls float directly on the webpage via a secure **Shadow DOM**.
- **Dark Mode Engine**: Lightweight CSS-filter based engine with **Smart Detection** to prevent double-inversion on already dark sites.
- **Extreme Mode (Pro)**: A high-precision mode using 🔴 throttled `MutationObservers` for complex, dynamic websites.
- **Security First**: 100% free of `innerHTML` to prevent XSS. built with modern Safari Manifest V3 standards.

---

## ⚡️ Energy & Power Impact Audit

As a premium Safari tool, we prioritize your Mac's battery life.

| Feature | Energy Cost | Power Profile | Rationale |
| :--- | :--- | :--- | :--- |
| **Standard Mode** | 🟢 Low | GPU-only | Ultra-efficient CSS transformations. |
| **Liquid Glass UI** | 🟡 Medium | GPU-heavy | High-quality blurs require GPU cycles during paint. |
| **Extreme Mode** | 🔴 High | CPU-heavy | Monitors structure changes; used only when needed. |

---

## 🛠 Installation (Safari Developer)

Since this project is open-source and not yet on the App Store, here is how you can use it locally on your Mac:

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/[your-username]/Dark-TheSafariExtension.git
    ```
2.  **Enable Safari Developer Menu**:
    - Open Safari.
    - Go to **Settings** > **Advanced**.
    - Check **"Show features for web developers"** (or "Show Develop menu in menu bar").
3.  **Allow Unsigned Extensions**:
    - In the menu bar, go to **Develop**.
    - Ensure **"Allow Unsigned Extensions"** is checked.
4.  **Load the Extension**:
    - For a standard Safari Web Extension, you would typically bundle this through Xcode.
    - *For testing web-only files*: You can use the **Extension Builder** or follow Safari's guide for [loading web-extension-based content](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension).

---

## 🤝 Contributing

We love contributions! Whether it's fixing a bug, adding a site-specific rule, or improving the glass styling.

1.  Check out our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
2.  Fork the repository.
3.  Create a feature branch.
4.  Submit a Pull Request.

## ⚖️ License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
