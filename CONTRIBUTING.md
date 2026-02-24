# Contributing to Quest Dark Mode

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Quest Dark Mode. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🔴 Energy & Power Policy
All contributions must be energy-efficient.
- **Avoid** heavy JavaScript loops.
- **Prefer** CSS filters and hardware-accelerated transitions.
- **Flag** any feature that requires high **CPU processing power** with a Red Alert in the description.

## How Can I Contribute?

### Reporting Bugs
- Use a clear and descriptive title.
- Describe the exact steps to reproduce the problem.
- Mention which website the bug occurred on.

### Suggesting Enhancements
- Explain why the enhancement would be useful.
- If it's a UI change, try to follow Apple's design language (SF Pro, translucency, rounded corners).

### Pull Requests
- Keep your changes as modular as possible.
- Ensure your code is secure (XSS-free). **Do not use `innerHTML`**.
- Update the README if you are adding a major feature.

## Development Setup
- Project is a **Manifest V3** Web Extension.
- Core logic resides in `content.js` and `manifest.json`.
- Styles use vanilla CSS for maximum compatibility.

Thank you for helping make the web a darker, more beautiful place! 🌙
